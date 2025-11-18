import Link from "../models/Links.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// Créer un nouveau lien //
export const newLink = async (req, res) => {
  try {
    const body = JSON.parse(req.body.link || "{}");

    const cleanName = (req.body.fileName || body.fileName || "logo-link")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    let logoUrl = null;
    let logoFileId = null;
    let logoName = cleanName;

    // a) Réutilisation d’un logo existant (fileId)
    if (body.file && /^[a-zA-Z0-9]{8,}$/.test(body.file)) {
      const details = await imagekit.getFileDetails(body.file);
      logoUrl = details.url;
      logoFileId = details.fileId;
      logoName = details.name.replace(/\.[^/.]+$/, "");
    }

    // b) Nouveau logo (upload)
    else if (req.file) {
      const uploaded = await resolveMedia(body.media, req.file, "/festn_breizh/logos", cleanName);
      if (!uploaded?.url) return res.status(400).json("Logo invalide");
      logoUrl = uploaded.url;
      logoFileId = uploaded.fileId;
      logoName = uploaded.fileName || cleanName;
    }

    // c) URL externe
    else if (body.media && /^https?:\/\//i.test(body.media)) {
      const uploaded = await resolveMedia(body.media, null, "/festn_breizh/logos", cleanName);
      if (!uploaded?.url) return res.status(400).json("Logo invalide");
      logoUrl = uploaded.url;
      logoFileId = uploaded.fileId;
      logoName = uploaded.fileName || cleanName;
    }

    if (!logoUrl) return res.status(400).json("Aucun logo fourni");

    const newLink = new Link({
      title: body.title,
      description: body.description,
      url: body.url || null,
      logo: logoUrl,
      logoFileId,
      logoName,
    });

    await newLink.save();
    res.status(201).json({ message: "Lien ajouté avec succès !" });
  } catch (error) {
    console.error("Erreur newLink :", error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les liens //
export const getAllLinks = async (req, res) => {
  try {
    const links = await Link.find();
    res.status(200).json(links);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Récupérer un lien //
export const getOneLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json("Lien non trouvé");
    res.status(200).json(link);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Mettre à jour un lien //
export const updateLink = async (req, res) => {
  try {
    const existing = await Link.findById(req.params.id);
    if (!existing) return res.status(404).json("Lien non trouvé");

    let body = {};
    try {
      body = req.body.link ? JSON.parse(req.body.link) : req.body;
    } catch {
      body = req.body || {};
    }

    const filtered = {};
    for (const k of ["title", "description", "url"]) {
      if (body[k] !== undefined) filtered[k] = body[k];
    }

    const baseName = (req.body.fileName || body.fileName || existing.logoName || "logo-link")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    const oldFileId = existing.logoFileId;
    let newFileId = oldFileId;
    let didChangeFile = false;

    // a) Renommage du logo existant
    if (!req.file && !body.file && !body.media && existing.logoFileId) {
      const ext = (existing.logo.split(".").pop() || "webp").toLowerCase();
      const newName = `${baseName}.${ext}`;
      await imagekit.updateFileDetails(existing.logoFileId, { name: newName });

      filtered.logo = existing.logo.replace(/[^/]+$/, newName);
      filtered.logoName = baseName;
    }

    // b) Réutilisation d’un logo existant via fileId
    else if (!req.file && body.file && /^[a-zA-Z0-9]{8,}$/.test(body.file)) {
      const details = await imagekit.getFileDetails(body.file);

      filtered.logo = details.url;
      filtered.logoFileId = details.fileId;
      filtered.logoName = details.name.replace(/\.[^/.]+$/, "");

      newFileId = details.fileId;
      didChangeFile = oldFileId && oldFileId !== newFileId;
    }

    // c) Nouveau logo
    else if (req.file || (body.media && /^https?:\/\//i.test(body.media))) {
      const uploaded = await resolveMedia(body.media, req.file, "/festn_breizh/logos", baseName);
      if (!uploaded?.url) return res.status(400).json("Logo invalide");

      filtered.logo = uploaded.url;
      filtered.logoFileId = uploaded.fileId;
      filtered.logoName = uploaded.fileName || baseName;

      newFileId = uploaded.fileId;
      didChangeFile = oldFileId && oldFileId !== newFileId;
    }

    const updated = await Link.findByIdAndUpdate(req.params.id, filtered, {
      new: true,
      runValidators: true,
    });

    // Suppression sécurisée
    if (didChangeFile && oldFileId) {
      const inUse = await isFileInUse(oldFileId);
      if (!inUse) {
        try {
          await imagekit.deleteFile(oldFileId);
        } catch (e) {
          console.error("Suppression ImageKit échouée :", e?.message || e);
        }
      }
    }

    res.status(200).json(updated);
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

    const fileId = link.logoFileId || null;

    await Link.findByIdAndDelete(req.params.id);

    if (fileId) {
      const inUse = await isFileInUse(fileId);
      if (!inUse) {
        try {
          await imagekit.deleteFile(fileId);
        } catch (e) {
          console.error("Suppression ImageKit échouée :", e?.message || e);
        }
      }
    }

    res.status(200).json("Lien supprimé avec succès");
  } catch (error) {
    console.error("Erreur deleteLink :", error);
    res.status(500).json({ error: "Erreur serveur (deleteLink)" });
  }
};
