import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);
const toSlug = (s) => (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// === CRÉER UN INVITÉ ===
export const createGuest = async (req, res, silent = false) => {
  try {
    const body = JSON.parse(req.body.guest || "{}");
    const mediaType = (body.mediaType || "").toLowerCase();
    const isLogo = mediaType === "logo";

    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(body.name);

    // === CAS VIDÉO ===
    if (mediaType === "video" && body.media) {
      const doc = new Guest({
        name: body.name,
        description: body.description,
        media: body.media,
        mediaName: baseName,
        mediaType,
      });

      await doc.save();

      if (req.body.editionId) {
        const Edition = (await import("../models/Edition.js")).default;
        await Edition.findByIdAndUpdate(req.body.editionId, { $push: { guests: doc._id } });
      }

      if (silent) return doc;
      return res.status(201).json({ message: "Invité (vidéo) ajouté avec succès", guest: doc });
    }

    // === CAS LOGO EXISTANT ===
    if (isLogo && isFileId(body.media)) {
      const details = await imagekit.getFileDetails(body.media);
      const doc = new Guest({
        name: body.name,
        description: body.description,
        logo: details.url,
        logoFileId: details.fileId,
        mediaName: baseName,
        mediaType,
      });

      await doc.save();

      if (req.body.editionId) {
        const Edition = (await import("../models/Edition.js")).default;
        await Edition.findByIdAndUpdate(req.body.editionId, { $push: { guests: doc._id } });
      }

      if (silent) return doc;
      return res
        .status(201)
        .json({ message: "Invité (logo existant) ajouté avec succès", guest: doc });
    }

    // === CAS IMAGE OU NOUVEAU LOGO ===
    const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";
    const up = await resolveMedia(body.media, req.file, folder, baseName);
    if (!up?.url) throw new Error("Échec de l’upload du média");

    const doc = new Guest({
      name: body.name,
      description: body.description,
      media: !isLogo ? up.url : null,
      mediaFileId: !isLogo ? up.fileId : null,
      logo: isLogo ? up.url : null,
      logoFileId: isLogo ? up.fileId : null,
      mediaName: up.fileName || baseName,
      mediaType,
    });

    await doc.save();

    if (req.body.editionId) {
      const Edition = (await import("../models/Edition.js")).default;
      await Edition.findByIdAndUpdate(req.body.editionId, { $push: { guests: doc._id } });
    }

    if (silent) return doc;
    return res.status(201).json({ message: "Invité ajouté avec succès", guest: doc });
  } catch (error) {
    console.error("createGuest error:", error);
    if (!silent && res) res.status(500).json({ error: error.message });
  }
};

// === RÉCUPÉRER TOUS LES INVITÉS ===
export const getAllGuests = async (req, res) => {
  try {
    const guests = await Guest.find();
    res.status(200).json(guests);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === RÉCUPÉRER UN INVITÉ ===
export const getOneGuest = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json("Invité non trouvé");
    res.status(200).json(guest);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === MODIFIER UN INVITÉ ===
export const updateGuest = async (req, res, silent = false) => {
  console.log("🧩 [DEBUG] Entrée dans updateGuest()"); // à supprimer
  console.log("🧩 [DEBUG] req.params =", req.params); // à supprimer
  console.log("🧩 [DEBUG] req.body keys =", Object.keys(req.body)); // à supprimer
  console.log("🧩 [DEBUG] req.file présent ?", !!req.file, "| field:", req.file?.fieldname); // à supprimer

  try {
    const guestId = req.params.guestId || req.params.id;
    console.log("🧩 [DEBUG] guestId détecté:", guestId); // à supprimer

    const existing = await Guest.findById(guestId);
    console.log(
      "🧩 [DEBUG] Invité trouvé ?",
      !!existing,
      existing ? existing.name : "❌ non trouvé"
    ); // à supprimer
    if (!existing) {
      if (!silent && res) return res.status(404).json("Invité non trouvé");
      throw new Error("Invité non trouvé");
    }

    console.log("🧩 [DEBUG] Corps brut reçu:", req.body); // à supprimer
    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    console.log("🧩 [DEBUG] Body parsé:", body); // à supprimer

    if (!body.media && req.body.media) body.media = req.body.media;
    if (!body.mediaType && req.body.mediaType) body.mediaType = req.body.mediaType;

    console.log("🧩 [DEBUG] body.mediaType =", body.mediaType, "| body.media =", !!body.media); // à supprimer

    const filtered = {};
    for (const k of ["name", "description"]) {
      if (body[k] !== undefined && body[k] !== "") filtered[k] = body[k];
    }

    console.log("🧩 [DEBUG] Champs filtrés initiaux:", filtered); // à supprimer

    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(filtered.name || existing.name);

    console.log("🧩 [DEBUG] baseName calculé:", baseName); // à supprimer

    const mediaType = (body.mediaType || "").toLowerCase();
    const sentNewMedia = !!req.file || !!body.media || mediaType === "video";
    console.log("🧩 [DEBUG] sentNewMedia =", sentNewMedia, "| mediaType =", mediaType); // à supprimer

    const oldImageId = existing.mediaFileId || null;
    const oldLogoId = existing.logoFileId || null;
    console.log("🧩 [DEBUG] Ancien média:", { oldImageId, oldLogoId }); // à supprimer

    let newImageId = null;
    let newLogoId = null;
    if (sentNewMedia) {
      console.log("🧩 [DEBUG] => Nouveau média détecté, traitement..."); // à supprimer
      if (mediaType === "video") {
        console.log("🧩 [DEBUG] Type vidéo, aucun upload ImageKit effectué"); // à supprimer
        filtered.media = body.media || existing.media;
        filtered.mediaFileId = null;
        filtered.logo = null;
        filtered.logoFileId = null;
        filtered.mediaName = baseName;
      } else {
        const isLogo = mediaType === "logo";
        const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";
        console.log("🧩 [DEBUG] Type:", isLogo ? "logo" : "image", "| dossier:", folder); // à supprimer

        let url = null;
        let fileId = null;
        let fileName = null;

        if (isFileId(body.media)) {
          console.log("🧩 [DEBUG] body.media est un fileId, récupération depuis ImageKit"); // à supprimer
          const details = await imagekit.getFileDetails(body.media);
          url = details.url;
          fileId = details.fileId;
          fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
        } else {
          console.log("🧩 [DEBUG] Upload ou buffer détecté, appel resolveMedia()"); // à supprimer
          const up = await resolveMedia(body.media, req.file, folder, `${baseName}-${Date.now()}`);
          console.log("✅ [DEBUG] Résultat resolveMedia:", up); // à supprimer

          if (!up?.url) {
            console.error("❌ [DEBUG] Erreur : resolveMedia n’a pas retourné d’URL"); // à supprimer
            return res.status(400).json("Média invalide ou introuvable");
          }

          url = up.url;
          fileId = up.fileId || null;
          fileName = up.fileName || baseName;
        }

        if (isLogo) {
          filtered.logo = url;
          filtered.logoFileId = fileId;
          filtered.media = null;
          filtered.mediaFileId = null;
          newLogoId = fileId;
        } else {
          filtered.media = url;
          filtered.mediaFileId = fileId;
          filtered.logo = null;
          filtered.logoFileId = null;
          newImageId = fileId;
        }

        filtered.mediaName = fileName;
      }
    }

    // --- nettoyage ancien média ---
    if (sentNewMedia) {
      console.log("🧩 [DEBUG] Vérification des anciens médias à supprimer..."); // à supprimer

      if (mediaType === "image" && oldImageId && oldImageId !== newImageId) {
        console.log("🧩 [DEBUG] Suppression ancienne image", oldImageId); // à supprimer
        imagekit
          .deleteFile(oldImageId)
          .then(() => console.log("✅ [DEBUG] Ancienne image supprimée")) // à supprimer
          .catch((err) => console.warn("⚠️ [DEBUG] Échec suppression ancienne image", err.message)); // à supprimer
      }

      if (mediaType === "video" && oldImageId) {
        console.log("🧩 [DEBUG] Suppression ancienne image vidéo", oldImageId); // à supprimer
        imagekit
          .deleteFile(oldImageId)
          .catch((err) =>
            console.warn("⚠️ [DEBUG] Échec suppression ancienne image vidéo", err.message)
          ); // à supprimer
      }

      if (mediaType === "logo" && oldImageId) {
        console.log("🧩 [DEBUG] Suppression ancienne image liée au logo", oldImageId); // à supprimer
        imagekit
          .deleteFile(oldImageId)
          .catch((err) =>
            console.warn("⚠️ [DEBUG] Échec suppression image liée au logo", err.message)
          ); // à supprimer
      }

      if (mediaType === "image" && oldLogoId) {
        console.log("🧩 [DEBUG] Vérification ancien logo inutilisé", oldLogoId); // à supprimer
        isFileInUse(oldLogoId)
          .then((used) => {
            if (!used) {
              console.log("🧩 [DEBUG] Ancien logo inutilisé, suppression"); // à supprimer
              return imagekit.deleteFile(oldLogoId);
            }
          })
          .catch((err) => console.warn("⚠️ [DEBUG] Vérification ancien logo échouée", err.message)); // à supprimer
      }

      if (mediaType === "logo" && oldLogoId && newLogoId && oldLogoId !== newLogoId) {
        console.log("🧩 [DEBUG] Ancien logo différent du nouveau, suppression sécurisée"); // à supprimer
        isFileInUse(oldLogoId)
          .then((used) => {
            if (!used) {
              console.log("🧩 [DEBUG] Suppression ancien logo", oldLogoId); // à supprimer
              return imagekit.deleteFile(oldLogoId);
            }
          })
          .catch((err) => console.warn("⚠️ [DEBUG] Suppression ancien logo échouée", err.message)); // à supprimer
      }
    }

    // --- mise à jour réelle dans MongoDB ---
    console.log("📄 [DEBUG] filtered juste avant update:", filtered); // à supprimer
    const updated = await Guest.findByIdAndUpdate(guestId, filtered, {
      new: true,
      runValidators: false,
    });
    console.log("✅ [DEBUG] Invité mis à jour en base:", updated); // à supprimer

    if (silent) return updated;
    if (res && !silent) {
      console.log("🧩 [DEBUG] Taille JSON envoyée:", JSON.stringify(updated).length, "octets"); // à supprimer
      return res.status(200).json(updated);
    }
  } catch (error) {
    console.error("❌ [DEBUG] updateGuest error:", error); // à supprimer
    if (!silent && res) {
      return res.status(500).json({ error: error.message || "Erreur inconnue dans updateGuest" });
    }
  }
};

// === SUPPRIMER UN INVITÉ ===
export const deleteGuest = async (req, res) => {
  try {
    const guestId = req.params.guestId || req.params.id;
    const guest = await Guest.findById(guestId);
    if (!guest) return res.status(404).json("Invité non trouvé");

    const imgId = guest.mediaFileId || null;
    const logoId = guest.logoFileId || null;

    await Guest.findByIdAndDelete(guestId);

    if (imgId) {
      try {
        await imagekit.deleteFile(imgId);
      } catch {}
    }

    if (logoId && (await isFileInUse(logoId)) === false) {
      try {
        await imagekit.deleteFile(logoId);
      } catch {}
    }

    res.status(200).json("Invité supprimé avec succès");
  } catch (error) {
    console.error("deleteGuest error:", error);
    res.status(500).json({ error: "Erreur serveur (deleteGuest)" });
  }
};
