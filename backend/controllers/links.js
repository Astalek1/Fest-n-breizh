import Link from "../models/Links.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// Créer un nouveau lien
export const newLink = async (req, res) => {
  try {
    const linkData = JSON.parse(req.body.link || "{}");

    const cleanName = (req.body.fileName || linkData.title || "link")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    const mediaResult = await resolveMedia(
      linkData.media,
      req.file,
      "/festn_breizh/logos",
      cleanName
    );

    if (!mediaResult?.url) return res.status(400).json("Logo invalide");

    const newLink = new Link({
      title: linkData.title,
      description: linkData.description,
      url: linkData.url || null,
      logo: mediaResult.url,
      logoFileId: mediaResult.fileId,
      logoName: mediaResult.fileName || cleanName,
    });

    await newLink.save();
    res.status(201).json({ message: "Lien ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les liens
export const getAllLinks = async (req, res) => {
  try {
    const links = await Link.find();
    res.status(200).json(links);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Récupérer un seul lien
export const getOneLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json("Lien non trouvé");
    res.status(200).json(link);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Mettre à jour un lien
export const updateLink = async (req, res) => {
  try {
    const existingLink = await Link.findById(req.params.id);
    if (!existingLink) return res.status(404).json("Lien non trouvé");

    let body = {};
    try {
      body = req.body.link ? JSON.parse(req.body.link) : req.body;
    } catch {
      body = req.body || {};
    }

    const filteredData = {};
    for (const field of ["title", "description", "url"]) {
      if (body[field] !== undefined) filteredData[field] = body[field];
    }

    const baseName = (
      req.body.fileName ||
      body.fileName ||
      filteredData.title ||
      existingLink.title ||
      "link"
    )
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    // a) Renommage du logo existant (aucun changement de fichier)
    if (!req.file && !body.logo && existingLink.logoFileId) {
      console.log("=== Étape a) Renommage du logo existant ===");
      const ext = (existingLink.logo.split(".").pop() || "webp").toLowerCase();
      const newName = `${baseName}.${ext}`;
      console.log("Ancien logo ID :", existingLink.logoFileId);
      console.log("Nouveau nom :", newName);

      await imagekit.updateFileDetails(existingLink.logoFileId, {
        name: newName,
      });

      filteredData.logo = existingLink.logo.replace(/[^/]+$/, newName);
      filteredData.logoName = baseName;
    }

    // b) Réutilisation d’un logo existant (fileId)
    else if (!req.file && body.logo && /^[a-zA-Z0-9]{8,}$/.test(body.logo)) {
      console.log("=== Étape b) Réutilisation d’un logo existant ===");
      console.log("Nouveau logo fileId fourni :", body.logo);
      console.log("Ancien logo fileId :", existingLink.logoFileId);

      const logoDetails = await imagekit.getFileDetails(body.logo);

      filteredData.logo = logoDetails.url;
      filteredData.logoFileId = logoDetails.fileId;
      filteredData.logoName = logoDetails.name.replace(/\.[^/.]+$/, "");

      if (existingLink.logoFileId !== logoDetails.fileId) {
        console.log("Logo remplacé, vérification de l'ancien...");
        const inUse = await isFileInUse(existingLink.logoFileId);
        console.log("Encore utilisé ?", inUse);
        if (!inUse) {
          console.log(
            "Suppression de l'ancien logo :",
            existingLink.logoFileId
          );
          await imagekit.deleteFile(existingLink.logoFileId);
        } else {
          console.log("Ancien logo conservé, encore utilisé ailleurs.");
        }
      } else {
        console.log("Même logo, aucune suppression nécessaire.");
      }
    }

    // c) Nouveau logo (upload ou URL)
    else if (req.file || (body.logo && /^https?:\/\//i.test(body.logo))) {
      console.log("=== Étape c) Nouveau logo uploadé ou via URL ===");
      const newLogo = await resolveMedia(
        body.logo,
        req.file,
        "/festn_breizh/logos",
        baseName
      );

      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      console.log("Ancien logo ID :", existingLink.logoFileId);
      console.log("Nouveau logo ID :", newLogo.fileId);

      if (existingLink.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        console.log(
          "Verification suppression :",
          existingLink.logoFileId,
          "Encore utilisé ?",
          inUse
        );
        if (!inUse) {
          console.log(
            "Suppression de l'ancien logo :",
            existingLink.logoFileId
          );
          await imagekit.deleteFile(existingLink.logoFileId);
        } else {
          console.log("Ancien logo conservé, encore utilisé ailleurs.");
        }
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
      filteredData.logoName = newLogo.fileName || baseName;
    } else {
      console.log("=== Aucun changement de logo détecté ===");
    }

    const updatedLink = await Link.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    console.log("=== Mise à jour terminée ===");
    res.status(200).json(updatedLink);
  } catch (error) {
    console.error("Erreur updateLink :", error);
    res.status(500).json({ error: "Erreur serveur (updateLink)" });
  }
};

// Supprimer un lien
export const deleteLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json("Lien non trouvé");

    if (link.logoFileId) {
      const inUse = await isFileInUse(link.logoFileId);
      if (!inUse) await imagekit.deleteFile(link.logoFileId);
    }

    await Link.findByIdAndDelete(req.params.id);
    res.status(200).json("Lien supprimé avec succès");
  } catch (error) {
    console.error("Erreur deleteLink :", error);
    res.status(500).json({ error: "Erreur serveur (deleteLink)" });
  }
};
