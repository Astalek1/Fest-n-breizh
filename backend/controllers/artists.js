import Artist from "../models/Artists.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// créer un nouvel artiste //
export const newArtist = async (req, res) => {
  try {
    const artistData = JSON.parse(req.body.artist);

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      req.file?.originalname
        ?.split(".")[0]
        .replace(/\s+/g, "-")
        .toLowerCase() ||
      artistData.name?.replace(/\s+/g, "-").toLowerCase() ||
      `${Date.now()}`;

    const mediaResult = await resolveMedia(
      artistData.media,
      req.file,
      "/festn_breizh/artistes",
      cleanName
    );

    let logoResult = null;
    if (artistData.logo) {
      const logoName = `${cleanName}-logo`;
      logoResult = await resolveMedia(
        artistData.logo,
        null,
        "/festn_breizh/logos",
        logoName
      );
    }

    const newGuest = new Guest({
      name: guestData.name,
      description: guestData.description,
      media: mediaResult?.url || logoResult?.url || null,
      mediaFileId: mediaResult?.fileId || logoResult?.fileId || null,
      mediaName: mediaResult?.mediaName || guestData.fileName || null,
    });

    await newArtist.save();
    res.status(201).json({ message: "Artiste ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver tous les artistes //
export const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find();
    res.status(200).json(artists);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver un seul artiste //
export const getOneArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");
    res.status(200).json(artist);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// modifier un artiste //
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

    // Mise à jour du média principal
    if (req.file || body.media) {
      const cleanName =
        req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        req.file?.originalname
          ?.split(".")[0]
          .replace(/\s+/g, "-")
          .toLowerCase() ||
        (filteredData.name || artist.name || `${Date.now()}`)
          .replace(/\s+/g, "-")
          .toLowerCase();

      const newMedia = await resolveMedia(
        body.media,
        req.file,
        "/festn_breizh/artistes",
        cleanName
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      // Vérifie si l'ancien fichier peut être supprimé
      if (artist.mediaFileId && newMedia.fileId) {
        const inUse = await isFileInUse(artist.mediaFileId);
        if (inUse === false) {
          await imagekit.deleteFile(artist.mediaFileId);
        }
      }

      filteredData.media = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
    }

    // Mise à jour du logo
    if (body.logo) {
      const cleanName = (filteredData.name || artist.name)
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newLogo = await resolveMedia(
        body.logo,
        null,
        "/festn_breizh/logos",
        `${cleanName}-logo`
      );

      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      // Vérifie si l'ancien logo peut être supprimé
      if (artist.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(artist.logoFileId);
        if (inUse === false) {
          await imagekit.deleteFile(artist.logoFileId);
        }
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
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

// supprimer un artiste //
export const deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");

    if (artist.mediaFileId) {
      const inUse = await isFileInUse(artist.mediaFileId);
      if (inUse === false) {
        await imagekit.deleteFile(artist.mediaFileId);
      }
    }

    if (artist.logoFileId) {
      const inUse = await isFileInUse(artist.logoFileId);
      if (inUse === false) {
        await imagekit.deleteFile(artist.logoFileId);
      }
    }

    await Artist.findByIdAndDelete(req.params.id);
    res.status(200).json("Artiste supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteArtist)" });
  }
};
