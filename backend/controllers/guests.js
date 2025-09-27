import Guest from "../models/Guests";
import imagekit from "../config/imageKit";
import { resolveMedia } from "../utils/resolveMedia";
import { isFileInUse } from "../utils/isFileInUse";

//créer un nouvel invité//
export const newGuest = async (req, res) => {
  try {
    const guestData = JSON.parse(req.body.guest);
    const cleanName = guestData.name.replace(/\s+/g, "-").toLowerCase();

    const mediaResult = await resolveMedia(
      guestData.media,
      req.file,
      "/festn_breizh/invités",
      cleanName
    );

    const newGuest = new Guest({
      name: guestData.name,
      description: guestData.description,
      media: mediaResult.url,
      mediaFileId: mediaResult.fileId,
    });
    await newGuest.save();
    res.status(201).json({ message: "invité ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver tous les invités//
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find();
    res.status(200).json(guests);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//trouver un seul invité//
export const getOneGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json("invité non trouvé");
    }
    res.status(200).json(guest);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

//modifier un invité//
export const updateGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");

    const allowedFields = ["name", "description", "media"];
    const filteredData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );
    if (req.file || filteredData.media) {
      const cleanName = (filteredData.name || guest.name)
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newMedia = await resolveMedia(
        filteredData.media,
        req.file,
        "/festn_breizh/invités",
        cleanName
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      if (guest.mediaFileId && newMedia.fileId) {
        await imagekit.deleteFile(guest.mediaFileId);
      }
      filteredData.media = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
    }
    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedGuest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un invité //
export const deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json("Invité non trouvé");
    }

    if (guest.mediaFileId) {
      const inUse = await isFileInUse(guest.mediaFileId);

      if (!inUse) {
        await imagekit.deleteFile(guest.mediaFileId);
      }
    }

    await Guest.findByIdAndDelete(req.params.id);

    res.status(200).json("Invité supprimé avec succès");
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};
