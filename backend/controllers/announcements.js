import Announcement from "../models/Announcements.js";
import imagekit from "../config/imageKit";
import { resolveMedia } from "../utils/resolveMedia";
import { isFileInUse } from "../utils/isFileInUse.js";

// créer une nouvelle annonce //
export const newAnnouncement = async (req, res) => {
  try {
    const announcementData = JSON.parse(req.body.announcement);
    const cleanName = announcementData.title.replace(/\s+/g, "-").toLowerCase();

    // Déterminer le dossier selon le type de média
    let folderPath = "/festn_breizh/accueil";
    if (announcementData.mediaType === "logo") {
      folderPath = "/festn_breizh/logos";
    }

    const mediaResult = await resolveMedia(
      announcementData.media,
      req.file,
      folderPath,
      cleanName
    );

    const newAnnouncement = new Announcement({
      title: announcementData.title,
      text: announcementData.text,
      url: announcementData.url || null, // facultatif
      media: mediaResult?.url || null,
      mediaFileId: mediaResult?.fileId || null,
      mediaType: announcementData.mediaType || null, // "photo", "video", "logo"
    });

    await newAnnouncement.save();
    res.status(201).json({ message: "Annonce créée avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver toutes les annonces //
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver une seule annonce //
export const getOneAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
    });
    if (!announcement) {
      return res.status(404).json("Annonce non trouvé");
    }
    res.status(200).json(announcement);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier une annonce//
export const updateAnnouncement = async (req, res) => {
  try {
    const existing = await Announcement.findById(req.params.id);
    if (!existing) return res.status(404).json("Annonce non trouvée");

    // Champs éditables côté texte
    const allowed = ["title", "text", "url"];
    const filtered = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) filtered[k] = req.body[k];
    }

    const hasNewMedia =
      !!req.file ||
      (typeof req.body.media === "string" && req.body.media.trim() !== "");

    // Si on change mediaType, on exige un nouveau média (sinon risque d'incohérence de dossier)
    if (req.body.mediaType && !hasNewMedia) {
      return res.status(400).json("Envoyez un média si vous changez mediaType");
    }

    if (hasNewMedia) {
      const cleanName = (filtered.title || existing.title)
        .replace(/\s+/g, "-")
        .toLowerCase();

      // Dossier déterminé par le type cible (celui envoyé, sinon l’actuel)
      const nextType = req.body.mediaType || existing.mediaType || null;
      const folder =
        nextType === "logo" ? "/festn_breizh/logos" : "/festn_breizh/accueil";

      const newMedia = await resolveMedia(
        req.body.media,
        req.file,
        folder,
        cleanName
      );
      if (!newMedia?.url) return res.status(400).json("Média invalide");

      // On supprime l'ancien fichier ImageKit seulement s'il n'est plus utilisé ailleurs
      if (existing.mediaFileId && newMedia.fileId) {
        const inUse = await isFileInUse(existing.mediaFileId);
        if (!inUse) await imagekit.deleteFile(existing.mediaFileId);
      }

      filtered.media = newMedia.url;
      filtered.mediaFileId = newMedia.fileId || null;
      filtered.mediaType = nextType;
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      filtered,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// supprimer une annonce //
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json("Annonce non trouvé");
    }

    if (announcement.mediaFileId) {
      const inUse = await isFileInUse(announcement.mediaFileId);
      if (!inUse) {
        await imagekit.deleteFile(announcement.mediaFileId);
      }
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json("Annonce supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
