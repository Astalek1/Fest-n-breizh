import Artiste from "../models/Artistes";
import imagekit from "../config/imageKit";
import { resolveMedia } from "../utils/resolveMedia";
import { isFileInUse } from "../utils/isFileInUse";

//créer un nouvel artistes//
export const newArtiste = async (req, res) => {
  try {
    const artisteData = JSON.parse(req.body.artiste);
    const cleanName = artisteData.name.replace(/\s+/g, "-").toLowerCase();

    const mediaResult = await resolveMedia(
      artisteData.media,
      req.file,
      "/fest_breizh/artistes",
      cleanName
    );

    const newArtiste = new Artiste({
      name: artisteData.name,
      description: artisteData.description,
      media: mediaResult.url,
      mediaFileId: mediaResult.fileId,
    });
    await newArtiste.save();
    res.status(201).json({ message: "Artiste ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver tous les artistes//
export const getAllArtistes = async (req, res) => {
  try {
    const artistes = await Artiste.find();
    res.status(200).json(artistes);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//trouver un seul artiste//
export const getOneArtiste = async (req, res) => {
  try {
    const artiste = await Artiste.findById(req.params.id);
    if (!artiste) {
      return res.status(404).json("Artiste non trouvé");
    }
    res.status(200).json(artiste);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier un artiste//
export const updateArtiste = async (req, res) => {
  try {
    const artiste = await Artiste.findById(req.params.id);
    if (!artiste) return res.status(404).json("Artiste non trouvé");

    const allowedFields = ["name", "description", "media"];
    const filteredData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );
    if (req.file || filteredData.media) {
      const cleanName = (filteredData.name || artiste.name)
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newMedia = await resolveMedia(
        filteredData.media,
        req.file,
        "/fest_breizh/artistes",
        cleanName
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      if (artiste.mediaFileId && newMedia.fileId) {
        await imagekit.deleteFile(artiste.mediaFileId);
      }
      filteredData.media = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
    }
    const updatedArtiste = await Artiste.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedArtiste);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un artiste //
export const deleteArtiste = async (req, res) => {
  try {
    const artiste = await Artiste.findById(req.params.id);
    if (!artiste) {
      return res.status(404).json("Artiste non trouvé");
    }

    // Vérifie si un fichier était lié et qu’il est stocké dans ImageKit
    if (artiste.mediaFileId) {
      const inUse = await isFileInUse(artiste.mediaFileId);

      if (!inUse) {
        await imagekit.deleteFile(artiste.mediaFileId);
      }
    }

    // Supprime l’artiste de la base
    await Artiste.findByIdAndDelete(req.params.id);

    res.status(200).json("Artiste supprimé avec succès");
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};
