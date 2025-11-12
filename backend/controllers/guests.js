import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);
const toSlug = (s) => (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// Créér un invité //
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
        mediaFileId: null,
        logo: null,
        logoFileId: null,
        mediaName: baseName,
      });

      await doc.save();

      if (req.body.editionId) {
        const Edition = (await import("../models/Edition.js")).default;
        await Edition.findByIdAndUpdate(req.body.editionId, { $push: { guests: doc._id } });
      }

      if (silent) return doc;
      if (res)
        return res.status(201).json({ message: "Invité (vidéo) ajouté avec succès", guest: doc });
      return;
    }

    // === CAS LOGO EXISTANT ===
    if (isLogo && isFileId(body.media)) {
      const details = await imagekit.getFileDetails(body.media).catch(() => null);
      if (!details) throw new Error("Logo existant introuvable sur ImageKit");

      const doc = new Guest({
        name: body.name,
        description: body.description,
        logo: details.url,
        logoFileId: details.fileId,
        media: null,
        mediaFileId: null,
        mediaName: baseName,
      });

      await doc.save();

      if (silent) return doc;
      if (res)
        return res
          .status(201)
          .json({ message: "Invité (logo existant) ajouté avec succès", guest: doc });
      return;
    }

    // === CAS UPLOAD (image ou nouveau logo) ===
    const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";
    let url = null,
      fileId = null,
      fileName = null;

    const existingId = body.mediaFileId || body.media;
    if (isFileId(existingId)) {
      try {
        const details = await imagekit.getFileDetails(existingId);
        url = details.url;
        fileId = details.fileId;
        fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
      } catch {}
    }

    if (!url) {
      const up = await resolveMedia(body.media, req.file, folder, baseName);
      if (!up?.url) {
        if (silent) throw new Error("Média invalide");
        return res.status(400).json("Média invalide");
      }
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

    try {
      await doc.save();
      console.log("=== DEBUG GUEST SAVED ===", doc._id);

      if (silent) return doc;
      if (res) return res.status(201).json({ message: "Invité ajouté avec succès !", guest: doc });
    } catch (error) {
      console.error("❌ Erreur sauvegarde invité :", error);

      // ⚠️ rollback : suppression du média uploadé si la sauvegarde échoue
      if (fileId) {
        try {
          await imagekit.deleteFile(fileId);
          console.log("🧹 Média supprimé suite à échec de création invité");
        } catch (cleanupError) {
          console.error("⚠️ Échec suppression média après erreur :", cleanupError);
        }
      }

      if (!silent && res) return res.status(500).json({ error: "Erreur création invité" });
      return null;
    }
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
    const guestId = req.params.guestId || req.params.id;
    console.log("🧩 updateGuest() called with guestId:", guestId);

    const existing = await Guest.findById(guestId);
    console.log("🧩 existing guest found:", !!existing);

    if (!existing) {
      if (!silent && res) return res.status(404).json("Invité non trouvé");
      else throw new Error("Invité non trouvé");
    }

    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    if (!body.media && req.body.media) body.media = req.body.media;
    if (!body.mediaType && req.body.mediaType) body.mediaType = req.body.mediaType;

    const filtered = {};
    for (const k of ["name", "description"]) {
      if (body[k] !== undefined && body[k] !== "") filtered[k] = body[k];
    }

    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(filtered.name || existing.name);

    // --- Vérification stricte avant tout upload ---
    if (
      !filtered.name ||
      !filtered.description ||
      typeof filtered.name !== "string" ||
      /<!DOCTYPE/i.test(JSON.stringify(req.body))
    ) {
      console.error("⚠️ Requête invalide détectée, aucun upload ni update effectué.");
      if (!silent && res) {
        return res
          .status(400)
          .json({ error: "Requête invalide : champs manquants ou corps mal formé." });
      }
      return; // STOP avant toute tentative d'upload
    }

    const mediaType = (body.mediaType || "").toLowerCase();
    const sentNewMedia = !!req.file || !!body.media || mediaType === "video";

    const oldImageId = existing.mediaFileId || null;
    const oldLogoId = existing.logoFileId || null;

    let newImageId = null;
    let newLogoId = null;

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

    const updated = await Guest.findByIdAndUpdate(guestId, filtered, {
      new: true,
      runValidators: false,
    });

    if (sentNewMedia) {
      if (mediaType === "image" && oldImageId && oldImageId !== newImageId) {
        try {
          await imagekit.deleteFile(oldImageId);
        } catch {}
      }

      if (mediaType === "video") {
        if (oldImageId) {
          try {
            await imagekit.deleteFile(oldImageId);
          } catch {}
        }
        if (oldLogoId && (await isFileInUse(oldLogoId)) === false) {
          try {
            await imagekit.deleteFile(oldLogoId);
          } catch {}
        }
      }

      if (mediaType === "logo" && oldLogoId && newLogoId && oldLogoId !== newLogoId) {
        if ((await isFileInUse(oldLogoId)) === false) {
          try {
            await imagekit.deleteFile(oldLogoId);
          } catch {}
        }
      }

      if (mediaType === "logo" && oldImageId) {
        try {
          await imagekit.deleteFile(oldImageId);
        } catch {}
      }

      if (mediaType === "image" && oldLogoId && (await isFileInUse(oldLogoId)) === false) {
        try {
          await imagekit.deleteFile(oldLogoId);
        } catch {}
      }
    }

    if (silent) return updated;
    if (res && !silent) return res.status(200).json(updated);
  } catch (error) {
    if (!silent && res) res.status(500).json({ error: error.message });
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
  } catch {
    res.status(500).json({ error: "Erreur serveur (deleteGuest)" });
  }
};
