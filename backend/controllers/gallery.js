import Gallery from "../models/Gallery.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// ========================================================
// ===============        AFFICHES        =================
// ========================================================

export const newPoster = async (req, res) => {
  try {
    const posterData = JSON.parse(req.body.poster);
    if (!posterData.alt) return res.status(400).json("Le champ alt est obligatoire");

    const existing = await Gallery.findOne({
      title: posterData.title,
      type: "poster",
    });
    if (existing) return res.status(400).json("Une affiche avec ce titre existe déjà");

    const cleanName = req.body.fileName?.trim()
      ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
      : posterData.title
      ? posterData.title.replace(/\s+/g, "-").toLowerCase()
      : `${Date.now()}`;

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
      urlSmall: newMedia.urlSmall || null,
      mediaFileId: newMedia.fileId || null,
      mediaFileIdSmall: newMedia.fileIdSmall || null,
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

export const getAllPosters = async (req, res) => {
  try {
    const posters = await Gallery.find({ type: "poster" });
    res.status(200).json(posters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

export const updatePoster = async (req, res) => {
  try {
    const existingPoster = await Gallery.findOne({
      _id: req.params.id,
      type: "poster",
    });
    if (!existingPoster) return res.status(404).json("Affiche non trouvée");

    const body = req.body.poster ? JSON.parse(req.body.poster) : req.body;
    const allowedFields = ["title", "alt", "caption"];
    const filteredData = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) filteredData[field] = body[field];
    }

    if (req.file || body.media) {
      const cleanName = req.body.fileName?.trim()
        ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
        : body.title
        ? body.title.replace(/\s+/g, "-").toLowerCase()
        : existingPoster.title.replace(/\s+/g, "-").toLowerCase();

      const newMedia = await resolveMedia(body.media, req.file, "festn_breizh/affiches", cleanName);
      if (!newMedia?.url) return res.status(400).json("Média invalide");

      if (existingPoster.mediaFileId && !(await isFileInUse(existingPoster.mediaFileId)))
        await imagekit.deleteFile(existingPoster.mediaFileId);

      if (existingPoster.mediaFileIdSmall && !(await isFileInUse(existingPoster.mediaFileIdSmall)))
        await imagekit.deleteFile(existingPoster.mediaFileIdSmall);

      filteredData.url = newMedia.url;
      filteredData.urlSmall = newMedia.urlSmall || null;
      filteredData.mediaFileId = newMedia.fileId || null;
      filteredData.mediaFileIdSmall = newMedia.fileIdSmall || null;
    }

    const updatedPoster = await Gallery.findByIdAndUpdate(req.params.id, filteredData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedPoster);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePoster = async (req, res) => {
  try {
    const poster = await Gallery.findOneAndDelete({
      _id: req.params.id,
      type: "poster",
    });
    if (!poster) return res.status(404).json("Affiche non trouvée");

    if (poster.mediaFileId && !(await isFileInUse(poster.mediaFileId)))
      await imagekit.deleteFile(poster.mediaFileId);

    if (poster.mediaFileIdSmall && !(await isFileInUse(poster.mediaFileIdSmall)))
      await imagekit.deleteFile(poster.mediaFileIdSmall);

    res.status(200).json("Affiche supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// ===============         PHOTOS         =================
// ========================================================

export const newPhoto = async (req, res) => {
  try {
    const photoData = JSON.parse(req.body.photo);
    if (!photoData.alt) return res.status(400).json("Le champ alt est obligatoire");

    const existing = await Gallery.findOne({
      title: photoData.title,
      type: "photo",
    });
    if (existing) return res.status(400).json("Une photo avec ce titre existe déjà");

    const cleanName = req.body.fileName?.trim()
      ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
      : photoData.title
      ? photoData.title.replace(/\s+/g, "-").toLowerCase()
      : `${Date.now()}`;

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
      urlSmall: newMedia.urlSmall || null,
      mediaFileId: newMedia.fileId || null,
      mediaFileIdSmall: newMedia.fileIdSmall || null,
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

export const getAllPhotos = async (req, res) => {
  try {
    const photos = await Gallery.find({ type: "photo" });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOnePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findOne({ _id: req.params.id, type: "photo" });
    if (!photo) return res.status(404).json("Photo non trouvée");
    res.status(200).json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePhoto = async (req, res) => {
  try {
    const existingPhoto = await Gallery.findOne({
      _id: req.params.id,
      type: "photo",
    });
    if (!existingPhoto) return res.status(404).json("Photo non trouvée");

    const body = req.body.photo ? JSON.parse(req.body.photo) : req.body;
    const allowedFields = ["title", "alt", "caption"];
    const filteredData = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) filteredData[field] = body[field];
    }

    if (req.file || body.media) {
      const cleanName = req.body.fileName?.trim()
        ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
        : body.title
        ? body.title.replace(/\s+/g, "-").toLowerCase()
        : existingPhoto.title.replace(/\s+/g, "-").toLowerCase();

      const newMedia = await resolveMedia(body.media, req.file, "festn_breizh/photos", cleanName);
      if (!newMedia?.url) return res.status(400).json("Média invalide");

      if (existingPhoto.mediaFileId && !(await isFileInUse(existingPhoto.mediaFileId)))
        await imagekit.deleteFile(existingPhoto.mediaFileId);

      if (existingPhoto.mediaFileIdSmall && !(await isFileInUse(existingPhoto.mediaFileIdSmall)))
        await imagekit.deleteFile(existingPhoto.mediaFileIdSmall);

      filteredData.url = newMedia.url;
      filteredData.urlSmall = newMedia.urlSmall || null;
      filteredData.mediaFileId = newMedia.fileId || null;
      filteredData.mediaFileIdSmall = newMedia.fileIdSmall || null;
    }

    const updatedPhoto = await Gallery.findByIdAndUpdate(req.params.id, filteredData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedPhoto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findOneAndDelete({
      _id: req.params.id,
      type: "photo",
    });
    if (!photo) return res.status(404).json("Photo non trouvée");

    if (photo.mediaFileId && !(await isFileInUse(photo.mediaFileId)))
      await imagekit.deleteFile(photo.mediaFileId);

    if (photo.mediaFileIdSmall && !(await isFileInUse(photo.mediaFileIdSmall)))
      await imagekit.deleteFile(photo.mediaFileIdSmall);

    res.status(200).json("Photo supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
