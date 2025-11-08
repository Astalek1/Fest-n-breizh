import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);
const toSlug = (s) => (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// Créer un nouvel invité //
export const createGuest = async (req, res, silent = false) => {
  try {
    const body = JSON.parse(req.body.guest || "{}");

    const mediaType = (body.mediaType || "").toLowerCase(); // "image" | "logo" | "video"
    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(body.name);

    // === CAS VIDÉO ===
    if (mediaType === "video") {
      const doc = new Guest({
        name: body.name,
        description: body.description,
        media: body.media || null, // URL vidéo
        mediaFileId: null,
        logo: null,
        logoFileId: null,
        mediaName: baseName,
      });
      await doc.save();
      if (silent) return doc;
      if (res) return res.status(201).json({ message: "Invité (vidéo) ajouté avec succès !" });
    }

    // === DÉTERMINATION DU DOSSIER ===
    const isLogo = mediaType === "logo";
    const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";

    // === GESTION DU MÉDIA ===
    let url = null;
    let fileId = null;
    let fileName = null;

    const existingId = body.mediaFileId || body.media;
    if (isFileId(existingId)) {
      try {
        const details = await imagekit.getFileDetails(existingId);
        url = details.url;
        fileId = details.fileId;
        fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
      } catch (err) {
        console.warn("⚠️ mediaFileId introuvable :", existingId);
      }
    }

    if (!url) {
      console.log("UPLOAD INVITÉ:", { name: body.name, mediaType, folder });
      console.log("req.file présent ?", !!req.file);

      // a suprimer apres test
      console.log("DEBUG createGuest → req.file:", !!req.file, "mediaType:", mediaType);

      const up = await resolveMedia(body.media, req.file, folder, baseName);
      if (!up?.url) {
        if (silent) throw new Error("Média invalide");
        return res.status(400).json("Média invalide");
      }
      url = up.url;
      fileId = up.fileId || null;
      fileName = up.fileName || baseName;
    }

    // === ENREGISTREMENT DU DOCUMENT ===
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

    if (silent) return doc;
    if (res) res.status(201).json({ message: "Invité ajouté avec succès !" });
  } catch (error) {
    console.error("newGuest error:", error);
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
    const existing = await Guest.findById(req.params.id);
    if (!existing) {
      if (!silent && res) return res.status(404).json("innvité non trouvé");
      else throw new Error("invité non trouvé");
    }

    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;

    // --- 1) Champs textuels ---
    const filtered = {};
    for (const k of ["name", "description"]) {
      if (body[k] !== undefined && body[k] !== "") filtered[k] = body[k];
    }

    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(filtered.name || existing.name);

    const mediaType = (body.mediaType || "").toLowerCase(); // image | logo | video
    const sentNewMedia = !!req.file || !!body.media || mediaType === "video";

    const oldImageId = existing.mediaFileId || null;
    const oldLogoId = existing.logoFileId || null;

    let newImageId = null;
    let newLogoId = null;

    // --- 2) Préparation de la mise à jour ---
    if (sentNewMedia) {
      if (mediaType === "video") {
        // Passage vers vidéo : suppression image + logo
        filtered.media = body.media || existing.media;
        filtered.mediaFileId = null;
        filtered.logo = null;
        filtered.logoFileId = null;
        filtered.mediaName = baseName;
      } else {
        const isLogo = mediaType === "logo";
        const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invites";

        let url = null;
        let fileId = null;
        let fileName = null;

        if (isFileId(body.media)) {
          // Utilisation d’un fichier existant
          const details = await imagekit.getFileDetails(body.media);
          url = details.url;
          fileId = details.fileId;
          fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
        } else {
          // Upload ou URL
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
    } else if (req.body.fileName) {
      filtered.mediaName = baseName;
    }

    // --- 3) Mise à jour en base ---
    const updated = await Guest.findByIdAndUpdate(req.params.id, filtered, {
      new: true,
      runValidators: false,
    });

    // --- 4) Nettoyage post-update ---
    if (sentNewMedia) {
      // Passage vers vidéo → supprimer ancienne image et logo
      if (mediaType === "video") {
        if (oldImageId) {
          try {
            await imagekit.deleteFile(oldImageId);
          } catch (e) {
            console.error("Suppression ancienne image échouée :", e?.message || e);
          }
        }
        if (oldLogoId) {
          const inUse = await isFileInUse(oldLogoId);
          if (inUse === false) {
            try {
              await imagekit.deleteFile(oldLogoId);
            } catch (e) {
              console.error("Suppression ancien logo échouée :", e?.message || e);
            }
          }
        }
      }

      // Passage vers LOGO → supprimer ancienne IMAGE
      if (mediaType === "logo" && oldImageId) {
        try {
          await imagekit.deleteFile(oldImageId);
        } catch (e) {
          console.error("Suppression ancienne image échouée :", e?.message || e);
        }
      }

      // Passage vers IMAGE → supprimer ancien LOGO s’il n’est plus utilisé
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

      // Remplacement LOGO → LOGO
      if (mediaType === "logo" && oldLogoId && newLogoId && oldLogoId !== newLogoId) {
        const inUse = await isFileInUse(oldLogoId);
        if (inUse === false) {
          try {
            await imagekit.deleteFile(oldLogoId);
          } catch (e) {
            console.error("Suppression ancien logo échouée :", e?.message || e);
          }
        }
      }

      // Remplacement IMAGE → IMAGE (corrigé)
      if (mediaType === "image" && oldImageId) {
        if ((newImageId && oldImageId !== newImageId) || req.file) {
          try {
            await imagekit.deleteFile(oldImageId);
            console.log("Ancienne image supprimée :", oldImageId);
          } catch (e) {
            console.error("Suppression ancienne image échouée :", e?.message || e);
          }
        }
      }
    }

    // --- 5) Réponse finale ---
    if (silent) return updated;
    res.status(200).json(updated);
  } catch (error) {
    console.error("updateGuest error:", error);
    if (!silent && res) {
      res.status(500).json({ error: error.message });
    } else {
      throw error;
    }
  }
};

// suprimer un invité //
export const deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");

    const imgId = guest.mediaFileId || null;
    const logoId = guest.logoFileId || null;

    // Supprime d’abord le document pour éviter les ré-lectures
    await Guest.findByIdAndDelete(req.params.id);

    // Images : suppression directe
    if (imgId) {
      try {
        await imagekit.deleteFile(imgId);
        console.log("Image supprimée : ", imgId);
      } catch (e) {
        console.error("Suppression image échouée :", e?.message || e);
      }
    }

    // Logos : suppression conditionnelle (peuvent être réutilisés)
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
