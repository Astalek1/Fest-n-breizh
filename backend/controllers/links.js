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

    const body = req.body?.link ? JSON.parse(req.body.link) : req.body;
    const filtered = {};

    // champs textuels
    for (const k of ["title", "description", "url"]) {
      if (body[k] !== undefined) filtered[k] = body[k];
    }

    const isURL = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
    const hasFile = !!req.file;

    // 1) Renommer le logo existant (sans nouveau média)
    const renameBase = (req.body.fileName || body.fileName || "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    if (!hasFile && !body.logo && renameBase && existingLink.logoFileId) {
      const currentExt =
        (existingLink.logo && existingLink.logo.split(".").pop()) || "webp";
      const newName = `${renameBase}.${currentExt}`;

      await imagekit.updateFileDetails(existingLink.logoFileId, {
        name: newName,
      });

      // URL à jour
      let newUrl = existingLink.logo;
      try {
        const d = await imagekit.getFileDetails(existingLink.logoFileId);
        if (d?.url) newUrl = d.url;
      } catch {
        newUrl = existingLink.logo.replace(/[^/]+$/, newName);
      }

      filtered.logo = newUrl;
      if ("logoName" in Link.schema.paths) filtered.logoName = renameBase;
    }

    // 2) Remplacer par un logo DÉJÀ EXISTANT (fileId passé dans body.logo)
    if (!hasFile && body.logo && !isURL(body.logo)) {
      const picked = await imagekit.getFileDetails(body.logo); // body.logo = fileId

      // renommer ce fichier si fileName fourni
      if (renameBase) {
        const ext = (picked.name && picked.name.split(".").pop()) || "webp";
        const newName = `${renameBase}.${ext}`;
        await imagekit.updateFileDetails(picked.fileId, { name: newName });
        try {
          const d2 = await imagekit.getFileDetails(picked.fileId);
          filtered.logo = d2?.url || picked.url;
        } catch {
          filtered.logo = picked.url.replace(/[^/]+$/, newName);
        }
        if ("logoName" in Link.schema.paths) filtered.logoName = renameBase;
      } else {
        filtered.logo = picked.url;
      }
      filtered.logoFileId = picked.fileId;

      // nettoyer l'ancien si différent et inutile
      if (
        existingLink.logoFileId &&
        existingLink.logoFileId !== picked.fileId
      ) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingLink.logoFileId);
      }
    }

    // 3) Remplacer par NOUVEAU média (fichier ou URL)
    if (hasFile || (body.logo && isURL(body.logo))) {
      const base = (
        renameBase ||
        filtered.title ||
        existingLink.title ||
        "link"
      )
        .toString()
        .replace(/\s+/g, "-")
        .toLowerCase();

      const uploaded = await resolveMedia(
        body.logo, // URL éventuelle
        req.file, // fichier éventuel (multer.single("file"))
        "/festn_breizh/logos",
        base
      );
      if (!uploaded?.url) return res.status(400).json("Logo invalide");

      if (existingLink.logoFileId && uploaded.fileId) {
        const inUse = await isFileInUse(existingLink.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingLink.logoFileId);
      }

      filtered.logo = uploaded.url;
      filtered.logoFileId = uploaded.fileId || null;
      if ("logoName" in Link.schema.paths) filtered.logoName = base;
    }

    const updated = await Link.findByIdAndUpdate(req.params.id, filtered, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error("updateLink error:", err);
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
