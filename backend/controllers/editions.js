import Edition from "../models/Editions.js";
import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { isFileInUse } from "../utils/isFileInUse.js";
import { resolveMedia } from "../utils/resolveMedia.js";

// créer une nouvelle édition //
export const createEdition = async (req, res) => {
  try {
    const editionData = JSON.parse(req.body.edition);

    if (!editionData.artists || editionData.artists.length < 1)
      return res.status(400).json("Une édition doit contenir au moins un artiste.");

    if (!editionData.poster)
      return res.status(400).json("Une affiche est obligatoire pour créer une édition.");

    const poster = editionData.poster;
    const artistIds = [];
    let artistFileIdx = 0;

    for (let i = 0; i < editionData.artists.length; i++) {
      const artist = editionData.artists[i];
      let mediaFileId = null;
      let mediaUrl = artist.media || null;

      let file = null;
      if (artist.mediaType === "image" || artist.mediaType === "logo") {
        file = req.files?.artistFiles?.[artistFileIdx] || null;
        if (file) artistFileIdx += 1;
      }

      if (file) {
        const cleanName = req.body.fileName?.trim()
          ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
          : artist.name
          ? artist.name.replace(/\s+/g, "-").toLowerCase()
          : `${Date.now()}`;

        const uploaded = await resolveMedia(null, file, "festn_breizh/artistes", cleanName);
        mediaUrl = uploaded.url;
        mediaFileId = uploaded.fileId;
      }

      const newArtist = new Artist({
        name: artist.name,
        role: artist.role,
        description: artist.description,
        media: mediaUrl,
        mediaFileId,
        link: artist.link || null,
      });
      await newArtist.save();
      artistIds.push(newArtist._id);
    }

    const guestIds = [];
    let guestFileIdx = 0;

    for (let i = 0; i < (editionData.guests || []).length; i++) {
      const guest = editionData.guests[i];
      let mediaFileId = null;
      let mediaUrl = guest.media || null;

      let file = null;
      if (guest.mediaType === "image" || guest.mediaType === "logo") {
        file = req.files?.guestFiles?.[guestFileIdx] || null;
        if (file) guestFileIdx += 1;
      }

      if (file) {
        const cleanName = req.body.fileName?.trim()
          ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
          : guest.name
          ? guest.name.replace(/\s+/g, "-").toLowerCase()
          : `${Date.now()}`;

        const folder = guest.mediaType === "logo" ? "festn_breizh/logos" : "festn_breizh/invités";

        const uploaded = await resolveMedia(null, file, folder, cleanName);
        mediaUrl = uploaded.url;
        mediaFileId = uploaded.fileId;
      }

      const newGuest = new Guest({
        name: guest.name,
        role: guest.role,
        description: guest.description,
        media: mediaUrl,
        mediaFileId,
      });
      await newGuest.save();
      guestIds.push(newGuest._id);
    }

    const newEdition = new Edition({
      title: editionData.title,
      poster,
      artists: artistIds,
      guests: guestIds,
    });

    await newEdition.save();
    res.status(201).json({ message: "Édition créée avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// trouver toutes les éditions //
export const getAllEditions = async (req, res) => {
  try {
    const editions = await Edition.find().populate("artists").populate("guests");
    res.status(200).json(editions);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// trouver une seule édition //
export const getOneEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id).populate("artists").populate("guests");
    if (!edition) return res.status(404).json("Édition non trouvée");
    res.status(200).json(edition);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// modifier une édition //
export const updateEdition = async (req, res) => {
  try {
    const editionData = req.body.edition ? JSON.parse(req.body.edition) : req.body;
    const existingEdition = await Edition.findById(req.params.id);
    if (!existingEdition) return res.status(404).json("Édition non trouvée");

    if (
      (!editionData.artists || editionData.artists.length < 1) &&
      (!existingEdition.artists || existingEdition.artists.length < 1)
    ) {
      return res.status(400).json("Une édition doit contenir au moins un artiste.");
    }

    const updatedArtistIds = [];
    let artistFileIdx = 0;

    for (let i = 0; i < (editionData.artists || []).length; i++) {
      const artist = editionData.artists[i];
      let artistDoc;

      if (artist._id) {
        artistDoc = await Artist.findByIdAndUpdate(artist._id, artist, {
          new: true,
        });
      } else {
        let mediaUrl = artist.media || null;
        let mediaFileId = null;
        let file = null;

        if (artist.mediaType === "image") {
          file = req.files?.artistFiles?.[artistFileIdx] || null;
          if (file) artistFileIdx += 1;
        }

        if (file) {
          const cleanName = req.body.fileName?.trim()
            ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
            : artist.name
            ? artist.name.replace(/\s+/g, "-").toLowerCase()
            : `${Date.now()}`;

          const uploaded = await resolveMedia(null, file, "festn_breizh/artistes", cleanName);
          mediaUrl = uploaded.url;
          mediaFileId = uploaded.fileId;
        }

        artistDoc = new Artist({
          name: artist.name,
          role: artist.role,
          description: artist.description,
          media: mediaUrl,
          mediaFileId,
          link: artist.link || null,
        });
        await artistDoc.save();
      }

      updatedArtistIds.push(artistDoc._id);
    }

    const updatedGuestIds = [];
    let guestFileIdx = 0;

    for (let i = 0; i < (editionData.guests || []).length; i++) {
      const guest = editionData.guests[i];
      let guestDoc;

      if (guest._id) {
        guestDoc = await Guest.findByIdAndUpdate(guest._id, guest, {
          new: true,
        });
      } else {
        let mediaUrl = guest.media || null;
        let mediaFileId = null;
        let file = null;

        if (guest.mediaType === "image") {
          file = req.files?.guestFiles?.[guestFileIdx] || null;
          if (file) guestFileIdx += 1;
        }

        if (file) {
          const cleanName = req.body.fileName?.trim()
            ? req.body.fileName.replace(/\s+/g, "-").toLowerCase()
            : guest.name
            ? guest.name.replace(/\s+/g, "-").toLowerCase()
            : `${Date.now()}`;

          const folder = guest.mediaType === "logo" ? "festn_breizh/logos" : "festn_breizh/invités";

          const uploaded = await resolveMedia(null, file, folder, cleanName);
          mediaUrl = uploaded.url;
          mediaFileId = uploaded.fileId;
        }

        guestDoc = new Guest({
          name: guest.name,
          role: guest.role,
          description: guest.description,
          media: mediaUrl,
          mediaFileId,
        });
        await guestDoc.save();
      }

      updatedGuestIds.push(guestDoc._id);
    }

    existingEdition.title = editionData.title || existingEdition.title;
    existingEdition.poster = editionData.poster || existingEdition.poster;
    existingEdition.artists = updatedArtistIds;
    existingEdition.guests = updatedGuestIds;

    await existingEdition.save();
    res.status(200).json(existingEdition);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// supprimer une édition //
export const deleteEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id);
    if (!edition) return res.status(404).json("Édition non trouvée");

    const artistIds = edition.artists || [];
    const guestIds = edition.guests || [];

    await Edition.findByIdAndDelete(req.params.id);

    for (const artistId of artistIds) {
      const stillUsed = await Edition.findOne({ artists: artistId });
      if (!stillUsed) {
        const artist = await Artist.findById(artistId);
        if (artist) {
          if (artist.mediaFileId) {
            const inUse = await isFileInUse(artist.mediaFileId);
            if (inUse === false) await imagekit.deleteFile(artist.mediaFileId);
          }
          if (artist.logoFileId) {
            const inUse = await isFileInUse(artist.logoFileId);
            if (inUse === false) await imagekit.deleteFile(artist.logoFileId);
          }
          await Artist.findByIdAndDelete(artistId);
        }
      }
    }

    for (const guestId of guestIds) {
      const stillUsed = await Edition.findOne({ guests: guestId });
      if (!stillUsed) {
        const guest = await Guest.findById(guestId);
        if (guest) {
          if (guest.mediaFileId) {
            const inUse = await isFileInUse(guest.mediaFileId);
            if (inUse === false) await imagekit.deleteFile(guest.mediaFileId);
          }
          await Guest.findByIdAndDelete(guestId);
        }
      }
    }

    res.status(200).json("Édition supprimée avec nettoyage");
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (deleteEdition)" });
  }
};

// === Gestion des invités d'une édition ===
export const addGuestToEdition = async (req, res) => {
  try {
    const { editionId } = req.params;
    const edition = await Edition.findById(editionId);
    if (!edition) return res.status(404).json("Édition non trouvée");

    const guestData = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      guestData.name?.replace(/\s+/g, "-").toLowerCase() ||
      `${Date.now()}`;

    // Gestion du média (image ou logo)
    let mediaResult = null;
    if (req.file || guestData.media) {
      const folder = guestData.mediaType === "logo" ? "festn_breizh/logos" : "festn_breizh/invités";

      mediaResult = await resolveMedia(guestData.media, req.file, folder, cleanName);
    }

    const newGuest = new Guest({
      name: guestData.name,
      description: guestData.description,
      media: mediaResult?.url || null,
      mediaFileId: mediaResult?.fileId || null,
      mediaName:
        req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        guestData.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
        cleanName,
    });

    await newGuest.save();

    edition.guests.push(newGuest._id);
    await edition.save();

    res.status(201).json({ message: "Invité ajouté à l'édition avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGuestInEdition = async (req, res) => {
  try {
    const { editionId, guestId } = req.params;
    const edition = await Edition.findById(editionId);
    if (!edition) return res.status(404).json("Édition non trouvée");

    const guest = await Guest.findById(guestId);
    if (!guest) return res.status(404).json("Invité non trouvé");

    const body = req.body.guest ? JSON.parse(req.body.guest) : req.body;
    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.name?.replace(/\s+/g, "-").toLowerCase() ||
      guest.name;

    if (req.file || body.media) {
      const folder = body.mediaType === "logo" ? "festn_breizh/logos" : "festn_breizh/invités";

      const newMedia = await resolveMedia(body.media, req.file, folder, cleanName);

      if (guest.mediaFileId && guest.mediaFileId !== newMedia.fileId) {
        const inUse = await isFileInUse(guest.mediaFileId);
        if (!inUse) await imagekit.deleteFile(guest.mediaFileId);
      }

      guest.media = newMedia.url;
      guest.mediaFileId = newMedia.fileId;
    }

    guest.name = body.name || guest.name;
    guest.description = body.description || guest.description;
    guest.mediaName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      guest.mediaName;

    await guest.save();

    res.status(200).json({ message: "Invité mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGuestFromEdition = async (req, res) => {
  try {
    const { editionId, guestId } = req.params;
    const edition = await Edition.findById(editionId);
    if (!edition) return res.status(404).json("Édition non trouvée");

    const guest = await Guest.findById(guestId);
    if (!guest) return res.status(404).json("Invité non trouvé");

    edition.guests = edition.guests.filter((id) => id.toString() !== guestId.toString());
    await edition.save();

    if (guest.mediaFileId) {
      const inUse = await isFileInUse(guest.mediaFileId);
      if (!inUse) await imagekit.deleteFile(guest.mediaFileId);
    }

    await Guest.findByIdAndDelete(guestId);
    res.status(200).json({ message: "Invité supprimé de l'édition" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// === Gestion des artistes d'une édition ===
export const addArtistToEdition = async (req, res) => {
  try {
    const { editionId } = req.params;
    const edition = await Edition.findById(editionId);
    if (!edition) return res.status(404).json("Édition non trouvée");

    const artistData = req.body.artist ? JSON.parse(req.body.artist) : req.body;
    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      artistData.name?.replace(/\s+/g, "-").toLowerCase() ||
      `${Date.now()}`;

    let mediaResult = null;
    if (req.file || artistData.media) {
      mediaResult = await resolveMedia(
        artistData.media,
        req.file,
        "festn_breizh/artistes",
        cleanName
      );
    }

    const newArtist = new Artist({
      name: artistData.name,
      role: artistData.role,
      description: artistData.description,
      media: mediaResult?.url || null,
      mediaFileId: mediaResult?.fileId || null,
      link: artistData.link || null,
    });

    await newArtist.save();

    edition.artists.push(newArtist._id);
    await edition.save();

    res.status(201).json({ message: "Artiste ajouté à l'édition avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateArtistInEdition = async (req, res) => {
  try {
    const { editionId, artistId } = req.params;
    const edition = await Edition.findById(editionId);
    if (!edition) return res.status(404).json("Édition non trouvée");

    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json("Artiste non trouvé");

    const body = req.body.artist ? JSON.parse(req.body.artist) : req.body;
    const cleanName =
      req.body.fileName?.trim()?.replace(/\s+/g, "-").toLowerCase() ||
      body.name?.replace(/\s+/g, "-").toLowerCase() ||
      artist.name;

    if (req.file || body.media) {
      const newMedia = await resolveMedia(body.media, req.file, "festn_breizh/artistes", cleanName);

      if (artist.mediaFileId && artist.mediaFileId !== newMedia.fileId) {
        const inUse = await isFileInUse(artist.mediaFileId);
        if (!inUse) await imagekit.deleteFile(artist.mediaFileId);
      }

      artist.media = newMedia.url;
      artist.mediaFileId = newMedia.fileId;
    }

    artist.name = body.name || artist.name;
    artist.role = body.role || artist.role;
    artist.description = body.description || artist.description;
    artist.link = body.link || artist.link;

    await artist.save();

    res.status(200).json({ message: "Artiste mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteArtistFromEdition = async (req, res) => {
  try {
    const { editionId, artistId } = req.params;
    const edition = await Edition.findById(editionId);
    if (!edition) return res.status(404).json("Édition non trouvée");

    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json("Artiste non trouvé");

    edition.artists = edition.artists.filter((id) => id.toString() !== artistId.toString());
    await edition.save();

    if (artist.mediaFileId) {
      const inUse = await isFileInUse(artist.mediaFileId);
      if (!inUse) await imagekit.deleteFile(artist.mediaFileId);
    }

    await Artist.findByIdAndDelete(artistId);
    res.status(200).json({ message: "Artiste supprimé de l'édition" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
