import Partner from "../models/Partners.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// Créer un nouveau partenaire //
export const newPartner = async (req, res) => {
  try {
    const partnerData = JSON.parse(req.body.partner || "{}");

let cleanName = req.body.fileName || partnerData.fileName || null;

if (!cleanName && req.file) {
  cleanName = req.file.originalname.replace(/\.[^/.]+$/, "");
}

if (!cleanName) {
  return res.status(400).json("Nom de fichier introuvable — fileName ou upload requis.");
}

cleanName = cleanName
  .trim()
  .replace(/\s+/g, "-")
  .toLowerCase();



    const fileValue = partnerData.file || null;
    let mediaResult;

    // Cas fileId existant → on génère un mediaResult complet
    if (fileValue && /^[a-zA-Z0-9]{8,}$/.test(fileValue)) {
      const details = await imagekit.getFileDetails(fileValue);
      mediaResult = {
        url: details.url,
        fileId: details.fileId,
        fileName: details.name.replace(/\.[^/.]+$/, ""),
      };
    } else {
      // Cas normal (upload ou URL)
      mediaResult = await resolveMedia(
        fileValue,
        req.file,
        "/festn_breizh/logos",
        cleanName
      );
    }

    if (!mediaResult?.url) return res.status(400).json("Logo invalide");

    const newPartner = new Partner({
      name: partnerData.name,
      description: partnerData.description,
      url: partnerData.url || null,
      logo: mediaResult.url,
      logoFileId: mediaResult.fileId,
      logoName: mediaResult.fileName || cleanName,
    });

    await newPartner.save();
    res.status(201).json({ message: "Partenaire ajouté avec succès !" });

  } catch (error) {
    console.error("Erreur newPartner :", error);
    res.status(500).json({ error: error.message });
  }
};



// Récupérer tous les partenaires //
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ _id: -1 });
    res.status(200).json(partners);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Récupérer un partenaire //
export const getOnePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json("Partenaire non trouvé");
    res.status(200).json(partner);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Modifier un partenaire //
export const updatePartner = async (req, res) => {
  try {
    const existing = await Partner.findById(req.params.id);
    if (!existing) return res.status(404).json("Partenaire non trouvé");

    let body = {};
    try {
      body = req.body.partner ? JSON.parse(req.body.partner) : req.body;
    } catch {
      body = req.body || {};
    }

    const filtered = {};
    for (const k of ["name", "description", "url"]) {
      if (body[k] !== undefined) filtered[k] = body[k];
    }

    const baseName = (req.body.fileName || body.fileName || existing.logoName || "logo-partner")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    const fileValue = body.file || null;

    const oldFileId = existing.logoFileId;
    let newFileId = oldFileId;
    let didChangeFile = false;

    // a) Renommage du logo existant (pas d’upload, pas de fileId, pas d’URL)
    if (!req.file && !fileValue && existing.logoFileId) {
      const ext = (existing.logo.split(".").pop() || "webp").toLowerCase();
      const newName = `${baseName}.${ext}`;

      await imagekit.updateFileDetails(existing.logoFileId, { name: newName });
      filtered.logo = existing.logo.replace(/[^/]+$/, newName);
      filtered.logoName = baseName;
    }

    // b) Réutilisation d’un logo existant (fileId)
    else if (!req.file && fileValue && /^[a-zA-Z0-9]{8,}$/.test(fileValue)) {
      const details = await imagekit.getFileDetails(fileValue);
      filtered.logo = details.url;
      filtered.logoFileId = details.fileId;
      filtered.logoName = details.name.replace(/\.[^/.]+$/, "");
      newFileId = details.fileId;
      didChangeFile = oldFileId && oldFileId !== newFileId;
    }

    // c) Nouveau logo (upload ou URL)
    else if (req.file || (fileValue && /^https?:\/\//i.test(fileValue))) {
      const uploaded = await resolveMedia(fileValue, req.file, "/festn_breizh/logos", baseName);
      if (!uploaded?.url) return res.status(400).json("Logo invalide");

      filtered.logo = uploaded.url;
      filtered.logoFileId = uploaded.fileId;
      filtered.logoName = uploaded.fileName || baseName;
      newFileId = uploaded.fileId;
      didChangeFile = oldFileId && oldFileId !== newFileId;
    }

    const updated = await Partner.findByIdAndUpdate(req.params.id, filtered, {
      new: true,
      runValidators: true,
    });

    // Suppression conditionnelle du logo inutilisé //
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
    console.error("Erreur updatePartner :", error);
    res.status(500).json({ error: "Erreur serveur (updatePartner)" });
  }
};

// Supprimer un partenaire //
export const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json("Partenaire non trouvé");

    const fileId = partner.logoFileId || null;
    await Partner.findByIdAndDelete(req.params.id);

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

    res.status(200).json("Partenaire supprimé avec succès");
  } catch (error) {
    console.error("Erreur deletePartner :", error);
    res.status(500).json({ error: "Erreur serveur (deletePartner)" });
  }
};
