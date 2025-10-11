import Announcement from "../models/Announcements.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// créer une nouvelle annonce //
export const newAnnouncement = async (req, res) => {
  try {
    const announcementData = JSON.parse(req.body.announcement);
    const cleanName = req.file?.originalname
      ? req.file.originalname.split(".")[0].replace(/\s+/g, "-").toLowerCase()
      : `${Date.now()}`;

    let folderPath =
      announcementData.mediaType === "logo"
        ? "/festn_breizh/logos"
        : "/festn_breizh/accueil";

    const mediaResult = await resolveMedia(
      announcementData.media,
      req.file,
      folderPath,
      cleanName
    );

    const newAnnouncement = new Announcement({
      title: announcementData.title,
      text: announcementData.text,
      url: announcementData.url || null,
      media: mediaResult?.url || null,
      mediaFileId: mediaResult?.fileId || null,
      mediaType: announcementData.mediaType || null,
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
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver une seule annonce //
export const getOneAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json("Annonce non trouvée");
    res.status(200).json(announcement);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// modifier une annonce //
export const updateAnnouncement = async (req, res) => {
  try {
    const body = req.body.announcement
      ? JSON.parse(req.body.announcement)
      : req.body;

    const existing = await Announcement.findById(req.params.id);
    if (!existing) return res.status(404).json("Annonce non trouvée");

    const allowed = ["title", "text", "url"];
    const filtered = {};
    for (const key of allowed) {
      if (body[key] !== undefined) filtered[key] = body[key];
    }

    const hasNewMedia =
      !!req.file ||
      (typeof body.media === "string" && body.media.trim() !== "");

    if (body.mediaType && !hasNewMedia)
      return res.status(400).json("Envoyez un média si vous changez mediaType");

    if (hasNewMedia) {
      const cleanName =
        req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        req.file?.originalname
          ?.split(".")[0]
          .replace(/\s+/g, "-")
          .toLowerCase() ||
        (filtered.title || existing.title || `media-${Date.now()}`)
          .replace(/\s+/g, "-")
          .toLowerCase();

      const nextType = body.mediaType || existing.mediaType || "photo";
      const folder =
        nextType === "logo" ? "/festn_breizh/logos" : "/festn_breizh/accueil";

      const newMedia = await resolveMedia(
        body.media,
        req.file,
        folder,
        cleanName
      );
      if (!newMedia?.url) return res.status(400).json("Média invalide");

      // Vérification avant suppression
      if (existing.mediaFileId && newMedia.fileId) {
        const inUse = await isFileInUse(existing.mediaFileId);
        if (inUse === false) {
          await imagekit.deleteFile(existing.mediaFileId);
        }
      }

      filtered.media = newMedia.url;
      filtered.mediaFileId = newMedia.fileId;
      filtered.mediaType = nextType;
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      filtered,
      { new: true, runValidators: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (updateAnnouncement)" });
  }
};

// supprimer une annonce //
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json("Annonce non trouvée");

    if (announcement.mediaFileId) {
      // Vérification avant suppression (même logique qu’à l’update)
      const inUse = await isFileInUse(announcement.mediaFileId);
      if (inUse === false) {
        await imagekit.deleteFile(announcement.mediaFileId);
      }
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json("Annonce supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteAnnouncement)" });
  }
};
