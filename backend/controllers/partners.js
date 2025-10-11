import Partner from "../models/Partners.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// 🔹 Créer un nouveau partenaire
export const newPartner = async (req, res) => {
  try {
    const partnerData = JSON.parse(req.body.partner || "{}");

    // Nom unique du logo (indépendant du nom du partenaire)
    const uniqueName = `partner-${Date.now()}`;

    // Upload du logo
    const mediaResult = await resolveMedia(
      partnerData.media,
      req.file,
      "/festn_breizh/logos",
      uniqueName
    );

    if (!mediaResult?.url) {
      return res.status(400).json("Logo invalide");
    }

    const newPartner = new Partner({
      name: partnerData.name,
      description: partnerData.description,
      url: partnerData.url || null,
      logo: mediaResult.url,
      logoFileId: mediaResult.fileId,
      logoName: mediaResult.fileName || uniqueName,
    });

    await newPartner.save();
    res.status(201).json({ message: "Partenaire ajouté avec succès !" });
  } catch (error) {
    console.error("Erreur newPartner :", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Récupérer tous les partenaires
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find();
    res.status(200).json(partners);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// 🔹 Récupérer un seul partenaire
export const getOnePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json("Partenaire non trouvé");
    res.status(200).json(partner);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// 🔹 Modifier un partenaire
export const updatePartner = async (req, res) => {
  try {
    const existingPartner = await Partner.findById(req.params.id);
    if (!existingPartner) return res.status(404).json("Partenaire non trouvé");

    let body = {};
    try {
      body = req.body.partner ? JSON.parse(req.body.partner) : req.body;
    } catch {
      body = req.body || {};
    }

    const filteredData = {};
    for (const field of ["name", "description", "url"]) {
      if (body[field] !== undefined) filteredData[field] = body[field];
    }

    // Aucun nouveau fichier => pas d’action sur le logo
    if (!req.file && !body.logo) {
      const updatedPartner = await Partner.findByIdAndUpdate(
        req.params.id,
        filteredData,
        { new: true, runValidators: true }
      );
      return res.status(200).json(updatedPartner);
    }

    // Réutilisation d’un logo existant (fileId transmis)
    if (body.logo && /^[a-zA-Z0-9]{8,}$/.test(body.logo)) {
      const logoDetails = await imagekit.getFileDetails(body.logo);
      filteredData.logo = logoDetails.url;
      filteredData.logoFileId = logoDetails.fileId;
      filteredData.logoName = logoDetails.name;

      if (
        existingPartner.logoFileId &&
        existingPartner.logoFileId !== logoDetails.fileId
      ) {
        const inUse = await isFileInUse(existingPartner.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingPartner.logoFileId);
      }
    }

    // Nouveau fichier uploadé (remplacement)
    else if (req.file || (body.logo && /^https?:\/\//i.test(body.logo))) {
      const newLogo = await resolveMedia(
        body.logo,
        req.file,
        "/festn_breizh/logos",
        `partner-${Date.now()}`
      );

      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      if (existingPartner.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(existingPartner.logoFileId);
        if (!inUse) await imagekit.deleteFile(existingPartner.logoFileId);
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
      filteredData.logoName = newLogo.fileName;
    }

    const updatedPartner = await Partner.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedPartner);
  } catch (error) {
    console.error("Erreur updatePartner :", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Supprimer un partenaire
export const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json("Partenaire non trouvé");

    if (partner.logoFileId) {
      const inUse = await isFileInUse(partner.logoFileId);
      if (!inUse) await imagekit.deleteFile(partner.logoFileId);
    }

    await Partner.findByIdAndDelete(req.params.id);
    res.status(200).json("Partenaire supprimé avec succès");
  } catch (error) {
    console.error("Erreur deletePartner :", error);
    res.status(500).json({ error: error.message });
  }
};
