import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

// === Créer un nouvel invité ===
export const newGuest = async (req, res) => {
  try {
    const guestData = JSON.parse(req.body.guest);

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      req.file?.originalname
        ?.split(".")[0]
        ?.replace(/\s+/g, "-")
        .toLowerCase() ||
      guestData.name?.replace(/\s+/g, "-").toLowerCase() ||
      `${Date.now()}`;

    // Dossier selon le type de média
    const folder = guestData.logo
      ? "/festn_breizh/logos"
      : "/festn_breizh/invités";

    const mediaResult = await resolveMedia(
      guestData.media || guestData.logo,
      req.file,
      folder,
      cleanName
    );

    if (!mediaResult?.url) return res.status(400).json("Média invalide");

    const newGuest = new Guest({
      name: guestData.name,
      description: guestData.description,
      media: mediaResult.url,
      mediaFileId: mediaResult.fileId,
      mediaName:
        req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        guestData.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        mediaResult.fileName ||
        cleanName,
    });

    await newGuest.save();
    res.status(201).json({ message: "Invité ajouté avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// === Récupérer tous les invités ===
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find();
    res.status(200).json(guests);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === Récupérer un invité ===
export const getOneGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");
    res.status(200).json(guest);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === Modifier un invité ===
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

    // === Cas 1 : on remplace par une image ===
    if ((req.file || body.media) && !body.logo) {
      const newMedia = await resolveMedia(
        body.media,
        req.file,
        "/festn_breizh/invités",
        `${cleanName}-${Date.now()}`
      );

      if (!newMedia?.url) return res.status(400).json("Média invalide");

      // Supprimer l’ancien logo s’il existe
      if (guest.logoFileId) {
        const inUse = await isFileInUse(guest.logoFileId);
        if (inUse === false) {
          await imagekit.deleteFile(guest.logoFileId);
        }
      }

      // Supprimer l’ancien média
      if (guest.mediaFileId) {
        await imagekit.deleteFile(guest.mediaFileId);
      }

      filteredData.media = newMedia.url;
      filteredData.mediaFileId = newMedia.fileId;
      filteredData.logo = null;
      filteredData.logoFileId = null;
      filteredData.mediaName = newMedia.fileName || cleanName;
    }

    // === Cas 2 : on remplace par un logo ===
    if (body.logo) {
      const newLogo = await resolveMedia(
        body.logo,
        req.file,
        "/festn_breizh/logos",
        `${cleanName}-logo`
      );

      if (!newLogo?.url) return res.status(400).json("Logo invalide");

      // Supprimer l’ancien média (image)
      if (guest.mediaFileId) {
        const inUse = await isFileInUse(guest.mediaFileId);
        if (inUse === false) {
          await imagekit.deleteFile(guest.mediaFileId);
        }
      }

      // Supprimer l’ancien logo s’il n’est plus utilisé
      if (guest.logoFileId) {
        const inUse = await isFileInUse(guest.logoFileId);
        if (inUse === false) {
          await imagekit.deleteFile(guest.logoFileId);
        }
      }

      filteredData.logo = newLogo.url;
      filteredData.logoFileId = newLogo.fileId;
      filteredData.media = null;
      filteredData.mediaFileId = null;
      filteredData.mediaName = newLogo.fileName || `${cleanName}-logo`;
    }

    // Mise à jour du nom du fichier sans changement de média
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

// === Supprimer un invité ===
export const deleteGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");

    if (guest.mediaFileId) {
      await imagekit.deleteFile(guest.mediaFileId);
    }

    if (guest.logoFileId) {
      const inUse = await isFileInUse(guest.logoFileId);
      if (inUse === false) {
        await imagekit.deleteFile(guest.logoFileId);
      }
    }

    await Guest.findByIdAndDelete(req.params.id);
    res.status(200).json("Invité supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteGuest)" });
  }
};
