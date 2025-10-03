import Link from "../models/Links.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// créer un nouveau lien //
export const newLink = async (req, res) => {
  try {
    const linkData = JSON.parse(req.body.link);
    const cleanName = linkData.name.replace(/\s+/g, "-").toLowerCase();

    const mediaResult = await resolveMedia(
      linkData.media,
      req.file,
      "/festn_breizh/logos",
      cleanName
    );

    const newLink = new Link({
      title: linkData.title,
      description: linkData.description,
      url: linkData.url,
      logo: mediaResult.url,
      logoFileId: mediaResult.fileId,
    });
    await newLink.save();
    res.status(201).json({ message: "Lien ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver tous les liens //
export const getAllLinks = async (req, res) => {
  try {
    const links = await Link.find();
    res.status(200).json(links);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver un seul lien //
export const getOneLink = async (req, res) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
    });
    if (!link) {
      return res.status(404).json("Lien non trouvé");
    }
    res.status(200).json(link);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// modifier un lien //
export const updateLink = async (req, res) => {
  try {
    const existingLink = await Link.findOne({
      _id: req.params.id,
    });
    if (!existingLink) {
      return res.status(404).json("Lien non trouvé");
    }

    const allowedFields = ["title", "url", "description"];

    const filteredData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        filteredData[field] = req.body[field];
      }
    }

    // Gestion du logo si mis à jour
    if (req.file || req.body.logo) {
      const cleanName = (filteredData.title || existingLink.title)
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newLogo = await resolveMedia(
        req.body.logo,
        req.file,
        "/festn_breizh/logos",
        cleanName
      );
      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      // Supprimer l'ancien logo si plus utilisé
      if (existingLink.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        if (!inUse) {
          await imagekit.deleteFile(existingLink.logoFileId);
        }
      }
      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
    }

    const newDataLink = await Link.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(newDataLink);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// supprimer un lien //
export const deleteLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) {
      return res.status(404).json("Lien non trouvé");
    }

    if (link.logoFileId) {
      const inUse = await isFileInUse(link.logoFileId);
      if (!inUse) {
        await imagekit.deleteFile(link.logoFileId);
      }
    }

    await Link.findByIdAndDelete(req.params.id);

    res.status(200).json("Lien supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
