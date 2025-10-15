import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// créer un nouvel invité //
export const newGuest = async (req, res) => {
  try {
    const guestData = JSON.parse(req.body.guest);

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      req.file?.originalname
        ?.split(".")[0]
        .replace(/\s+/g, "-")
        .toLowerCase() ||
      guestData.name?.replace(/\s+/g, "-").toLowerCase() ||
      `${Date.now()}`;

    const mediaResult = await resolveMedia(
      guestData.media,
      req.file,
      "/festn_breizh/invités",
      cleanName
    );

    let logoResult = null;
    if (guestData.logo) {
      const logoName = `${cleanName}-logo`;
      logoResult = await resolveMedia(
        guestData.logo,
        null,
        "/festn_breizh/logos",
        logoName
      );
    }

    const newGuest = new Guest({
      name: guestData.name,
      description: guestData.description,
      media: mediaResult?.url || logoResult?.url || null,
      mediaFileId: mediaResult?.fileId || logoResult?.fileId || null,
      mediaName:
        req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        guestData.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        mediaResult?.fileName ||
        cleanName,
    });

    await newGuest.save();
    res.status(201).json({ message: "Invité ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver tous les invités //
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find();
    res.status(200).json(guests);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver un seul invité //
export const getOneGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");
    res.status(200).json(guest);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// modifier un invité //
export const updateGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");

    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    const allowedFields = ["name", "description"];
    const filteredData = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) filteredData[field] = body[field];
    }

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      (filteredData.name || guest.name || `${Date.now()}`)
        .replace(/\s+/g, "-")
        .toLowerCase();

    // --- Média principal ---
    if (req.file || body.media) {
      const newMedia = await resolveMedia(
        body.media,
        req.file,
        "/festn_breizh/invités",
        `${cleanName}-${Date.now()}`
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      if (guest.mediaFileId && guest.mediaFileId !== newMedia.fileId) {
        const inUse = await isFileInUse(guest.mediaFileId);
        if (!inUse) {
          try {
            await imagekit.deleteFile(guest.mediaFileId);
            console.log("Ancien média supprimé :", guest.mediaFileId);
          } catch (e) {
            console.error(
              "Erreur suppression ancienne image :",
              e?.message || e
            );
          }
        }
      }

      filteredData.media = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
    }

    // --- Logo optionnel ---
    if (body.logo) {
      const newLogo = await resolveMedia(
        body.logo,
        null,
        "/festn_breizh/logos",
        `${cleanName}-logo`
      );

      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      if (guest.logoFileId && newLogo.fileId) {
        const inUse = await isFileInUse(guest.logoFileId);
        if (inUse === false) await imagekit.deleteFile(guest.logoFileId);
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
    }

    // --- Mise à jour du nom du média sans changement de fichier ---
    if (!req.file && !body.media && req.body.fileName) {
      filteredData.mediaName = req.body.fileName
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
    }

    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      filteredData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedGuest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// supprimer un invité //
export const deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");

    if (guest.mediaFileId) {
      const inUse = await isFileInUse(guest.mediaFileId);
      if (inUse === false) await imagekit.deleteFile(guest.mediaFileId);
    }

    if (guest.logoFileId) {
      const inUse = await isFileInUse(guest.logoFileId);
      if (inUse === false) await imagekit.deleteFile(guest.logoFileId);
    }

    await Guest.findByIdAndDelete(req.params.id);
    res.status(200).json("Invité supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteGuest)" });
  }
};
