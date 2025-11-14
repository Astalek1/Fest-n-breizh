import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);
const toSlug = (s) => (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// Création d'un invité //
export const createGuest = async (req, res, silent = false) => {
  try {
    const body = JSON.parse(req.body.guest || "{}");
    const mediaType = (body.mediaType || "").toLowerCase();
    const isLogo = mediaType === "logo";

    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(body.name);

    // === CAS VIDÉO ===
    if (mediaType === "video" && body.media) {
      const doc = new Guest({
        name: body.name,
        description: body.description,
        media: body.media,
        mediaName: baseName,
        mediaType,
      });

      await doc.save();

      if (req.body.editionId) {
        const Edition = (await import("../models/Edition.js")).default;
        await Edition.findByIdAndUpdate(req.body.editionId, { $push: { guests: doc._id } });
      }

      if (silent) return doc;
      return res.status(201).json({ message: "Invité (vidéo) ajouté avec succès", guest: doc });
    }

    // === CAS LOGO EXISTANT ===
    if (isLogo && isFileId(body.media)) {
      const details = await imagekit.getFileDetails(body.media);
      const doc = new Guest({
        name: body.name,
        description: body.description,
        logo: details.url,
        logoFileId: details.fileId,
        mediaName: baseName,
        mediaType,
      });

      await doc.save();

      if (req.body.editionId) {
        const Edition = (await import("../models/Edition.js")).default;
        await Edition.findByIdAndUpdate(req.body.editionId, { $push: { guests: doc._id } });
      }

      if (silent) return doc;
      return res
        .status(201)
        .json({ message: "Invité (logo existant) ajouté avec succès", guest: doc });
    }

    // === CAS IMAGE OU NOUVEAU LOGO ===
    const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";
    const up = await resolveMedia(body.media, req.file, folder, baseName);
    if (!up?.url) throw new Error("Échec de l’upload du média");

    const doc = new Guest({
      name: body.name,
      description: body.description,
      media: !isLogo ? up.url : null,
      mediaFileId: !isLogo ? up.fileId : null,
      logo: isLogo ? up.url : null,
      logoFileId: isLogo ? up.fileId : null,
      mediaName: up.fileName || baseName,
      mediaType,
    });

    await doc.save();

    if (req.body.editionId) {
      const Edition = (await import("../models/Edition.js")).default;
      await Edition.findByIdAndUpdate(req.body.editionId, { $push: { guests: doc._id } });
    }

    if (silent) return doc;
    return res.status(201).json({ message: "Invité ajouté avec succès", guest: doc });
  } catch (error) {
    if (!silent && res) res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les invités //
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find();
    res.status(200).json(guests);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Récupérer un invité //
export const getOneGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");
    res.status(200).json(guest);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Modifier un invité //
export const updateGuest = async (req, res, silent = false) => {
  try {
    const isSilent = typeof silent === "boolean" ? silent : false;
    // --- Récupération de l’invité ---
    const guestId = req.params.guestId || req.params.id;
    const existing = await Guest.findById(guestId);
    if (!existing) {
      if (!silent && res) return res.status(404).json("Invité non trouvé");
      throw new Error("Invité non trouvé");
    }

    // --- Lecture du body ---
    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    if (!body.media && req.body.media) body.media = req.body.media;
    if (!body.mediaType && req.body.mediaType) body.mediaType = req.body.mediaType;

    // --- Filtrage des champs texte ---
    const filtered = {};
    for (const key of ["name", "description"]) {
      if (body[key]) filtered[key] = body[key];
    }

    // --- Préparation du nom de base ---
    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(filtered.name || existing.name);

    // --- Détermination du type de média ---
    const mediaType = (body.mediaType || "").toLowerCase();
    const sentNewMedia = !!req.file || !!body.media || mediaType === "video";
    const oldImageId = existing.mediaFileId || null;
    const oldLogoId = existing.logoFileId || null;

    let newImageId = null;
    let newLogoId = null;

    // --- TRAITEMENT DU NOUVEAU MÉDIA ---
    if (sentNewMedia) {
      if (mediaType === "video") {
        filtered.media = body.media || existing.media;
        filtered.mediaFileId = null;
        filtered.logo = null;
        filtered.logoFileId = null;
        filtered.mediaName = baseName;
      } else {
        const isLogo = mediaType === "logo";
        const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";
        let url, fileId, fileName;

        if (isFileId(body.media)) {
          const details = await imagekit.getFileDetails(body.media);
          url = details.url;
          fileId = details.fileId;
          fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
        } else {
          const up = await resolveMedia(body.media, req.file, folder, `${baseName}-${Date.now()}`);
          if (!up?.url) return res.status(400).json("Média invalide ou introuvable");
          url = up.url;
          fileId = up.fileId || null;
          fileName = up.fileName || baseName;
        }

        if (isLogo) {
          filtered.logo = url;
          filtered.logoFileId = fileId;
          filtered.media = null;
          filtered.mediaFileId = null;
          newLogoId = fileId;
        } else {
          filtered.media = url;
          filtered.mediaFileId = fileId;
          filtered.logo = null;
          filtered.logoFileId = null;
          newImageId = fileId;
        }
        filtered.mediaName = fileName;
      }
    }

    // --- MISE À JOUR MONGODB ---
    const updated = await Guest.findByIdAndUpdate(guestId, filtered, {
      new: true,
      runValidators: false,
    });

    // ---SUPPRESSION ANCIENS MÉDIAS (tous cas) ---

    // === Cas 1 : passage à une vidéo ===
    try {
      if (mediaType === "video") {
        if (oldImageId) {
          await imagekit.deleteFile(oldImageId);
        }
        if (oldLogoId) {
          const used = await isFileInUse(oldLogoId);
          if (!used) {
            await imagekit.deleteFile(oldLogoId);
          }
        }
      }

      // === Cas 2 : nouvelle image (remplace une image ou un logo précédent) ===
      if (mediaType === "image") {
        // Supprimer ancienne image si différente
        if (oldImageId && oldImageId !== newImageId) {
          await imagekit.deleteFile(oldImageId);
        }
        // Supprimer ancien logo si présent et plus utilisé
        if (oldLogoId && oldLogoId !== newLogoId) {
          const used = await isFileInUse(oldLogoId);
          if (!used) {
            await imagekit.deleteFile(oldLogoId);
          }
        }
      }

      // === Cas 3 : nouveau logo (remplace un logo ou une image précédente) ===
      if (mediaType === "logo") {
        // Supprimer ancienne image si existante
        if (oldImageId && oldImageId !== newImageId) {
          await imagekit.deleteFile(oldImageId);
        }
        // Supprimer ancien logo si différent et non utilisé ailleurs
        if (oldLogoId && oldLogoId !== newLogoId) {
          const used = await isFileInUse(oldLogoId);
          if (!used) {
            await imagekit.deleteFile(oldLogoId);
          }
        }
      }
    } catch (error) {
      console.warn("Erreur pendant la suppression des anciens médias:", error.message);
    }

    if (req.file?.stream && !req.file.stream.destroyed) {
      req.file.stream.destroy();
    }

    if (!isSilent && res) {
      return res.status(200).json(updated);
    }
    return updated;
  } catch (error) {
    if (!isSilent && res) {
      return res.status(500).json({ error: error.message || "Erreur inconnue dans updateGuest" });
    }
  }
};

// Supprimer un invité //
export const deleteGuest = async (req, res) => {
  try {
    const guestId = req.params.guestId || req.params.id;
    const guest = await Guest.findById(guestId);
    if (!guest) return res.status(404).json("Invité non trouvé");

    const imgId = guest.mediaFileId || null;
    const logoId = guest.logoFileId || null;

    await Guest.findByIdAndDelete(guestId);

    if (imgId) {
      try {
        await imagekit.deleteFile(imgId);
      } catch {}
    }

    if (logoId && (await isFileInUse(logoId)) === false) {
      try {
        await imagekit.deleteFile(logoId);
      } catch {}
    }

    res.status(200).json("Invité supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteGuest)" });
  }
};
