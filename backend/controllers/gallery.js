import Gallery from "../models/Gallery.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// 🔹 Helper pour suppression multiple sécurisée
const deleteImagekitIds = async (ids = []) => {
  for (const id of ids.filter(Boolean)) {
    try {
      await imagekit.deleteFile(id);
    } catch (_) {
      // on ignore les erreurs de suppression (fichier déjà supprimé, ID invalide, etc.)
    }
  }
};

// ========================================================
// ===============        AFFICHES        =================
// ========================================================

// ➤ Créer une nouvelle affiche
export const newPoster = async (req, res) => {
  try {
    const posterData = JSON.parse(req.body.poster);
    if (!posterData.alt)
      return res.status(400).json("Le champ alt est obligatoire");

    const existing = await Gallery.findOne({
      title: posterData.title,
      type: "poster",
    });
    if (existing)
      return res.status(400).json("Une affiche avec ce titre existe déjà");

    const cleanName = posterData.title.replace(/\s+/g, "-").toLowerCase();
    const media = await resolveMedia(
      posterData.media,
      req.file,
      "festn_breizh/affiches",
      cleanName
    );

    if (!media?.urlLarge && !media?.url)
      return res.status(400).json("Média invalide");

    const newPoster = new Gallery({
      title: posterData.title,
      url: media.urlLarge || media.url,
      urlSmall: media.urlSmall || null,
      mediaFileId: media.fileIdLarge || media.fileId || null,
      mediaFileIdSmall: media.fileIdSmall || null,
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

// ➤ Obtenir toutes les affiches
export const getAllPosters = async (_req, res) => {
  try {
    const posters = await Gallery.find({ type: "poster" });
    res.status(200).json(posters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ➤ Obtenir une affiche
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

// ➤ Modifier une affiche
export const updatePoster = async (req, res) => {
  try {
    const existing = await Gallery.findOne({
      _id: req.params.id,
      type: "poster",
    });
    if (!existing) return res.status(404).json("Affiche non trouvée");

    const posterData = req.body.poster ? JSON.parse(req.body.poster) : req.body;
    const allowedFields = ["title", "alt", "caption"];
    const updateData = {};

    for (const field of allowedFields) {
      if (posterData[field] !== undefined)
        updateData[field] = posterData[field];
    }

    // 🔹 Si nouveau média envoyé → on supprime les anciens avant upload
    if (req.file || posterData.media) {
      const cleanName = (posterData.title || existing.title)
        .replace(/\s+/g, "-")
        .toLowerCase();

      await deleteImagekitIds([
        existing.mediaFileId,
        existing.mediaFileIdSmall,
      ]);

      const media = await resolveMedia(
        posterData.media,
        req.file,
        "festn_breizh/affiches",
        cleanName
      );
      if (!media?.urlLarge && !media?.url)
        return res.status(400).json("Média invalide");

      updateData.url = media.urlLarge || media.url;
      updateData.urlSmall = media.urlSmall || null;
      updateData.mediaFileId = media.fileIdLarge || media.fileId || null;
      updateData.mediaFileIdSmall = media.fileIdSmall || null;
    }

    const updated = await Gallery.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ➤ Supprimer une affiche
export const deletePoster = async (req, res) => {
  try {
    const poster = await Gallery.findOneAndDelete({
      _id: req.params.id,
      type: "poster",
    });
    if (!poster) return res.status(404).json("Affiche non trouvée");

    const usedLarge = await isFileInUse(poster.mediaFileId);
    const usedSmall = await isFileInUse(poster.mediaFileIdSmall);
    if (!usedLarge)
      await imagekit.deleteFile(poster.mediaFileId).catch(() => {});
    if (!usedSmall)
      await imagekit.deleteFile(poster.mediaFileIdSmall).catch(() => {});

    res.status(200).json("Affiche supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================================
// ===============         PHOTOS         =================
// ========================================================

// ➤ Créer une photo
export const newPhoto = async (req, res) => {
  try {
    const photoData = JSON.parse(req.body.photoData);
    if (!photoData.alt)
      return res.status(400).json("Le champ alt est obligatoire");

    const existing = await Gallery.findOne({
      title: photoData.title,
      type: "photo",
    });
    if (existing)
      return res.status(400).json("Une photo avec ce titre existe déjà");

    const cleanName = photoData.title.replace(/\s+/g, "-").toLowerCase();
    const media = await resolveMedia(
      photoData.media,
      req.file,
      "festn_breizh/photos",
      cleanName
    );

    if (!media?.urlLarge && !media?.url)
      return res.status(400).json("Média invalide");

    const newPhoto = new Gallery({
      title: photoData.title,
      url: media.urlLarge || media.url,
      urlSmall: media.urlSmall || null,
      mediaFileId: media.fileIdLarge || media.fileId || null,
      mediaFileIdSmall: media.fileIdSmall || null,
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

// ➤ Obtenir toutes les photos
export const getAllPhotos = async (_req, res) => {
  try {
    const photos = await Gallery.find({ type: "photo" });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtenir une photo
export const getOnePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findOne({
      _id: req.params.id,
      type: "photo",
    });
    if (!photo) return res.status(404).json("Photo non trouvée");
    res.status(200).json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Modifier une photo
export const updatePhoto = async (req, res) => {
  try {
    const existing = await Gallery.findOne({
      _id: req.params.id,
      type: "photo",
    });
    if (!existing) return res.status(404).json("Photo non trouvée");

    const photoData = req.body.photoData
      ? JSON.parse(req.body.photoData)
      : req.body;
    const allowedFields = ["title", "alt", "caption"];
    const updateData = {};

    for (const field of allowedFields) {
      if (photoData[field] !== undefined) updateData[field] = photoData[field];
    }

    // Suppression anciennes images si nouveau média
    if (req.file || photoData.media) {
      const cleanName = (photoData.title || existing.title)
        .replace(/\s+/g, "-")
        .toLowerCase();

      await deleteImagekitIds([
        existing.mediaFileId,
        existing.mediaFileIdSmall,
      ]);

      const media = await resolveMedia(
        photoData.media,
        req.file,
        "festn_breizh/photos",
        cleanName
      );

      if (!media?.urlLarge && !media?.url)
        return res.status(400).json("Média invalide");

      updateData.url = media.urlLarge || media.url;
      updateData.urlSmall = media.urlSmall || null;
      updateData.mediaFileId = media.fileIdLarge || media.fileId || null;
      updateData.mediaFileIdSmall = media.fileIdSmall || null;
    }

    const updated = await Gallery.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Supprimer une photo
export const deletePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findOneAndDelete({
      _id: req.params.id,
      type: "photo",
    });
    if (!photo) return res.status(404).json("Photo non trouvée");

    const usedLarge = await isFileInUse(photo.mediaFileId);
    const usedSmall = await isFileInUse(photo.mediaFileIdSmall);
    if (!usedLarge)
      await imagekit.deleteFile(photo.mediaFileId).catch(() => {});
    if (!usedSmall)
      await imagekit.deleteFile(photo.mediaFileIdSmall).catch(() => {});

    res.status(200).json("Photo supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
