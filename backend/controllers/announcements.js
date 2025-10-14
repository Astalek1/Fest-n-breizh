import Announcement from "../models/Announcements.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// Créer une nouvelle annonce
export const newAnnouncement = async (req, res) => {
  try {
    const data = JSON.parse(req.body.announcement || "{}");

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      req.file?.originalname
        ?.split(".")[0]
        .replace(/\s+/g, "-")
        .toLowerCase() ||
      (data.title
        ? data.title.replace(/\s+/g, "-").toLowerCase()
        : `media-${Date.now()}`);

    let mediaResult = { url: null, fileId: null };

    if (data.mediaType === "video") {
      mediaResult.url = data.media || null;
    } else if (req.file || data.media) {
      const folder =
        data.mediaType === "logo"
          ? "/festn_breizh/logos"
          : "/festn_breizh/accueil";
      mediaResult = await resolveMedia(data.media, req.file, folder, cleanName);
    }

    const newAnnouncement = new Announcement({
      title: data.title,
      text: data.text,
      url: data.url || null,
      media: mediaResult.url,
      mediaFileId: mediaResult.fileId,
      mediaType: data.mediaType,
      mediaName: mediaResult.fileName || cleanName,
    });

    await newAnnouncement.save();
    res.status(201).json({ message: "Annonce créée avec succès !" });
  } catch (error) {
    console.error("Erreur newAnnouncement :", error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir toutes les annonces
export const getAllAnnouncements = async (req, res) => {
  try {
    const list = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Obtenir une seule annonce
export const getOneAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json("Annonce non trouvée");
    res.status(200).json(announcement);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Modifier une annonce
export const updateAnnouncement = async (req, res) => {
  try {
    const existing = await Announcement.findById(req.params.id);
    if (!existing) return res.status(404).json("Annonce non trouvée");

    let body = {};
    try {
      body = req.body.announcement
        ? JSON.parse(req.body.announcement)
        : req.body;
    } catch {
      body = req.body || {};
    }

    const filtered = {};
    for (const field of ["title", "text", "url"]) {
      if (body[field] !== undefined) filtered[field] = body[field];
    }

    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      existing.mediaName ||
      (body.title || existing.title || "media")
        .replace(/\s+/g, "-")
        .toLowerCase();

    const nextType = body.mediaType || existing.mediaType;
    const oldFileId = existing.mediaFileId;
    let newFileId = oldFileId;
    let didChangeFile = false;

    // === Cas 1 : Vidéo (URL uniquement) ===
    if (nextType === "video") {
      filtered.media = body.media || existing.media;
      filtered.mediaFileId = null;
      filtered.mediaName = baseName;
      didChangeFile = !!oldFileId; // suppression du fichier précédent si existait
    }

    // === Cas 2 : Logo ===
    else if (nextType === "logo") {
      if (!req.file && body.media && /^[a-zA-Z0-9]{8,}$/.test(body.media)) {
        // Réutilisation d’un logo existant
        const details = await imagekit.getFileDetails(body.media);
        filtered.media = details.url;
        filtered.mediaFileId = details.fileId;
        filtered.mediaName = baseName;
        newFileId = details.fileId;
        didChangeFile = oldFileId && oldFileId !== newFileId;
      } else if (req.file || (body.media && /^https?:\/\//i.test(body.media))) {
        // Nouveau logo
        const uploaded = await resolveMedia(
          body.media,
          req.file,
          "/festn_breizh/logos",
          baseName
        );
        if (!uploaded?.url) return res.status(400).json("Logo invalide");

        filtered.media = uploaded.url;
        filtered.mediaFileId = uploaded.fileId;
        filtered.mediaName = uploaded.fileName || baseName;
        newFileId = uploaded.fileId;
        didChangeFile = oldFileId && oldFileId !== newFileId;
      }
    }

    // === Cas 3 : Photo ===
    else if (nextType === "photo") {
      const hasNewFile =
        !!req.file || (body.media && /^https?:\/\//i.test(body.media));

      if (hasNewFile) {
        // Remplacement par NOUVELLE photo
        const uploaded = await resolveMedia(
          body.media,
          req.file,
          "/festn_breizh/accueil",
          baseName
        );
        if (!uploaded?.url) return res.status(400).json("Photo invalide");

        filtered.media = uploaded.url;
        filtered.mediaFileId = uploaded.fileId;
        filtered.mediaName = uploaded.fileName || baseName;

        newFileId = uploaded.fileId;
        didChangeFile = oldFileId && oldFileId !== newFileId;
      } else if (
        existing.mediaFileId &&
        baseName &&
        baseName !== (existing.mediaName || "")
      ) {
        // Renommage de la photo EXISTANTE (pas de réupload)
        const ext = (existing.media?.split(".").pop() || "webp").toLowerCase();
        const newName = `${baseName}.${ext}`;

        await imagekit.updateFileDetails(existing.mediaFileId, {
          name: newName,
        });

        filtered.media = existing.media.replace(/[^/]+$/, newName);
        filtered.mediaName = baseName;

        // Pas de changement de fileId → pas de suppression à faire
        newFileId = oldFileId;
        didChangeFile = false;
      }
    }

    // Mise à jour en base
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      filtered,
      {
        new: true,
        runValidators: true,
      }
    );

    // Suppression de l’ancien fichier si nécessaire
    if (didChangeFile && oldFileId) {
      if (nextType === "photo") {
        // Photo → suppression directe
        try {
          await imagekit.deleteFile(oldFileId);
        } catch (e) {
          console.error(
            "Suppression ancienne photo échouée :",
            e?.message || e
          );
        }
      } else if (nextType === "logo") {
        // Logo → suppression conditionnelle
        const inUse = await isFileInUse(oldFileId);
        if (!inUse) {
          try {
            await imagekit.deleteFile(oldFileId);
          } catch (e) {
            console.error("Suppression ancien logo échouée :", e?.message || e);
          }
        }
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Erreur updateAnnouncement :", error);
    res.status(500).json({ error: "Erreur serveur (updateAnnouncement)" });
  }
};

// Supprimer une annonce
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json("Annonce non trouvée");

    const { mediaType, mediaFileId } = announcement;

    await Announcement.findByIdAndDelete(req.params.id);

    if (mediaFileId) {
      if (mediaType === "photo") {
        // Suppression directe
        await imagekit.deleteFile(mediaFileId);
      } else if (mediaType === "logo") {
        // Suppression conditionnelle
        const inUse = await isFileInUse(mediaFileId);
        if (!inUse) await imagekit.deleteFile(mediaFileId);
      }
    }

    res.status(200).json("Annonce supprimée avec succès");
  } catch (error) {
    console.error("Erreur deleteAnnouncement :", error);
    res.status(500).json({ error: "Erreur serveur (deleteAnnouncement)" });
  }
};
