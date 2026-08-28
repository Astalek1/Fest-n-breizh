import Artist from "../models/Artists.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);
const toSlug = (s) => (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// Création d'un artiste //
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
        mediaName: baseName,
        mediaType,
      });

      await doc.save();

      if (req.body.editionId) {
        const Edition = (await import("../models/Edition.js")).default;
        await Edition.findByIdAndUpdate(req.body.editionId, { $push: { artists: doc._id } });
      }

      if (silent) return doc;
      return res.status(201).json({ message: "Artiste (vidéo) ajouté avec succès", artist: doc });
    }

    // === CAS LOGO EXISTANT ===
    if (isLogo && isFileId(body.media)) {
      const details = await imagekit.getFileDetails(body.media);
      const doc = new Artist({
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
        await Edition.findByIdAndUpdate(req.body.editionId, { $push: { artists: doc._id } });
      }

      if (silent) return doc;
      return res
        .status(201)
        .json({ message: "Artiste (logo existant) ajouté avec succès", artist: doc });
    }

    // === CAS IMAGE OU NOUVEAU LOGO ===
    const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/artistes";
    const up = await resolveMedia(body.media, req.file, folder, baseName);
    if (!up?.url) throw new Error("Échec de l’upload du média");

    const doc = new Artist({
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
      await Edition.findByIdAndUpdate(req.body.editionId, { $push: { artists: doc._id } });
    }

    if (silent) return doc;
    return res.status(201).json({ message: "Artiste ajouté avec succès", artist: doc });
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

// Modifier un artiste //
export const updateArtist = async (req, res, silent = false) => {
  try {
    const isSilent = typeof silent === "boolean" ? silent : false;
    // --- Récupération de l’invité ---
    const artistId = req.params.artistId || req.params.id;
    const existing = await Artist.findById(artistId);
    if (!existing) {
      if (!silent && res) return res.status(404).json("Artiste non trouvé");
      throw new Error("Artiste non trouvé");
    }

    // --- Lecture du body ---
    const body = req.body.artist ? JSON.parse(req.body.artist) : req.body;
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
    if (mediaType) {
      filtered.mediaType = mediaType;
    }
    const sentNewMedia =
    !!req.file ||
    mediaType === "video" ||
    (mediaType === "logo" && isFileId(body.media));
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
        const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/artistes";
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
    const updated = await Artist.findByIdAndUpdate(artistId, filtered, {
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
     if (mediaType === "image" && sentNewMedia) {
     
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
      return res.status(500).json({ error: error.message || "Erreur inconnue dans updateArtist" });
    }
  }
};

// Supprimer un Artiste//
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

    res.status(200).json("Artiste supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteArtist)" });
  }
};
