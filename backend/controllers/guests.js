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

    const mediaType = guestData.mediaType?.toLowerCase(); // "image", "logo" ou "video"

    // --- Cas vidéo (URL uniquement) ---
    if (mediaType === "video") {
      const newGuest = new Guest({
        name: guestData.name,
        description: guestData.description,
        media: guestData.media,
        mediaFileId: null,
        mediaName: cleanName,
      });
      await newGuest.save();
      return res
        .status(201)
        .json({ message: "Invité vidéo ajouté avec succès !" });
    }

    // --- Dossier selon le type ---
    const folder =
      mediaType === "logo" ? "/festn_breizh/logos" : "/festn_breizh/invités";

    let mediaResult;

    // ✅ Si le logo ou l'image est déjà présent (fileId fourni)
    if (
      guestData.media &&
      typeof guestData.media === "object" &&
      guestData.media.fileId
    ) {
      const fileDetails = await imagekit
        .getFileDetails(guestData.media.fileId)
        .catch(() => null);
      if (!fileDetails)
        return res
          .status(400)
          .json("Fichier introuvable sur ImageKit (fileId invalide)");
      mediaResult = {
        url: fileDetails.url,
        fileId: fileDetails.fileId,
        fileName: fileDetails.name,
      };
    } else {
      // Upload ou URL classique
      mediaResult = await resolveMedia(
        guestData.media,
        req.file,
        folder,
        cleanName
      );
    }

    if (!mediaResult?.url)
      return res.status(400).json("Média invalide ou introuvable");

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
      if (body[field] !== undefined && body[field] !== "")
        filteredData[field] = body[field];
    }

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      (filteredData.name || guest.name || `${Date.now()}`)
        .replace(/\s+/g, "-")
        .toLowerCase();

    const mediaType = body.mediaType?.toLowerCase();
    let oldLogoId = guest.logoFileId;
    let oldImageId = guest.mediaFileId;

    // === Gestion du nouveau média ===
    if (req.file || body.media || mediaType === "video") {
      if (mediaType === "video") {
        filteredData.media = body.media;
        filteredData.mediaFileId = null;
        filteredData.logo = null;
        filteredData.logoFileId = null;
      } else {
        const folder =
          mediaType === "logo"
            ? "/festn_breizh/logos"
            : "/festn_breizh/invités";

        let newMedia;

        // ✅ Cas d’un logo déjà existant (fileId)
        if (body.media && typeof body.media === "object" && body.media.fileId) {
          const fileDetails = await imagekit
            .getFileDetails(body.media.fileId)
            .catch(() => null);
          if (!fileDetails)
            return res
              .status(400)
              .json("Fichier introuvable sur ImageKit (fileId invalide)");
          newMedia = {
            url: fileDetails.url,
            fileId: fileDetails.fileId,
            fileName: fileDetails.name,
          };
        } else {
          // Upload / URL standard
          newMedia = await resolveMedia(
            body.media,
            req.file,
            folder,
            `${cleanName}-${Date.now()}`
          );
        }

        if (!newMedia?.url)
          return res.status(400).json("Média invalide ou introuvable");

        if (mediaType === "logo") {
          filteredData.logo = newMedia.url;
          filteredData.logoFileId = newMedia.fileId;
          filteredData.media = null;
          filteredData.mediaFileId = null;
        } else {
          filteredData.media = newMedia.url;
          filteredData.mediaFileId = newMedia.fileId;
          filteredData.logo = null;
          filteredData.logoFileId = null;
        }

        filteredData.mediaName = newMedia.fileName || cleanName;
      }
    }

    // === Mise à jour de la base ===
    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    // === Nettoyage intelligent ===
    if (mediaType === "logo" && oldImageId) {
      try {
        await imagekit.deleteFile(oldImageId);
      } catch (e) {
        console.error("Erreur suppression ancienne image :", e.message);
      }
    }

    if (mediaType === "image" && oldLogoId) {
      const inUse = await isFileInUse(oldLogoId);
      if (inUse === false) {
        try {
          await imagekit.deleteFile(oldLogoId);
        } catch (e) {
          console.error("Erreur suppression ancien logo :", e.message);
        }
      }
    }

    if (
      mediaType === "logo" &&
      oldLogoId &&
      oldLogoId !== updatedGuest.logoFileId
    ) {
      const inUse = await isFileInUse(oldLogoId);
      if (inUse === false) {
        try {
          await imagekit.deleteFile(oldLogoId);
        } catch (e) {
          console.error("Erreur suppression ancien logo :", e.message);
        }
      }
    }

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
      try {
        await imagekit.deleteFile(guest.mediaFileId);
      } catch (e) {
        console.error("Erreur suppression image :", e.message);
      }
    }

    if (guest.logoFileId) {
      const inUse = await isFileInUse(guest.logoFileId);
      if (inUse === false) {
        try {
          await imagekit.deleteFile(guest.logoFileId);
        } catch (e) {
          console.error("Erreur suppression logo :", e.message);
        }
      }
    }

    await Guest.findByIdAndDelete(req.params.id);
    res.status(200).json("Invité supprimé avec succès");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteGuest)" });
  }
};
