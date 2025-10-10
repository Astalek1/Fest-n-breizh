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

// Mettre à jour un lien //
export const updateLink = async (req, res) => {
  try {
    const existingLink = await Link.findById(req.params.id);
    if (!existingLink) return res.status(404).json("Lien non trouvé");

    // Récupération sûre du body (form-data ou raw JSON)
    const body = req.body?.link ? JSON.parse(req.body.link) : req.body;

    // 1) Mises à jour textuelles
    const allowedFields = ["title", "description", "url"];
    const filteredData = {};
    for (const k of allowedFields) {
      if (body[k] !== undefined) filteredData[k] = body[k];
    }

    // 2) Renommage du logo SANS nouveau fichier (fileName seul)
    if (
      !req.file &&
      !body.logo &&
      req.body.fileName &&
      existingLink.logoFileId
    ) {
      const base = req.body.fileName.trim().replace(/\s+/g, "-").toLowerCase();
      const ext =
        (existingLink.logo && existingLink.logo.split(".").pop()) || "webp";
      const newName = `${base}.${ext}`;

      // rename côté ImageKit
      await imagekit.updateFileDetails(existingLink.logoFileId, {
        name: newName,
      });

      // récupérer l'URL à jour depuis ImageKit
      let newUrl = existingLink.logo;
      try {
        const details = await imagekit.getFileDetails(existingLink.logoFileId);
        if (details?.url) newUrl = details.url;
      } catch {
        // fallback: remplacer le nom en fin d'URL
        newUrl = existingLink.logo.replace(/[^/]+$/, newName);
      }

      filteredData.logo = newUrl;
      filteredData.logoName = base; // ajout de la synchro du nom
    }

    // 3) Remplacement du logo (nouveau fichier ou URL)
    if (req.file || body.logo) {
      const nameSource = req.body.fileName?.trim()
        ? req.body.fileName
        : filteredData.title || existingLink.title || "link";
      const cleanName = nameSource.replace(/\s+/g, "-").toLowerCase();

      const newLogo = await resolveMedia(
        body.logo,
        req.file,
        "/festn_breizh/logos",
        cleanName
      );
      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      // supprimer l’ancien fichier s’il n’est plus utilisé
      if (existingLink.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingLink.logoFileId);
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
      filteredData.logoName = newLogo.fileName || cleanName; // ajout de la synchro du nom
    }

    const updatedLink = await Link.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedLink);
  } catch (error) {
    console.error("Erreur updateLink :", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du lien." });
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
