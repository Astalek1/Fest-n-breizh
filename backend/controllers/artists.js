import Artist from "../models/Artists";
import imagekit from "../config/imageKit";
import { resolveMedia } from "../utils/resolveMedia";
import { isFileInUse } from "../utils/isFileInUse";

//créer un nouvel artistes//
export const newArtist = async (req, res) => {
  try {
    const artistData = JSON.parse(req.body.artist);
    const cleanName = artistData.name.replace(/\s+/g, "-").toLowerCase();

    const mediaResult = await resolveMedia(
      artistData.media,
      req.file,
      "/festn_breizh/artistes",
      cleanName
    );

    const newArtist = new Artist({
      name: artistData.name,
      description: artistData.description,
      media: mediaResult.url,
      mediaFileId: mediaResult.fileId,
    });
    await newArtist.save();
    res.status(201).json({ message: "Artiste ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver tous les artistes//
export const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find();
    res.status(200).json(artists);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//trouver un seul artiste//
export const getOneArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json("Artiste non trouvé");
    }
    res.status(200).json(artist);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier un artiste//
export const updateArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");

    const allowedFields = ["name", "description", "media"];
    const filteredData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );
    if (req.file || filteredData.media) {
      const cleanName = (filteredData.name || artist.name)
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newMedia = await resolveMedia(
        filteredData.media,
        req.file,
        "/festn_breizh/artistes",
        cleanName
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      if (artist.mediaFileId && newMedia.fileId) {
        await imagekit.deleteFile(artist.mediaFileId);
      }
      filteredData.media = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
    }
    const updatedArtist = await Artist.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedArtist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un artiste //
export const deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json("Artiste non trouvé");
    }

    // Vérifie si un fichier était lié et qu’il est stocké dans ImageKit
    if (artist.mediaFileId) {
      const inUse = await isFileInUse(artist.mediaFileId);

      if (!inUse) {
        await imagekit.deleteFile(artist.mediaFileId);
      }
    }

    // Supprime l’artiste de la base
    await Artist.findByIdAndDelete(req.params.id);

    res.status(200).json("Artiste supprimé avec succès");
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};
