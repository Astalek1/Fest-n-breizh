import Artist from "../models/Artists.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);
const toSlug = (s) => (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// Créér un artiste //
export const createArtist = async (req, res, silent = false) => {
  try {
    const body = JSON.parse(req.body.artist || "{}");
    const mediaType = (body.mediaType || "").toLowerCase();
    const isLogo = mediaType === "logo";
    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(body.name);

    // === CAS VIDÉO ===
    if (mediaType === "video" && body.media) {
      const doc = new Artist({
        name: body.name,
        description: body.description,
        media: body.media,
        mediaFileId: null,
        logo: null,
        logoFileId: null,
        mediaName: baseName,
      });
      console.log("=== DEBUG ARTIST READY TO SAVE ===", doc);

      await doc.save();
      console.log("=== DEBUG ARTIST SAVED ===", doc._id);

      if (req.body.editionId) {
        const Edition = (await import("../models/Edition.js")).default;
        await Edition.findByIdAndUpdate(req.body.editionId, { $push: { artists: doc._id } });
      }

      if (silent) return doc;
      if (res)
        return res.status(201).json({ message: "Artiste (vidéo) ajouté avec succès", artist: doc });
      return;
    }

    // === CAS LOGO EXISTANT ===
    if (isLogo && isFileId(body.media)) {
      const details = await imagekit.getFileDetails(body.media).catch(() => null);
      if (!details) throw new Error("Logo existant introuvable sur ImageKit");

      const doc = new Artist({
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
          .json({ message: "Artiste (logo existant) ajouté avec succès", artist: doc });
      return;
    }

    // === CAS UPLOAD (image ou nouveau logo) ===
    const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/artistes";
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

    const doc = new Artist({
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
      console.log("=== DEBUG ARTIST SAVED ===", doc._id);

      if (silent) return doc;
      if (res)
        return res.status(201).json({ message: "Artiste ajouté avec succès !", artist: doc });
    } catch (error) {
      console.error("❌ Erreur sauvegarde artiste :", error);

      // ⚠️ rollback : suppression du média si la sauvegarde échoue
      if (fileId) {
        try {
          await imagekit.deleteFile(fileId);
          console.log("🧹 Image supprimée suite à échec de création artiste");
        } catch (cleanupError) {
          console.error("⚠️ Échec suppression image après erreur :", cleanupError);
        }
      }

      if (!silent && res) return res.status(500).json({ error: "Erreur création artiste" });
      return null;
    }
  } catch (error) {
    if (!silent && res) res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les artistes //
export const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find();
    res.status(200).json(artists);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Récupérer un artiste //
export const getOneArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");
    res.status(200).json(artist);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Modifier un Artiste //
export const updateArtist = async (req, res, silent = false) => {
  try {
    const artistId = req.params.artistId || req.params.id;
    const existing = await Artist.findById(artistId);
    if (!existing) {
      if (!silent && res) return res.status(404).json("Artiste non trouvé");
      else throw new Error("Artiste non trouvé");
    }

    const body = req.body.artist ? JSON.parse(req.body.artist) : req.body;
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
        const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/artistes";

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

    const updated = await Artist.findByIdAndUpdate(artistId, filtered, {
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
    if (req.file) {
      const folder =
        (req.body.mediaType || "").toLowerCase() === "logo"
          ? "/festn_breizh/logos"
          : "/festn_breizh/artistes";

      // On tente de supprimer le nouveau fichier si l’upload a eu lieu
      if (req.file.filename && req.file.filename.endsWith(".webp")) {
        try {
          const fileName = req.file.originalname.replace(/\.[^/.]+$/, "");
          const search = await imagekit.listFiles({
            searchQuery: `name="${fileName}" AND folder="${folder}"`,
          });
          if (search && search.length > 0) {
            await imagekit.deleteFile(search[0].fileId);
            console.log("Image supprimée suite à échec de mise à jour artiste");
          }
        } catch {}
      }
    }
  }
};

// Supprimer un Artiste //
export const deleteArtist = async (req, res) => {
  try {
    const artistId = req.params.artistId || req.params.id;
    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json("Artiste non trouvé");

    const imgId = artist.mediaFileId || null;
    const logoId = artist.logoFileId || null;

    await Artist.findByIdAndDelete(artistId);

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

    res.status(200).json("artiste supprimé avec succès");
  } catch {
    res.status(500).json({ error: "Erreur serveur (deleteArtist)" });
  }
};
