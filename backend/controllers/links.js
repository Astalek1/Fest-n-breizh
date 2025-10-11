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

    // Récupération du body (form-data ou JSON brut)
    const body = req.body?.link ? JSON.parse(req.body.link) : req.body;

    // 1) Mises à jour textuelles
    const allowedFields = ["title", "description", "url"];
    const filteredData = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) filteredData[key] = body[key];
    }

    // 2) Utiliser un logo déjà présent (URL + fileId fournis, sans upload)
    if (body.logo && body.logoFileId && !req.file) {
      if (
        existingLink.logoFileId &&
        existingLink.logoFileId !== body.logoFileId
      ) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingLink.logoFileId);
      }

      filteredData.logo = body.logo;
      filteredData.logoFileId = body.logoFileId;

      const updated = await Link.findByIdAndUpdate(
        req.params.id,
        filteredData,
        {
          new: true,
          runValidators: true,
        }
      );

      return res.status(200).json(updated);
    }

    // 3) Renommage du logo sans nouveau fichier (fileName seul)
    if (
      !req.file &&
      !body.logo &&
      (req.body.fileName || body.fileName) &&
      existingLink.logoFileId
    ) {
      const base = (req.body.fileName || body.fileName)
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

      const ext =
        (existingLink.logo && existingLink.logo.split(".").pop()) || "webp";
      const newName = `${base}.${ext}`;

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
      filteredData.logoName = base;
    }

    // 4) Remplacement du logo (nouveau fichier ou URL)
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

      if (existingLink.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingLink.logoFileId);
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
      filteredData.logoName = newLogo.fileName || cleanName;
    }

    // 5) Sauvegarde finale
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
