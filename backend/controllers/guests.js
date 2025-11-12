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
  // === LOGS DE DEBUG (temporaires) ===
  console.log("🧩 [DEBUG] Entrée dans updateGuest()");
  console.log("🧩 [DEBUG] req.params =", req.params);
  console.log("🧩 [DEBUG] req.body keys =", Object.keys(req.body));
  console.log("🧩 [DEBUG] req.file présent ?", !!req.file, "| field:", req.file?.fieldname);

  try {
    // --- Récupération de l’invité ---
    const guestId = req.params.guestId || req.params.id;
    console.log("🧩 [DEBUG] guestId détecté:", guestId);

    const existing = await Guest.findById(guestId);
    console.log(
      "🧩 [DEBUG] Invité trouvé ?",
      !!existing,
      existing ? existing.name : "❌ non trouvé"
    );
    if (!existing) {
      if (!silent && res) return res.status(404).json("Invité non trouvé");
      throw new Error("Invité non trouvé");
    }

    // --- Lecture du body ---
    console.log("🧩 [DEBUG] Corps brut reçu:", req.body);
    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    console.log("🧩 [DEBUG] Body parsé:", body);

    if (!body.media && req.body.media) body.media = req.body.media;
    if (!body.mediaType && req.body.mediaType) body.mediaType = req.body.mediaType;

    console.log("🧩 [DEBUG] body.mediaType =", body.mediaType, "| body.media =", !!body.media);

    // --- Filtrage des champs texte ---
    const filtered = {};
    for (const k of ["name", "description"]) {
      if (body[k] !== undefined && body[k] !== "") filtered[k] = body[k];
    }
    console.log("🧩 [DEBUG] Champs filtrés initiaux:", filtered);

    // --- Préparation du nom de base ---
    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(filtered.name || existing.name);
    console.log("🧩 [DEBUG] baseName calculé:", baseName);

    // --- Détermination du type de média ---
    const mediaType = (body.mediaType || "").toLowerCase();
    const sentNewMedia = !!req.file || !!body.media || mediaType === "video";
    console.log("🧩 [DEBUG] sentNewMedia =", sentNewMedia, "| mediaType =", mediaType);

    // --- Anciennes références ---
    const oldImageId = existing.mediaFileId || null;
    const oldLogoId = existing.logoFileId || null;
    console.log("🧩 [DEBUG] Ancien média:", { oldImageId, oldLogoId });

    let newImageId = null;
    let newLogoId = null;

    // === TRAITEMENT DU NOUVEAU MÉDIA ===
    if (sentNewMedia) {
      console.log("🧩 [DEBUG] => Nouveau média détecté, traitement...");

      if (mediaType === "video") {
        console.log("🧩 [DEBUG] Type vidéo, aucun upload ImageKit effectué");
        filtered.media = body.media || existing.media;
        filtered.mediaFileId = null;
        filtered.logo = null;
        filtered.logoFileId = null;
        filtered.mediaName = baseName;
      } else {
        const isLogo = mediaType === "logo";
        const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/invités";
        console.log("🧩 [DEBUG] Type:", isLogo ? "logo" : "image", "| dossier:", folder);

        let url = null;
        let fileId = null;
        let fileName = null;

        if (isFileId(body.media)) {
          console.log("🧩 [DEBUG] body.media est un fileId, récupération depuis ImageKit");
          const details = await imagekit.getFileDetails(body.media);
          url = details.url;
          fileId = details.fileId;
          fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
        } else {
          console.log("🧩 [DEBUG] Upload ou buffer détecté, appel resolveMedia()");
          const up = await resolveMedia(body.media, req.file, folder, `${baseName}-${Date.now()}`);
          console.log("✅ [DEBUG] Résultat resolveMedia:", up);

          if (!up?.url) {
            console.error("❌ [DEBUG] Erreur : resolveMedia n’a pas retourné d’URL");
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

    // === SUPPRESSION ANCIENS MÉDIAS (test temporaire) ===
    if (sentNewMedia) {
      console.log("🧩 [DEBUG] Vérification des anciens médias à supprimer...");
      const deleteTasks = [];

      // TEST TEMPORAIRE : suppression sécurisée avec await pour éviter blocage Postman
      if (mediaType === "image" && oldImageId && oldImageId !== newImageId) {
        try {
          await imagekit.deleteFile(oldImageId);
          console.log("✅ Ancienne image supprimée");
        } catch (err) {
          console.warn("⚠️ Échec suppression ancienne image:", err.message);
        }
      }

      if (mediaType === "logo" && oldLogoId && oldLogoId !== newLogoId) {
        deleteTasks.push(
          isFileInUse(oldLogoId)
            .then((used) => {
              if (!used) {
                console.log("🧩 Ancien logo inutilisé, suppression...");
                return imagekit.deleteFile(oldLogoId);
              }
            })
            .catch((err) => console.warn("⚠️ Vérification ancien logo échouée:", err.message))
        );
      }

      await Promise.allSettled(deleteTasks);
    }

    // === MISE À JOUR MONGODB ===
    console.log("📄 [DEBUG] filtered juste avant update:", filtered);
    const updated = await Guest.findByIdAndUpdate(guestId, filtered, {
      new: true,
      runValidators: false,
    });
    console.log("✅ [DEBUG] Invité mis à jour en base:", updated);

    // === RÉPONSE (test Postman) ===
    console.log("🚦 [TRACE] Avant envoi réponse, typeof res:", typeof res);
    console.log("🚦 [TRACE] res.headersSent =", res.headersSent);

    if (!silent && res) {
      console.log("📤 [DEBUG] Envoi réponse JSON à Postman...");
      return res.status(200).json(updated);
    }
    if (req.file && req.file.stream && !req.file.stream.destroyed) {
      console.log("⚙️ [DEBUG] Destruction du flux Multer avant réponse");
      req.file.stream.destroy(); // TEMPORAIRE : libère le flux
    }

    // TEMPORAIRE : traçage post-réponse
    console.log("✅ [TRACE] res.json() envoyé");
    setTimeout(() => console.log("⏱️ [TRACE] 2s après réponse (process toujours actif)"), 2000);

    return updated;
  } catch (error) {
    console.error("❌ [DEBUG] updateGuest error:", error);
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
