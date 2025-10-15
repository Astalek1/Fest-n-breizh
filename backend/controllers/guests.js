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
      if (body[field] !== undefined && body[field] !== "")
        filteredData[field] = body[field];
    }

    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      (filteredData.name || guest.name || `${Date.now()}`)
        .replace(/\s+/g, "-")
        .toLowerCase();

    const mediaType = body.mediaType?.toLowerCase(); // "image", "logo" ou "video"

    // === Cas 1️⃣ : on ajoute ou remplace un média ===
    if (req.file || body.media || mediaType === "video") {
      let folder = "/festn_breizh/invités";
      if (mediaType === "logo") folder = "/festn_breizh/logos";

      // --- Gestion des vidéos ---
      if (mediaType === "video") {
        filteredData.media = body.media; // URL YouTube
        filteredData.mediaFileId = null;
        filteredData.logo = null;
        filteredData.logoFileId = null;
      } else {
        // Upload d’une image ou d’un logo
        const newMedia = await resolveMedia(
          body.media,
          req.file,
          folder,
          `${cleanName}-${Date.now()}`
        );

        if (!newMedia?.url)
          return res.status(400).json("Média invalide ou introuvable");

        // 🧹 Suppression ancienne ressource AVANT mise à jour
        if (mediaType === "logo") {
          // suppression directe de l’ancienne image
          if (guest.mediaFileId) {
            try {
              await imagekit.deleteFile(guest.mediaFileId);
              console.log("Ancienne image supprimée :", guest.mediaFileId);
            } catch (e) {
              console.error("Erreur suppression image :", e.message);
            }
          }

          // suppression conditionnelle de l’ancien logo
          if (guest.logoFileId && guest.logoFileId !== newMedia.fileId) {
            const inUse = await isFileInUse(guest.logoFileId);
            if (inUse === false) {
              try {
                await imagekit.deleteFile(guest.logoFileId);
                console.log("Ancien logo supprimé :", guest.logoFileId);
              } catch (e) {
                console.error("Erreur suppression logo :", e.message);
              }
            }
          }

          filteredData.logo = newMedia.url;
          filteredData.logoFileId = newMedia.fileId;
          filteredData.media = null;
          filteredData.mediaFileId = null;
        } else {
          // suppression conditionnelle de l’ancien logo
          if (guest.logoFileId) {
            const inUse = await isFileInUse(guest.logoFileId);
            if (inUse === false) {
              try {
                await imagekit.deleteFile(guest.logoFileId);
                console.log("Ancien logo supprimé :", guest.logoFileId);
              } catch (e) {
                console.error("Erreur suppression logo :", e.message);
              }
            }
          }

          // suppression directe de l’ancienne image
          if (guest.mediaFileId && guest.mediaFileId !== newMedia.fileId) {
            try {
              await imagekit.deleteFile(guest.mediaFileId);
              console.log("Ancienne image supprimée :", guest.mediaFileId);
            } catch (e) {
              console.error("Erreur suppression image :", e.message);
            }
          }

          filteredData.media = newMedia.url;
          filteredData.mediaFileId = newMedia.fileId;
          filteredData.logo = null;
          filteredData.logoFileId = null;
        }

        filteredData.mediaName = newMedia.fileName || cleanName;
      }
    }

    // === Cas 2️⃣ : mise à jour du nom du média uniquement ===
    if (!req.file && !body.media && req.body.fileName) {
      filteredData.mediaName = req.body.fileName
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
    }

    // === Cas 3️⃣ : mise à jour finale ===
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
