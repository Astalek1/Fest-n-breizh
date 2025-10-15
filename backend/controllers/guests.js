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

    // Body tolérant: JSON string ou objet
    let body = {};
    try {
      body = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    } catch {
      body = req.body || {};
    }

    // 1) Mises à jour partielles de base
    const filteredData = {};
    for (const k of ["name", "description"]) {
      if (body[k] !== undefined && body[k] !== "") filteredData[k] = body[k];
    }

    // 2) Nom "base" pour fichier si upload
    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      (filteredData.name || guest.name || `media-${Date.now()}`)
        .replace(/\s+/g, "-")
        .toLowerCase();

    // 3) Changement de média ?
    const hasNewMedia = !!req.file || body.media !== undefined;

    if (hasNewMedia) {
      const mediaType = (body.mediaType || "").toLowerCase(); // "image" | "logo"
      if (!mediaType || !["image", "logo"].includes(mediaType)) {
        return res
          .status(400)
          .json("Le champ 'mediaType' est requis (image ou logo)");
      }

      if (mediaType === "logo") {
        // --- LOGO ---
        let newLogoUrl = null;
        let newLogoFileId = null;
        let derivedName =
          req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
          `${baseName}-logo`;

        // Autoriser réutilisation par fileId
        const isFileId =
          typeof body.media === "string" &&
          /^[A-Za-z0-9]{8,}$/.test(body.media);

        if (isFileId) {
          const details = await imagekit.getFileDetails(body.media);
          newLogoUrl = details.url;
          newLogoFileId = details.fileId;
        } else {
          const uploaded = await resolveMedia(
            body.media,
            req.file,
            "/festn_breizh/logos",
            derivedName
          );
          if (!uploaded?.url) return res.status(400).json("Logo invalide");
          newLogoUrl = uploaded.url;
          newLogoFileId = uploaded.fileId;
          derivedName = uploaded.fileName || derivedName;
        }

        // On bascule sur un logo → supprimer l'ANCIENNE IMAGE si elle existait
        if (guest.mediaFileId) {
          try {
            await imagekit.deleteFile(guest.mediaFileId);
          } catch (e) {
            console.error(
              "Suppression ancienne image échouée :",
              e?.message || e
            );
          }
        }

        // Ancien logo: suppression conditionnelle si différent et inutilisé ailleurs
        if (guest.logoFileId && guest.logoFileId !== newLogoFileId) {
          const inUse = await isFileInUse(guest.logoFileId);
          if (!inUse) {
            try {
              await imagekit.deleteFile(guest.logoFileId);
            } catch (e) {
              console.error(
                "Suppression ancien logo échouée :",
                e?.message || e
              );
            }
          }
        }

        // Écritures
        filteredData.logo = newLogoUrl;
        filteredData.logoFileId = newLogoFileId;
        filteredData.media = null;
        filteredData.mediaFileId = null;
        filteredData.mediaName = derivedName;
      } else {
        // --- IMAGE ---
        const uploaded = await resolveMedia(
          body.media,
          req.file,
          "/festn_breizh/invités",
          `${baseName}-${Date.now()}`
        );
        if (!uploaded?.url) return res.status(400).json("Image invalide");

        // Remplacement image->image : suppression stricte de l'ancienne image
        if (guest.mediaFileId && guest.mediaFileId !== uploaded.fileId) {
          try {
            await imagekit.deleteFile(guest.mediaFileId);
          } catch (e) {
            console.error(
              "Suppression ancienne image échouée :",
              e?.message || e
            );
          }
        }

        // Si on revient d'un logo vers une image : suppression conditionnelle de l'ancien logo
        if (guest.logoFileId) {
          const inUse = await isFileInUse(guest.logoFileId);
          if (!inUse) {
            try {
              await imagekit.deleteFile(guest.logoFileId);
            } catch (e) {
              console.error(
                "Suppression ancien logo échouée :",
                e?.message || e
              );
            }
          }
        }

        // Écritures
        filteredData.media = uploaded.url;
        filteredData.mediaFileId = uploaded.fileId;
        filteredData.mediaName = uploaded.fileName || baseName;
        filteredData.logo = null;
        filteredData.logoFileId = null;
      }
    } else if (req.body.fileName) {
      // 4) MAJ du nom seulement (aucun upload)
      filteredData.mediaName = req.body.fileName
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
    }

    // 5) Sauvegarde
    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      filteredData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedGuest);
  } catch (error) {
    console.error("Erreur updateGuest :", error);
    res.status(500).json({ error: "Erreur serveur (updateGuest)" });
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
