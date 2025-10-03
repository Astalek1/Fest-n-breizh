import Video from "../models/Videos.js";

// créée une nouvelle vidéo //
export const newVideo = async (req, res) => {
  try {
    const videoData = JSON.parse(req.body.video);

    const newVideo = new Video({
      title: videoData.title,
      url: videoData.url,
      description: videoData.description,
    });

    await newVideo.save();
    res.status(201).json({ message: "Vidéo créée avec succès !" });
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver toutes les vidéos//
export const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//trouver une seul vidéo //
export const getOneVideo = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
    });
    if (!video) {
      return res.status(404).json("Vidéo non trouvée");
    }
    res.status(200).json(video);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier une vidéo//
export const updateVideo = async (req, res) => {
  try {
    const existingVideo = await Video.findOne({
      _id: req.params.id,
    });
    if (!existingVideo) {
      return res.status(404).json("video non trouvée");
    }

    const allowedFields = ["title", "url", "description"];

    const filteredData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        filteredData[field] = req.body[field];
      }
    }

    const newDataVideo = await Video.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(newDataVideo);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// supprimer une Vidéo //
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOneAndDelete({
      _id: req.params.id,
    });
    if (!video) {
      return res.status(404).json("Vidéo non trouvée");
    }

    res.status(200).json("Vidéo supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
