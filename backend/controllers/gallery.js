import Gallery from "../models/Gallery.js";

// créée une nouvelle affiche //
export const newPoster = async (req, res) => {
  try {
    const posterData = JSON.parse(req.body.poster);

    const newPoster = new Gallery({
      title: posterData.title,
      url: posterData.url,
      alt: posterData.alt,
      caption: posterData.caption,
      type: "poster",
    });

    await newPoster.save();
    res.status(201).json({ message: "Affiche créée avec succès !" });
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver toutes les affiches//
export const getAllPoster = async (req, res) => {
  try {
    const posters = await Gallery.find({ type: "poster" });
    res.status(200).json(posters);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//trouver une seul affiche //
export const getOnePoster = async (req, res) => {
  try {
    const poster = await Gallery.findOne({
      _id: req.params.id,
      type: "poster",
    });
    if (!poster) {
      return res.status(404).json("affiche non trouvée");
    }
    res.status(200).json(poster);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier une affiche//
export const updatePoster = async (req, res) => {
  try {
    const existingPoster = await Gallery.findOne({
      _id: req.params.id,
      type: "poster",
    });
    if (!existingPoster) {
      return res.status(404).json("Affiche non trouvée");
    }

    const allowedFields = ["title", "url", "alt", "caption"];

    const filteredData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        filteredData[field] = req.body[field];
      }
    }

    const newDataPoster = await Gallery.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(newDataPoster);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// supprimer une Affiche //
export const deletePoster = async (req, res) => {
  try {
    const poster = await Gallery.findOneAndDelete({
      _id: req.params.id,
      type: "poster",
    });
    if (!poster) {
      return res.status(404).json("Affiche non trouvée");
    }

    res.status(200).json("Affiche supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//*********************photos**********************//

// créée une nouvelle Photo //
export const newPhoto = async (req, res) => {
  try {
    const photoData = JSON.parse(req.body.photo);

    const newPhoto = new Gallery({
      title: photoData.title,
      url: photoData.url,
      alt: photoData.alt,
      caption: photoData.caption,
      type: "photo",
    });

    await newPhoto.save();
    res.status(201).json({ message: "Photo créée avec succès !" });
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver toutes les photos//
export const getAllPhotos = async (req, res) => {
  try {
    const photos = await Gallery.find({ type: "photo" });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//trouver une seul photo //
export const getOnePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findOne({
      _id: req.params.id,
      type: "photo",
    });
    if (!photo) {
      return res.status(404).json("photo non trouvée");
    }
    res.status(200).json(photo);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier une photo//
export const updatePhoto = async (req, res) => {
  try {
    const existingPhoto = await Gallery.findOne({
      _id: req.params.id,
      type: "photo",
    });
    if (!existingPhoto) {
      return res.status(404).json("Photo non trouvée");
    }

    const allowedFields = ["title", "url", "alt", "caption"];

    const filteredData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        filteredData[field] = req.body[field];
      }
    }

    const newDataPhoto = await Gallery.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(newDataPhoto);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// supprimer une Photo //
export const deletePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findOneAndDelete({
      _id: req.params.id,
      type: "photo",
    });
    if (!photo) {
      return res.status(404).json("Photo non trouvée");
    }

    res.status(200).json("Photo supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
