import Link from "../models/Links.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// Créer un nouveau lien //
export const newLink = async (req, res) => {
  try {
    const linkData = JSON.parse(req.body.link);

    const cleanName = req.body.fileName?.trim()
      ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
      : linkData.title
      ? linkData.title.replace(/\s+/g, "-").toLowerCase()
      : "link";

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
      url: linkData.url,
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

// Récupérer tous les liens //
export const getAllLinks = async (req, res) => {
  try {
    const links = await Link.find();
    res.status(200).json(links);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Récupérer un lien par ID //
export const getOneLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json("Lien non trouvé");
    res.status(200).json(link);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

export const updateLink = async (req, res) => {
  try {
    const existingLink = await Link.findById(req.params.id);
    if (!existingLink) return res.status(404).json("Lien non trouvé");

    const body = req.body?.link ? JSON.parse(req.body.link) : req.body;
    const filteredData = {};

    // 1️⃣ Mise à jour des champs textuels
    for (const field of ["title", "description", "url"]) {
      if (body[field] !== undefined) filteredData[field] = body[field];
    }

    // 2️⃣ Détection du nom souhaité pour le logo
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

    // 3️⃣ Cas A : Renommage du logo existant uniquement
    if (!req.file && !body.logo && baseName && existingLink.logoFileId) {
      const ext =
        (existingLink.logo && existingLink.logo.split(".").pop()) || "webp";
      const newName = `${baseName}.${ext}`;

      await imagekit.updateFileDetails(existingLink.logoFileId, {
        name: newName,
      });

      let newUrl = existingLink.logo;
      try {
        const details = await imagekit.getFileDetails(existingLink.logoFileId);
        if (details?.url) newUrl = details.url;
      } catch {
        newUrl = existingLink.logo.replace(/[^/]+$/, newName);
      }

      filteredData.logo = newUrl;
      filteredData.logoName = baseName;
    }

    // 4️⃣ Cas B : Remplacement du logo par un logo déjà existant (fileId)
    else if (!req.file && body.logo && /^[a-zA-Z0-9]{8,}$/.test(body.logo)) {
      const logoDetails = await imagekit.getFileDetails(body.logo);

      filteredData.logo = logoDetails.url;
      filteredData.logoFileId = logoDetails.fileId;
      filteredData.logoName = baseName;

      // suppression de l’ancien logo si plus utilisé
      if (
        existingLink.logoFileId &&
        existingLink.logoFileId !== logoDetails.fileId
      ) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingLink.logoFileId);
      }
    }

    // 5️⃣ Cas C : Remplacement du logo par un nouveau média (upload ou URL)
    else if (req.file || (body.logo && /^https?:\/\//i.test(body.logo))) {
      const newLogo = await resolveMedia(
        body.logo,
        req.file,
        "/festn_breizh/logos",
        baseName
      );

      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      if (existingLink.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingLink.logoFileId);
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
      filteredData.logoName = newLogo.fileName || baseName;
    }

    const updatedLink = await Link.findByIdAndUpdate(
      req.params.id,
      filteredData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedLink);
  } catch (error) {
    console.error("Erreur updateLink :", error);
    res.status(500).json({ error: "Erreur serveur (updateLink)" });
  }
};

// Supprimer un lien //
export const deleteLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json("Lien non trouvé");

    if (link.logoFileId && !(await isFileInUse(link.logoFileId))) {
      await imagekit.deleteFile(link.logoFileId);
    }

    await Link.findByIdAndDelete(req.params.id);
    res.status(200).json("Lien supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
