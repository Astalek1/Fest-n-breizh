import Partner from "../models/Partners.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

//créer un nouveau partenaire//
export const newPartner = async (req, res) => {
  try {
    const partnerData = JSON.parse(req.body.partner);
    const cleanName = partnerData.name.replace(/\s+/g, "-").toLowerCase();

    const mediaResult = await resolveMedia(
      partnerData.media,
      req.file,
      "/festn_breizh/logos",
      cleanName
    );

    const newPartner = new Partner({
      name: partnerData.name,
      description: partnerData.description,
      url: partnerData.url || null, // facultatif
      logo: mediaResult.url,
      logoFileId: mediaResult.fileId,
    });
    await newPartner.save();
    res.status(201).json({ message: "Partenaire ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver tous les partenaires//
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find();
    res.status(200).json(partners);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//trouver un seul partenaire //
export const getOnePartner = async (req, res) => {
  try {
    const partner = await Partner.findOne({
      _id: req.params.id,
    });
    if (!partner) {
      return res.status(404).json("Partenaire non trouvée");
    }
    res.status(200).json(partner);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier un partenaire//
export const updatePartner = async (req, res) => {
  try {
    const existingPartner = await Partner.findOne({
      _id: req.params.id,
    });
    if (!existingPartner) {
      return res.status(404).json("partenaire non trouvée");
    }

    const allowedFields = ["name", "url", "description"];

    const filteredData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        filteredData[field] = req.body[field];
      }
    }
    // Gestion du logo si mis à jour
    if (req.file || req.body.logo) {
      const cleanName = (filteredData.name || existingPartner.name)
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newLogo = await resolveMedia(
        req.body.logo,
        req.file,
        "/festn_breizh/logos",
        cleanName
      );
      if (!newLogo?.url) return res.status(400).json("Logo invalide");
      // Supprimer l'ancien logo si remplacé
      if (existingPartner.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(existingPartner.logoFileId);
        if (!inUse) {
          await imagekit.deleteFile(existingPartner.logoFileId);
        }
      }
      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
    }

    const newDataPartner = await Partner.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(newDataPartner);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// supprimer un partenaire //
export const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json("Partenaire non trouvé");
    }

    if (partner.logoFileId) {
      const inUse = await isFileInUse(partner.logoFileId);
      if (!inUse) {
        await imagekit.deleteFile(partner.logoFileId);
      }
    }

    await Partner.findByIdAndDelete(req.params.id);

    res.status(200).json("Partenaire supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
