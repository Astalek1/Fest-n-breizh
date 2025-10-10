import Partner from "../models/Partners.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// Créer un nouveau partenaire //
export const newPartner = async (req, res) => {
  try {
    const partnerData = JSON.parse(req.body.partner);

    const cleanName = req.body.fileName?.trim()
      ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
      : partnerData.name
      ? partnerData.name.replace(/\s+/g, "-").toLowerCase()
      : `${Date.now()}`;

    const mediaResult = await resolveMedia(
      partnerData.media,
      req.file,
      "/festn_breizh/logos",
      cleanName
    );

    if (!mediaResult?.url) return res.status(400).json("Logo invalide");

    const newPartner = new Partner({
      name: partnerData.name,
      description: partnerData.description,
      url: partnerData.url || null,
      logo: mediaResult.url,
      logoFileId: mediaResult.fileId,
    });

    await newPartner.save();
    res.status(201).json({ message: "Partenaire ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les partenaires //
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find();
    res.status(200).json(partners);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Récupérer un seul partenaire //
export const getOnePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json("Partenaire non trouvé");
    res.status(200).json(partner);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// Modifier un partenaire //
export const updatePartner = async (req, res) => {
  try {
    const body = req.body.partner ? JSON.parse(req.body.partner) : req.body;

    const existingPartner = await Partner.findById(req.params.id);
    if (!existingPartner) return res.status(404).json("Partenaire non trouvé");

    const allowedFields = ["name", "description", "url"];
    const filteredData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) filteredData[field] = body[field];
    }

    const cleanName = req.body.fileName?.trim()
      ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
      : (filteredData.name || existingPartner.name || `${Date.now()}`)
          .replace(/\s+/g, "-")
          .toLowerCase();

    // Mise à jour du logo si nécessaire
    if (req.file || body.logo) {
      const newLogo = await resolveMedia(
        body.logo,
        req.file,
        "/festn_breizh/logos",
        cleanName
      );

      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      if (
        existingPartner.logoFileId &&
        !(await isFileInUse(existingPartner.logoFileId))
      ) {
        await imagekit.deleteFile(existingPartner.logoFileId);
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
    }

    const updatedPartner = await Partner.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedPartner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un partenaire //
export const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json("Partenaire non trouvé");

    if (partner.logoFileId && !(await isFileInUse(partner.logoFileId))) {
      await imagekit.deleteFile(partner.logoFileId);
    }

    await Partner.findByIdAndDelete(req.params.id);
    res.status(200).json("Partenaire supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
