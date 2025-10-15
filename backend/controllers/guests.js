// controllers/guests.js
import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// Util
const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9]{8,}$/.test(v);
const toSlug = (s) =>
  (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// =========================
// Créer un nouvel invité
// =========================
export const newGuest = async (req, res) => {
  try {
    const body = JSON.parse(req.body.guest || "{}");

    const mediaType = (body.mediaType || "").toLowerCase(); // "image" | "logo" | "video"
    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(body.name);

    // Cas vidéo: URL uniquement, aucun fichier ImageKit
    if (mediaType === "video") {
      const doc = new Guest({
        name: body.name,
        description: body.description,
        media: body.media || null, // URL
        mediaFileId: null,
        logo: null,
        logoFileId: null,
        mediaName: baseName,
      });
      await doc.save();
      return res
        .status(201)
        .json({ message: "Invité (vidéo) ajouté avec succès !" });
    }

    // Image ou logo
    const isLogo = mediaType === "logo";
    const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";

    let url = null;
    let fileId = null;
    let fileName = null;

    if (isFileId(body.media)) {
      // Réutilisation d'un fichier existant (surtout pour les logos)
      const details = await imagekit.getFileDetails(body.media);
      url = details.url;
      fileId = details.fileId;
      fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
    } else {
      // Upload ou URL http(s)
      const up = await resolveMedia(body.media, req.file, folder, baseName);
      if (!up?.url) return res.status(400).json("Média invalide");
      url = up.url;
      fileId = up.fileId || null;
      fileName = up.fileName || baseName;
    }

    const doc = new Guest({
      name: body.name,
      description: body.description,
      media: isLogo ? null : url,
      mediaFileId: isLogo ? null : fileId,
      logo: isLogo ? url : null,
      logoFileId: isLogo ? fileId : null,
      mediaName: fileName,
    });
    await doc.save();
    res.status(201).json({ message: "Invité ajouté avec succès !" });
  } catch (error) {
    console.error("newGuest error:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================
// Récupérer tous les invités
// =========================
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find();
    res.status(200).json(guests);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// =========================
// Récupérer un invité
// =========================
export const getOneGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");
    res.status(200).json(guest);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// =========================
// Modifier un invité
// =========================
export const updateGuest = async (req, res) => {
  try {
    const existing = await Guest.findById(req.params.id);
    if (!existing) return res.status(404).json("Invité non trouvé");

    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;

    // Mises à jour partielles textuelles
    const filtered = {};
    for (const k of ["name", "description"]) {
      if (body[k] !== undefined && body[k] !== "") filtered[k] = body[k];
    }

    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(filtered.name || existing.name);

    const mediaType = (body.mediaType || "").toLowerCase(); // "image" | "logo" | "video" | ""
    const sentNewMedia = !!req.file || !!body.media || mediaType === "video";

    // Conserver les anciens IDs pour le nettoyage post-update
    const oldImageId = existing.mediaFileId || null;
    const oldLogoId = existing.logoFileId || null;

    // 1) Préparer la MAJ média (sans rien supprimer avant)
    if (sentNewMedia) {
      if (mediaType === "video") {
        filtered.media = body.media || existing.media; // URL
        filtered.mediaFileId = null;
        filtered.logo = null;
        filtered.logoFileId = null;
        filtered.mediaName = baseName;
      } else {
        const isLogo = mediaType === "logo";
        const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";

        let url = null;
        let fileId = null;
        let fileName = null;

        if (isFileId(body.media)) {
          const details = await imagekit.getFileDetails(body.media);
          url = details.url;
          fileId = details.fileId;
          fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
        } else {
          const up = await resolveMedia(
            body.media,
            req.file,
            folder,
            `${baseName}-${Date.now()}`
          );
          if (!up?.url)
            return res.status(400).json("Média invalide ou introuvable");
          url = up.url;
          fileId = up.fileId || null;
          fileName = up.fileName || baseName;
        }

        if (isLogo) {
          filtered.logo = url;
          filtered.logoFileId = fileId;
          filtered.media = null;
          filtered.mediaFileId = null;
        } else {
          filtered.media = url;
          filtered.mediaFileId = fileId;
          filtered.logo = null;
          filtered.logoFileId = null;
        }
        filtered.mediaName = fileName;
      }
    } else if (req.body.fileName) {
      // Renommage logique côté DB (pas de renommage chez ImageKit ici)
      filtered.mediaName = baseName;
    }

    // 2) Écrire en base d'abord
    const updated = await Guest.findByIdAndUpdate(req.params.id, filtered, {
      new: true,
      runValidators: true,
    });

    // 3) Nettoyage après succès de la mise à jour
    if (sentNewMedia) {
      // a) Si on est passé à un LOGO → l’ancienne image doit être supprimée (images non réutilisées)
      if (mediaType === "logo" && oldImageId) {
        try {
          await imagekit.deleteFile(oldImageId);
        } catch (e) {
          console.error(
            "Suppression ancienne image échouée :",
            e?.message || e
          );
        }
      }

      // b) Si on est passé à une IMAGE → l’ancien logo peut être supprimé seulement s’il est inutilisé
      if (mediaType === "image" && oldLogoId) {
        const inUse = await isFileInUse(oldLogoId);
        if (inUse === false) {
          try {
            await imagekit.deleteFile(oldLogoId);
          } catch (e) {
            console.error("Suppression ancien logo échouée :", e?.message || e);
          }
        }
      }

      // c) Si on a remplacé un LOGO par un autre LOGO (fileId différent) → suppression conditionnelle de l’ancien
      if (
        mediaType === "logo" &&
        oldLogoId &&
        updated.logoFileId &&
        oldLogoId !== updated.logoFileId
      ) {
        const inUse = await isFileInUse(oldLogoId);
        if (inUse === false) {
          try {
            await imagekit.deleteFile(oldLogoId);
          } catch (e) {
            console.error("Suppression ancien logo échouée :", e?.message || e);
          }
        }
      }

      // d) Si on a remplacé une IMAGE par une autre IMAGE → supprimer l’ancienne image
      if (
        mediaType === "image" &&
        oldImageId &&
        updated.mediaFileId &&
        oldImageId !== updated.mediaFileId
      ) {
        try {
          await imagekit.deleteFile(oldImageId);
        } catch (e) {
          console.error(
            "Suppression ancienne image échouée :",
            e?.message || e
          );
        }
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("updateGuest error:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================
// Supprimer un invité
// =========================
export const deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");

    const imgId = guest.mediaFileId || null;
    const logoId = guest.logoFileId || null;

    await Guest.findByIdAndDelete(req.params.id);

    // Images: suppression directe (non réutilisées)
    if (imgId) {
      try {
        await imagekit.deleteFile(imgId);
      } catch (e) {
        console.error("Suppression image échouée :", e?.message || e);
      }
    }

    // Logos: suppression conditionnelle (peuvent être réutilisés)
    if (logoId) {
      const inUse = await isFileInUse(logoId);
      if (inUse === false) {
        try {
          await imagekit.deleteFile(logoId);
        } catch (e) {
          console.error("Suppression logo échouée :", e?.message || e);
        }
      }
    }

    res.status(200).json("Invité supprimé avec succès");
  } catch (error) {
    console.error("deleteGuest error:", error);
    res.status(500).json({ error: "Erreur serveur (deleteGuest)" });
  }
};
