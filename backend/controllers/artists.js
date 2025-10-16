import Artist from "../models/Artists.js";
import imagekit from "../config/imageKit.js";
import { resolveMedia } from "../utils/resolveMedia.js";
import { isFileInUse } from "../utils/isFileInUse.js";

const isFileId = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);
const toSlug = (s) =>
  (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;

// === Créer un nouvel artiste ===
export const newArtist = async (req, res) => {
  try {
    const body = JSON.parse(req.body.artist || "{}");
    const mediaType = (body.mediaType || "").toLowerCase(); // "image" | "logo" | "video"
    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(body.name);

    // Cas vidéo (URL uniquement)
    if (mediaType === "video") {
      const doc = new Artist({
        name: body.name,
        description: body.description,
        media: body.media || null,
        mediaFileId: null,
        logo: null,
        logoFileId: null,
        mediaName: baseName,
      });
      await doc.save();
      return res
        .status(201)
        .json({ message: "Artiste (vidéo) ajouté avec succès !" });
    }

    const isLogo = mediaType === "logo";
    const folder = isLogo ? "/festn_breizh/logos" : "/festn_breizh/artistes";

    let url = null;
    let fileId = null;
    let fileName = null;

    if (isFileId(body.media)) {
      const details = await imagekit.getFileDetails(body.media);
      url = details.url;
      fileId = details.fileId;
      fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
    } else {
      const up = await resolveMedia(body.media, req.file, folder, baseName);
      if (!up?.url) return res.status(400).json("Média invalide");
      url = up.url;
      fileId = up.fileId || null;
      fileName = up.fileName || baseName;
    }

    const doc = new Artist({
      name: body.name,
      description: body.description,
      media: isLogo ? null : url,
      mediaFileId: isLogo ? null : fileId,
      logo: isLogo ? url : null,
      logoFileId: isLogo ? fileId : null,
      mediaName: fileName,
    });

    await doc.save();
    res.status(201).json({ message: "Artiste ajouté avec succès !" });
  } catch (error) {
    console.error("newArtist error:", error);
    res.status(500).json({ error: error.message });
  }
};

// === Récupérer tous les artistes ===
export const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find();
    res.status(200).json(artists);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === Récupérer un artiste ===
export const getOneArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");
    res.status(200).json(artist);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === Modifier un artiste (définitif) ===
export const updateArtist = async (req, res) => {
  try {
    const existing = await Artist.findById(req.params.id);
    if (!existing) return res.status(404).json("Artiste non trouvé");

    const body = req.body.artist ? JSON.parse(req.body.artist) : req.body;

    // 1) Champs textuels (partiels)
    const filtered = {};
    for (const k of ["name", "description"]) {
      if (body[k] !== undefined && body[k] !== "") filtered[k] = body[k];
    }

    const toSlug = (s) =>
      (s || "").trim().replace(/\s+/g, "-").toLowerCase() || `${Date.now()}`;
    const baseName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      toSlug(filtered.name || existing.name);

    const isFileId = (v) =>
      typeof v === "string" && /^[a-zA-Z0-9_-]{8,}$/.test(v);

    const mediaType = (body.mediaType || "").toLowerCase(); // "image" | "logo" | "video" | ""
    const sentNewMedia = !!req.file || !!body.media || mediaType === "video";

    // on mémorise pour cleanup post-update
    const oldImageId = existing.mediaFileId || null;
    const oldLogoId = existing.logoFileId || null;

    let newImageId = null;
    let newLogoId = null;

    // 2) Préparer la MAJ média (ne rien supprimer avant la réussite DB)
    if (sentNewMedia) {
      if (mediaType === "video") {
        // Vidéo = URL; on vide les fichiers image/logo
        filtered.media = body.media || existing.media;
        filtered.mediaFileId = null;
        filtered.logo = null;
        filtered.logoFileId = null;
        filtered.mediaName = baseName;
      } else {
        const isLogo = mediaType === "logo";
        const folder = isLogo
          ? "/festn_breizh/logos"
          : "/festn_breizh/artistes";

        // accepter:
        //  - body.media = "FILEID"
        //  - body.media = { fileId: "FILEID" }
        const providedId =
          (body.media && typeof body.media === "object" && body.media.fileId) ||
          (typeof body.media === "string" ? body.media : null);

        let url = null;
        let fileId = null;
        let fileName = null;

        if (providedId && isFileId(providedId)) {
          // réutilisation d’un fichier existant (surtout logos)
          const details = await imagekit.getFileDetails(providedId);
          url = details.url;
          fileId = details.fileId;
          fileName = details.name?.replace(/\.[^/.]+$/, "") || baseName;
        } else {
          // upload ou URL http(s)
          const up = await resolveMedia(
            body.media,
            req.file,
            folder,
            `${baseName}-${Date.now()}`
          );
          if (!up?.url)
            return res.status(400).json("Média invalide ou introuvable");
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
    } else if (req.body.fileName) {
      // simple MAJ du nom logique (pas de rename ImageKit)
      filtered.mediaName = baseName;
    }

    // 3) Écriture DB (puisqu’on autorise MAJ partielles → runValidators:false)
    const updated = await Artist.findByIdAndUpdate(req.params.id, filtered, {
      new: true,
      runValidators: false,
    });

    // 4) Nettoyage après succès DB
    if (sentNewMedia) {
      // -> passage vers vidéo : on supprime image et logo (logo conditionnel)
      if (mediaType === "video") {
        if (oldImageId) {
          try {
            await imagekit.deleteFile(oldImageId);
          } catch (e) {
            console.error(
              "Suppression ancienne image échouée :",
              e?.message || e
            );
          }
        }
        if (oldLogoId) {
          const inUse = await isFileInUse(oldLogoId);
          if (inUse === false) {
            try {
              await imagekit.deleteFile(oldLogoId);
            } catch (e) {
              console.error(
                "Suppression ancien logo échouée :",
                e?.message || e
              );
            }
          }
        }
      }

      // -> passage vers logo : on supprime l’ancienne image (images non réutilisées)
      if (mediaType === "logo" && oldImageId) {
        try {
          await imagekit.deleteFile(oldImageId);
        } catch (e) {
          console.error(
            "Suppression ancienne image échouée :",
            e?.message || e
          );
        }
      }

      // -> passage vers image : on supprime l’ancien logo s’il est inutilisé
      if (mediaType === "image" && oldLogoId) {
        const inUse = await isFileInUse(oldLogoId);
        if (inUse === false) {
          try {
            await imagekit.deleteFile(oldLogoId);
          } catch (e) {
            console.error("Suppression ancien logo échouée :", e?.message || e);
          }
        }
      }

      // -> logo -> logo (fileId différent) : suppression conditionnelle de l’ancien logo
      if (
        mediaType === "logo" &&
        oldLogoId &&
        updated.logoFileId &&
        oldLogoId !== updated.logoFileId
      ) {
        const inUse = await isFileInUse(oldLogoId);
        if (inUse === false) {
          try {
            await imagekit.deleteFile(oldLogoId);
          } catch (e) {
            console.error("Suppression ancien logo échouée :", e?.message || e);
          }
        }
      }

      // -> image -> image : supprimer l’ancienne image si le fileId a changé
      if (
        mediaType === "image" &&
        oldImageId &&
        newImageId &&
        oldImageId !== newImageId
      ) {
        try {
          await imagekit.deleteFile(oldImageId);
        } catch (e) {
          console.error(
            "Suppression ancienne image échouée :",
            e?.message || e
          );
        }
      }
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("updateArtist error:", error);
    res.status(500).json({ error: error.message });
  }
};

// === Supprimer un artiste ===
export const deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json("Artiste non trouvé");

    const imgId = artist.mediaFileId || null;
    const logoId = artist.logoFileId || null;

    await Artist.findByIdAndDelete(req.params.id);

    if (imgId) {
      try {
        await imagekit.deleteFile(imgId);
      } catch (e) {
        console.error("Suppression image échouée :", e?.message || e);
      }
    }

    if (logoId) {
      const inUse = await isFileInUse(logoId);
      if (inUse === false) {
        try {
          await imagekit.deleteFile(logoId);
        } catch (e) {
          console.error("Suppression logo échouée :", e?.message || e);
        }
      }
    }

    res.status(200).json("Artiste supprimé avec succès");
  } catch (error) {
    console.error("deleteArtist error:", error);
    res.status(500).json({ error: "Erreur serveur (deleteArtist)" });
  }
};
