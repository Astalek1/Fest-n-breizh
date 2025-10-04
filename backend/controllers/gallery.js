import Gallery from "../models/Gallery.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// ========================================================
// ===============        AFFICHES        =================
// ========================================================

// Créer une nouvelle affiche
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

    const newMedia = await resolveMedia(
      posterData.media,
      req.file,
      "festn_breizh/affiches",
      cleanName
    );

    if (!newMedia?.urlLarge && !newMedia?.url)
      return res.status(400).json("Média invalide");

    const newPoster = new Gallery({
      title: posterData.title,
      url: newMedia.urlLarge || newMedia.url,
      urlSmall: newMedia.urlSmall || null,
      mediaFileIdLarge: newMedia.fileIdLarge || newMedia.fileId || null,
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

// Obtenir toutes les affiches
export const getAllPosters = async (req, res) => {
  try {
    const posters = await Gallery.find({ type: "poster" });
    res.status(200).json(posters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtenir une affiche
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

    const posterData = req.body.poster ? JSON.parse(req.body.poster) : req.body;
    const allowedFields = ["title", "alt", "caption"];
    const filteredData = {};

    for (const field of allowedFields) {
      if (posterData[field] !== undefined)
        filteredData[field] = posterData[field];
    }

    if (req.file || posterData.media) {
      const cleanName = (posterData.title || existingPoster.title)
        .replace(/\s+/g, "-")
        .toLowerCase();

      console.log("Tentative suppression anciennes images...");

      if (existingPoster.mediaFileIdLarge) {
        console.log("Suppression LARGE :", existingPoster.mediaFileIdLarge);
        await imagekit
          .deleteFile(existingPoster.mediaFileIdLarge)
          .then(() =>
            console.log(
              "Image large supprimée :",
              existingPoster.mediaFileIdLarge
            )
          )
          .catch((err) =>
            console.log("Erreur suppression large :", err.message)
          );
      }

      if (existingPoster.mediaFileIdSmall) {
        console.log("Suppression SMALL :", existingPoster.mediaFileIdSmall);
        await imagekit
          .deleteFile(existingPoster.mediaFileIdSmall)
          .then(() =>
            console.log(
              "Image small supprimée :",
              existingPoster.mediaFileIdSmall
            )
          )
          .catch((err) =>
            console.log("Erreur suppression small :", err.message)
          );
      }

      console.log("Upload du nouveau média...");
      const newMedia = await resolveMedia(
        posterData.media,
        req.file,
        "festn_breizh/affiches",
        cleanName
      );
      console.log("Upload terminé :", newMedia);

      if (!newMedia?.urlLarge && !newMedia?.url)
        return res.status(400).json("Média invalide");

      filteredData.url = newMedia.urlLarge || newMedia.url;
      filteredData.urlSmall = newMedia.urlSmall || null;
      filteredData.mediaFileIdLarge =
        newMedia.fileIdLarge || newMedia.fileId || null;
      filteredData.mediaFileIdSmall = newMedia.fileIdSmall || null;
    }

    const updatedPoster = await Gallery.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
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

    if (poster.mediaFileIdLarge) {
      console.log("Suppression LARGE :", poster.mediaFileIdLarge);
      const stillUsed = await isFileInUse(poster.mediaFileIdLarge);
      console.log(" stillUsed =", stillUsed);
      if (!stillUsed)
        await imagekit
          .deleteFile(poster.mediaFileIdLarge)
          .then(() => console.log("Large supprimée"))
          .catch((err) =>
            console.log("Erreur suppression large :", err.message)
          );
    }

    if (poster.mediaFileIdSmall) {
      console.log("Suppression SMALL :", poster.mediaFileIdSmall);
      const stillUsed = await isFileInUse(poster.mediaFileIdSmall);
      console.log("stillUsed =", stillUsed);
      if (!stillUsed)
        await imagekit
          .deleteFile(poster.mediaFileIdSmall)
          .then(() => console.log("Small supprimée"))
          .catch((err) =>
            console.log("Erreur suppression small :", err.message)
          );
    }

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

    const newMedia = await resolveMedia(
      photoData.media,
      req.file,
      "festn_breizh/photos",
      cleanName
    );

    if (!newMedia?.urlLarge && !newMedia?.url)
      return res.status(400).json("Média invalide");

    const newPhoto = new Gallery({
      title: photoData.title,
      url: newMedia.urlLarge || newMedia.url,
      urlSmall: newMedia.urlSmall || null,
      mediaFileIdLarge: newMedia.fileIdLarge || newMedia.fileId || null,
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

// Modifier une photo
export const updatePhoto = async (req, res) => {
  try {
    const existingPhoto = await Gallery.findOne({
      _id: req.params.id,
      type: "photo",
    });
    if (!existingPhoto) return res.status(404).json("Photo non trouvée");

    const photoData = req.body.photoData
      ? JSON.parse(req.body.photoData)
      : req.body;
    const allowedFields = ["title", "alt", "caption"];
    const filteredData = {};

    for (const field of allowedFields) {
      if (photoData[field] !== undefined)
        filteredData[field] = photoData[field];
    }

    if (req.file || photoData.media) {
      const cleanName = (photoData.title || existingPhoto.title)
        .replace(/\s+/g, "-")
        .toLowerCase();

      console.log("Tentative suppression anciennes images...");

      if (existingPhoto.mediaFileIdLarge) {
        console.log("Suppression LARGE :", existingPhoto.mediaFileIdLarge);
        await imagekit
          .deleteFile(existingPhoto.mediaFileIdLarge)
          .then(() =>
            console.log(
              "Image large supprimée :",
              existingPhoto.mediaFileIdLarge
            )
          )
          .catch((err) =>
            console.log("Erreur suppression large :", err.message)
          );
      }

      if (existingPhoto.mediaFileIdSmall) {
        console.log(" Suppression SMALL :", existingPhoto.mediaFileIdSmall);
        await imagekit
          .deleteFile(existingPhoto.mediaFileIdSmall)
          .then(() =>
            console.log(
              "Image small supprimée :",
              existingPhoto.mediaFileIdSmall
            )
          )
          .catch((err) =>
            console.log("Erreur suppression small :", err.message)
          );
      }

      console.log("Upload du nouveau média...");
      const newMedia = await resolveMedia(
        photoData.media,
        req.file,
        "festn_breizh/photos",
        cleanName
      );
      console.log("Upload terminé :", newMedia);

      if (!newMedia?.urlLarge && !newMedia?.url)
        return res.status(400).json("Média invalide");

      filteredData.url = newMedia.urlLarge || newMedia.url;
      filteredData.urlSmall = newMedia.urlSmall || null;
      filteredData.mediaFileIdLarge =
        newMedia.fileIdLarge || newMedia.fileId || null;
      filteredData.mediaFileIdSmall = newMedia.fileIdSmall || null;
    }

    const updatedPhoto = await Gallery.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
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

    if (photo.mediaFileIdLarge) {
      console.log("Suppression LARGE :", photo.mediaFileIdLarge);
      const stillUsed = await isFileInUse(photo.mediaFileIdLarge);
      console.log("stillUsed =", stillUsed);
      if (!stillUsed)
        await imagekit
          .deleteFile(photo.mediaFileIdLarge)
          .then(() => console.log("Large supprimée"))
          .catch((err) =>
            console.log("Erreur suppression large :", err.message)
          );
    }

    if (photo.mediaFileIdSmall) {
      console.log("Suppression SMALL :", photo.mediaFileIdSmall);
      const stillUsed = await isFileInUse(photo.mediaFileIdSmall);
      console.log("stillUsed =", stillUsed);
      if (!stillUsed)
        await imagekit
          .deleteFile(photo.mediaFileIdSmall)
          .then(() => console.log("Small supprimée"))
          .catch((err) =>
            console.log("Erreur suppression small :", err.message)
          );
    }

    res.status(200).json("Photo supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
