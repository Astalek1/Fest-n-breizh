import Gallery from "../models/Gallery.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// ******************* Affiches ******************* //

// Créer une nouvelle affiche
export const newPoster = async (req, res) => {
  try {
    const posterData = JSON.parse(req.body.poster);

    // Vérification obligatoire de alt
    if (!posterData.alt) {
      return res.status(400).json("Le champ alt est obligatoire");
    }

    const cleanName = posterData.title.replace(/\s+/g, "-").toLowerCase();
    const newMedia = await resolveMedia(
      posterData.media,
      req.file,
      "festn_breizh/affiches",
      cleanName
    );

    if (!newMedia?.url) return res.status(400).json("Média invalide");

    const newPoster = new Gallery({
      title: posterData.title,
      url: newMedia.url,
      mediaFileId: newMedia.fileId,
      alt: posterData.alt,
      caption: posterData.caption,
      type: "poster",
    });

    await newPoster.save();
    res.status(201).json({ message: "Affiche créée avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trouver toutes les affiches
export const getAllPosters = async (req, res) => {
  try {
    const posters = await Gallery.find({ type: "poster" });
    res.status(200).json(posters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trouver une seule affiche
export const getOnePoster = async (req, res) => {
  try {
    const poster = await Gallery.findOne({
      _id: req.params.id,
      type: "poster",
    });
    if (!poster) return res.status(404).json("Affiche non trouvée");
    res.status(200).json(poster);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Modifier une affiche
export const updatePoster = async (req, res) => {
  try {
    const existingPoster = await Gallery.findOne({
      _id: req.params.id,
      type: "poster",
    });
    if (!existingPoster) return res.status(404).json("Affiche non trouvée");

    const posterData = req.body;
    const allowedFields = ["title", "alt", "caption"];
    const filteredData = {};

    for (const field of allowedFields) {
      if (posterData[field] !== undefined)
        filteredData[field] = posterData[field];
    }

    if (filteredData.alt !== undefined && !filteredData.alt) {
      return res.status(400).json("Le champ alt ne peut pas être vide");
    }

    if (req.file || posterData.media) {
      const cleanName = (posterData.title || existingPoster.title)
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newMedia = await resolveMedia(
        posterData.media,
        req.file,
        "festn_breizh/affiches",
        cleanName
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      if (existingPoster.mediaFileId && newMedia.fileId) {
        await imagekit.deleteFile(existingPoster.mediaFileId);
      }

      filteredData.url = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
    }

    const updatedPoster = await Gallery.findByIdAndUpdate(
      req.params.id,
      filteredData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedPoster);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une affiche
export const deletePoster = async (req, res) => {
  try {
    const poster = await Gallery.findOneAndDelete({
      _id: req.params.id,
      type: "poster",
    });
    if (!poster) return res.status(404).json("Affiche non trouvée");

    if (poster.mediaFileId && !(await isFileInUse(poster.mediaFileId))) {
      await imagekit.deleteFile(poster.mediaFileId);
    }

    res.status(200).json("Affiche supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ******************* PHOTOS ******************* //

// Créer une nouvelle photo
export const newPhoto = async (req, res) => {
  try {
    const photoData = JSON.parse(req.body.photoData);

    if (!photoData.alt) {
      return res.status(400).json("Le champ alt est obligatoire");
    }

    const cleanName = photoData.title.replace(/\s+/g, "-").toLowerCase();
    const newMedia = await resolveMedia(
      photoData.media,
      req.file,
      "festn_breizh/photos",
      cleanName
    );

    if (!newMedia?.url) return res.status(400).json("Média invalide");

    const newPhoto = new Gallery({
      title: photoData.title,
      url: newMedia.url,
      mediaFileId: newMedia.fileId,
      alt: photoData.alt,
      caption: photoData.caption,
      type: "photo",
    });

    await newPhoto.save();
    res.status(201).json({ message: "Photo créée avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trouver toutes les photos
export const getAllPhotos = async (req, res) => {
  try {
    const photos = await Gallery.find({ type: "photo" });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trouver une seule photo
export const getOnePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findOne({ _id: req.params.id, type: "photo" });
    if (!photo) return res.status(404).json("Photo non trouvée");
    res.status(200).json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Modifier une photo
export const updatePhoto = async (req, res) => {
  try {
    const existingPhoto = await Gallery.findOne({
      _id: req.params.id,
      type: "photo",
    });
    if (!existingPhoto) return res.status(404).json("Photo non trouvée");

    const photoData = req.body;
    const allowedFields = ["title", "alt", "caption"];
    const filteredData = {};

    for (const field of allowedFields) {
      if (photoData[field] !== undefined)
        filteredData[field] = photoData[field];
    }

    if (filteredData.alt !== undefined && !filteredData.alt) {
      return res.status(400).json("Le champ alt ne peut pas être vide");
    }

    if (req.file || photoData.media) {
      const cleanName = (photoData.title || existingPhoto.title)
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newMedia = await resolveMedia(
        photoData.media,
        req.file,
        "festn_breizh/photos",
        cleanName
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      if (existingPhoto.mediaFileId && newMedia.fileId) {
        await imagekit.deleteFile(existingPhoto.mediaFileId);
      }

      filteredData.url = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
    }

    const updatedPhoto = await Gallery.findByIdAndUpdate(
      req.params.id,
      filteredData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedPhoto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une photo
export const deletePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findOneAndDelete({
      _id: req.params.id,
      type: "photo",
    });
    if (!photo) return res.status(404).json("Photo non trouvée");

    if (photo.mediaFileId && !(await isFileInUse(photo.mediaFileId))) {
      await imagekit.deleteFile(photo.mediaFileId);
    }

    res.status(200).json("Photo supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
