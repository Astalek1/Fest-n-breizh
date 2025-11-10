import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);
const toSlug = (s) => (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// === CRÉER UN INVITÉ ===

export const createGuest = async (req, res, silent = false) => {
  try {
    const body = JSON.parse(req.body.guest || "{}");
    console.log("DEBUG guest body:", body);

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
        media: body.media || null,
        mediaFileId: null,
        logo: null,
        logoFileId: null,
        mediaName: baseName,
      });
      console.log("DEBUG new Guest =>", {
        name: body.name,
        description: body.description,
        media: isLogo ? null : url,
      });

      await doc.save();
      if (req.body.editionId) {
        try {
          const Edition = (await import("../models/Edition.js")).default;
          await Edition.findByIdAndUpdate(req.body.editionId, {
            $push: { guests: doc._id },
          });
          console.log("✅ Invité lié à l’édition :", req.body.editionId);
        } catch (err) {
          console.error("❌ Erreur liaison invité/édition :", err.message);
        }
      }

      if (silent) return doc;
      if (res)
        return res
          .status(201)
          .json({ message: "Invité (vidéo) ajouté avec succès !", artist: doc });
      return;
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
      console.log("UPLOAD INVITES:", { name: body.name, mediaType, folder });
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
    console.log("==== DEBUG CHECKPOINT ====");
    console.log("body:", body);
    console.log("url:", url);
    console.log("fileId:", fileId);
    console.log("fileName:", fileName);
    console.log("isLogo:", isLogo);
    console.log(
      "req.file:",
      req.file
        ? { fieldname: req.file.fieldname, mimetype: req.file.mimetype, size: req.file.size }
        : "Aucun fichier reçu"
    );
    console.log("===========================");

    if (!body.name || !body.description) {
      console.error("❌ body.name ou body.description manquant !");
    } else {
      console.log("✅ body.name et body.description détectés !");
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

    console.log("=== DEBUG BEFORE SAVE DOC ===", doc);
    await doc.save();
    console.log("=== DEBUG AFTER SAVE ===");

    if (silent) return doc;
    if (res) return res.status(201).json({ message: "Invité ajouté avec succès !", artist: doc });
  } catch (error) {
    console.error("newGuest error:", error);
    if (!silent && res) res.status(500).json({ error: error.message });
  }
};

// === RÉCUPÉRER TOUS LES INVITÉS ===
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find();
    res.status(200).json(guests);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === RÉCUPÉRER UN INVITÉ ===
export const getOneGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");
    res.status(200).json(guest);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === MODIFIER UN INVITÉ ===
export const updateGuest = async (req, res, silent = false) => {
  try {
    const guestId = req.params.guestId || req.params.id;
    const existing = await Guest.findById(guestId);

    if (!existing) {
      if (!silent && res) return res.status(404).json("Invité non trouvé");
      else throw new Error("Invité non trouvé");
    }

    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    if (!body.mediaType && req.body.mediaType) body.mediaType = req.body.mediaType;

    // --- 1) Champs textuels ---
    const filtered = {};
    for (const k of ["name", "description"]) {
      if (body[k] !== undefined && body[k] !== "") filtered[k] = body[k];
    }

    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(filtered.name || existing.name);

    const mediaType = (body.mediaType || "").toLowerCase();
    const sentNewMedia = !!req.file || !!body.media || mediaType === "video";

    const oldImageId = existing.mediaFileId || null;
    const oldLogoId = existing.logoFileId || null;

    let newImageId = null;
    let newLogoId = null;

    // --- 2) Préparation de la mise à jour ---
    console.log(
      "DEBUG sentNewMedia:",
      sentNewMedia,
      "| req.file:",
      !!req.file,
      "| body.media:",
      !!body.media,
      "| mediaType:",
      mediaType
    );

    if (sentNewMedia) {
      if (mediaType === "video") {
        filtered.media = body.media || existing.media;
        filtered.mediaFileId = null;
        filtered.logo = null;
        filtered.logoFileId = null;
        filtered.mediaName = baseName;
      } else {
        const isLogo = mediaType === "logo";
        console.log(
          "DEBUG updateGuest mediaType:",
          mediaType,
          "→ dossier:",
          isLogo ? "logos" : "invités"
        );
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
    const updated = await Guest.findByIdAndUpdate(guestId, filtered, {
      new: true,
      runValidators: false,
    });

    // --- 4) Nettoyage post-update ---
    if (sentNewMedia) {
      if (mediaType === "image" && oldImageId && oldImageId !== newImageId) {
        try {
          const details = await imagekit.getFileDetails(oldImageId).catch(() => null);
          if (details) {
            await imagekit.deleteFile(oldImageId);
          }
        } catch (e) {
          console.error("Erreur suppression ancienne image :", e?.message || e);
        }
      }

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

      if (mediaType === "logo" && oldImageId) {
        try {
          await imagekit.deleteFile(oldImageId);
        } catch (e) {
          console.error("Suppression ancienne image échouée :", e?.message || e);
        }
      }

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
    }

    // --- 5) Réponse finale ---
    if (silent) return updated;

    if (res && !silent) {
      return res.status(200).json(updated);
    }
  } catch (error) {
    console.error("updateGuest error:", error);
    if (!silent && res) res.status(500).json({ error: error.message });
  }
};

// === SUPPRIMER UN INVITÉ ===
export const deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");

    const imgId = guest.mediaFileId || null;
    const logoId = guest.logoFileId || null;

    await Guest.findByIdAndDelete(req.params.id);

    if (imgId) {
      try {
        await imagekit.deleteFile(imgId);
      } catch (e) {
        console.error("Suppression image échouée :", e?.message || e);
      }
    }

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
