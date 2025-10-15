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

    // --- 1️⃣ Mises à jour partielles du texte ---
    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== "")
        filteredData[field] = body[field];
    }

    // --- 2️⃣ Préparation du nom du média ---
    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      (filteredData.name || guest.name || `${Date.now()}`)
        .replace(/\s+/g, "-")
        .toLowerCase();

    // --- 3️⃣ Gestion du type de média ---
    if (body.mediaType) {
      const mediaType = body.mediaType.toLowerCase();

      // === Cas 1 : Vidéo (URL externe uniquement) ===
      if (mediaType === "video") {
        if (!body.media || !/^https?:\/\//.test(body.media))
          return res.status(400).json("Une URL vidéo valide est requise.");

        // Supprime les fichiers précédents (image/logo) si présents
        if (guest.mediaFileId) {
          try {
            await imagekit.deleteFile(guest.mediaFileId);
          } catch (e) {
            console.error("Erreur suppression ancienne image :", e.message);
          }
        }

        if (guest.logoFileId) {
          const inUse = await isFileInUse(guest.logoFileId);
          if (inUse === false) {
            try {
              await imagekit.deleteFile(guest.logoFileId);
            } catch (e) {
              console.error("Erreur suppression ancien logo :", e.message);
            }
          }
        }

        filteredData.media = body.media; // URL directe
        filteredData.mediaFileId = null;
        filteredData.logo = null;
        filteredData.logoFileId = null;
      }

      // === Cas 2 : Image (photo classique) ===
      else if (mediaType === "image" && (req.file || body.media)) {
        const newMedia = await resolveMedia(
          body.media,
          req.file,
          "/festn_breizh/invités",
          `${cleanName}-${Date.now()}`
        );

        if (!newMedia?.url)
          return res.status(400).json("Erreur : média image invalide.");

        // Supprime l'ancien logo s'il existe
        if (guest.logoFileId) {
          const inUse = await isFileInUse(guest.logoFileId);
          if (inUse === false) {
            try {
              await imagekit.deleteFile(guest.logoFileId);
            } catch (e) {
              console.error("Erreur suppression ancien logo :", e.message);
            }
          }
        }

        // Supprime l'ancienne image
        if (guest.mediaFileId && guest.mediaFileId !== newMedia.fileId) {
          try {
            await imagekit.deleteFile(guest.mediaFileId);
          } catch (e) {
            console.error("Erreur suppression ancienne image :", e.message);
          }
        }

        filteredData.media = newMedia.url;
        filteredData.mediaFileId = newMedia.fileId;
        filteredData.logo = null;
        filteredData.logoFileId = null;
        filteredData.mediaName = newMedia.fileName || cleanName;
      }

      // === Cas 3 : Logo ===
      else if (mediaType === "logo" && (req.file || body.media)) {
        const newLogo = await resolveMedia(
          body.media,
          req.file,
          "/festn_breizh/logos",
          `${cleanName}-logo`
        );

        if (!newLogo?.url)
          return res.status(400).json("Erreur : logo invalide.");

        // Supprime l'ancienne image
        if (guest.mediaFileId) {
          try {
            await imagekit.deleteFile(guest.mediaFileId);
          } catch (e) {
            console.error("Erreur suppression ancienne image :", e.message);
          }
        }

        // Supprime l'ancien logo si non utilisé ailleurs
        if (guest.logoFileId && guest.logoFileId !== newLogo.fileId) {
          const inUse = await isFileInUse(guest.logoFileId);
          if (inUse === false) {
            try {
              await imagekit.deleteFile(guest.logoFileId);
            } catch (e) {
              console.error("Erreur suppression ancien logo :", e.message);
            }
          }
        }

        filteredData.logo = newLogo.url;
        filteredData.logoFileId = newLogo.fileId;
        filteredData.media = null;
        filteredData.mediaFileId = null;
        filteredData.mediaName = newLogo.fileName || cleanName;
      }

      // === Cas invalide ===
      else {
        return res
          .status(400)
          .json("Le champ 'mediaType' doit être 'image', 'logo' ou 'video'.");
      }
    }

    // --- 4️⃣ Mise à jour du nom du fichier seul ---
    if (!req.file && !body.media && req.body.fileName) {
      filteredData.mediaName = req.body.fileName
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
    }

    // --- 5️⃣ Sauvegarde finale ---
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
