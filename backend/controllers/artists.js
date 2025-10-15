import Artist from "../models/Artists.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// === Créer un nouvel artiste ===
export const newArtist = async (req, res) => {
  try {
    const artistData = JSON.parse(req.body.artist);

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      req.file?.originalname
        ?.split(".")[0]
        ?.replace(/\s+/g, "-")
        .toLowerCase() ||
      artistData.name?.replace(/\s+/g, "-").toLowerCase() ||
      `${Date.now()}`;

    // Déterminer le bon dossier
    const folder = artistData.logo
      ? "/festn_breizh/logos"
      : "/festn_breizh/artistes";

    const mediaResult = await resolveMedia(
      artistData.media,
      req.file,
      folder,
      cleanName
    );

    const newArtist = new Artist({
      name: artistData.name,
      description: artistData.description,
      media: mediaResult?.url || null,
      mediaFileId: mediaResult?.fileId || null,
      mediaName:
        req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        artistData.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        mediaResult?.fileName ||
        cleanName,
    });

    await newArtist.save();
    res.status(201).json({ message: "Artiste ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// === Trouver tous les artistes ===
export const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find();
    res.status(200).json(artists);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === Trouver un artiste ===
export const getOneArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");
    res.status(200).json(artist);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === Modifier un artiste ===
export const updateArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");

    const body = req.body.artist ? JSON.parse(req.body.artist) : req.body;
    const allowedFields = ["name", "description"];
    const filteredData = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) filteredData[field] = body[field];
    }

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      (filteredData.name || artist.name || `${Date.now()}`)
        .replace(/\s+/g, "-")
        .toLowerCase();

    // --- Média principal ---
    if (req.file || body.media) {
      const folder = body.logo
        ? "/festn_breizh/logos"
        : "/festn_breizh/artistes";

      const newMedia = await resolveMedia(
        body.media,
        req.file,
        folder,
        `${cleanName}-${Date.now()}`
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      // Supprime l’ancien média (strictement, sauf si logo)
      if (artist.mediaFileId && folder !== "/festn_breizh/logos") {
        try {
          await imagekit.deleteFile(artist.mediaFileId);
          console.log("Ancien média supprimé :", artist.mediaFileId);
        } catch (e) {
          console.error("Erreur suppression ancienne image :", e?.message || e);
        }
      }

      filteredData.media = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
      filteredData.mediaName = newMedia.fileName || cleanName;
    }

    // --- Logo optionnel ---
    if (body.logo) {
      const newLogo = await resolveMedia(
        body.logo,
        null,
        "/festn_breizh/logos",
        `${cleanName}-logo`
      );

      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      if (artist.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(artist.logoFileId);
        if (inUse === false) await imagekit.deleteFile(artist.logoFileId);
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
    }

    // --- Mise à jour du nom du média sans changement de fichier ---
    if (!req.file && !body.media && req.body.fileName) {
      filteredData.mediaName = req.body.fileName
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
    }

    const updatedArtist = await Artist.findByIdAndUpdate(
      req.params.id,
      filteredData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedArtist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// === Supprimer un artiste ===
export const deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");

    if (artist.mediaFileId) {
      try {
        await imagekit.deleteFile(artist.mediaFileId);
        console.log("Média supprimé :", artist.mediaFileId);
      } catch (e) {
        console.error("Erreur suppression média :", e?.message || e);
      }
    }

    if (artist.logoFileId) {
      const inUse = await isFileInUse(artist.logoFileId);
      if (inUse === false) {
        try {
          await imagekit.deleteFile(artist.logoFileId);
        } catch (e) {
          console.error("Erreur suppression logo :", e?.message || e);
        }
      }
    }

    await Artist.findByIdAndDelete(req.params.id);
    res.status(200).json("Artiste supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteArtist)" });
  }
};
