import Edition from "../models/Editions";
import Artiste from "../models/Artistes.js";
import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit";
import { isFileInUse } from "../utils/isFileInUse.js";

//créer une nouvelle edition//
export const createEdition = async (req, res) => {
  try {
    const editionData = JSON.parse(req.body.edition);

    const newEdition = new Edition({
      title: editionData.title,
      affiche: editionData.affiche,
      guests: editionData.guests,
      artistes: editionData.artistes,
    });
    await newEdition.save();
    res.status(201).json({ message: "Édition créée avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver toute les éditions//
export const getAllEditions = async (req, res) => {
  try {
    const editions = await Edition.find();
    res.status(200).json(editions);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//trouver une seul édition//
export const getOneEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id);
    if (!edition) {
      return res.status(404).json("édition non trouvée");
    }
    res.status(200).json(edition);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier une édition//
export const updateEdition = async (req, res) => {
  try {
    const allowedFields = ["title", "affiche", "guests", "artistes"];

    const filteredData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        filteredData[field] = req.body[field];
      }
    }

    // On récupère l'édition existante
    const existingEdition = await Edition.findById(req.params.id);
    if (!existingEdition) {
      return res.status(404).json("Édition non trouvée");
    }

    // Vérification : au moins un artiste doit rester après update
    const finalArtistes =
      filteredData.artistes !== undefined
        ? filteredData.artistes
        : existingEdition.artistes;

    if (!Array.isArray(finalArtistes) || finalArtistes.length < 1) {
      return res
        .status(400)
        .json("Une édition doit contenir au moins un artiste.");
    }

    // Mise à jour
    const newDataEdition = await Edition.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(newDataEdition);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// supprimer une édition //
export const deleteEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id);
    if (!edition) {
      return res.status(404).json("Édition non trouvée");
    }

    const artistesIds = edition.artistes || [];
    const guestsIds = edition.guests || [];

    await Edition.findByIdAndDelete(req.params.id);

    // Nettoyer artistes
    for (const artisteId of artistesIds) {
      const stillUsed = await Edition.findOne({ artistes: artisteId });
      if (!stillUsed) {
        const artiste = await Artiste.findByIdAndDelete(artisteId);
        if (artiste?.mediaFileId && !(await isFileInUse(artiste.mediaFileId))) {
          await imagekit.deleteFile(artiste.mediaFileId);
        }
      }
    }

    // Nettoyer invités
    for (const guestId of guestsIds) {
      const stillUsed = await Edition.findOne({ guests: guestId });
      if (!stillUsed) {
        const guest = await Guest.findByIdAndDelete(guestId);
        if (guest?.mediaFileId && !(await isFileInUse(guest.mediaFileId))) {
          await imagekit.deleteFile(guest.mediaFileId);
        }
      }
    }

    res.status(200).json("Édition supprimée avec nettoyage");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
