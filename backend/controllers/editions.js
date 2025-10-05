import Edition from "../models/Editions.js";
import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";
import imagekit from "../config/imageKit.js";
import { isFileInUse } from "../utils/isFileInUse.js";
import { resolveMedia } from "../utils/resolveMedia.js";

// === CRÉER UNE NOUVELLE ÉDITION ===
export const createEdition = async (req, res) => {
  try {
    const editionData = JSON.parse(req.body.edition);

    if (!editionData.artists?.length)
      return res
        .status(400)
        .json("Une édition doit contenir au moins un artiste.");

    if (!editionData.poster)
      return res
        .status(400)
        .json("Une affiche est obligatoire pour créer une édition.");

    const poster = editionData.poster;
    const artistIds = [];

    // --- Artistes ---
    for (let i = 0; i < editionData.artists.length; i++) {
      const artist = editionData.artists[i];
      let mediaUrl = artist.media || null;
      let mediaFileId = null;

      if (artist.mediaType === "image" && req.files?.artistFiles?.[i]) {
        const file = req.files.artistFiles[i];
        const uploaded = await resolveMedia(
          null,
          file,
          "festn_breizh/artistes",
          artist.name
        );
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

    // --- Invités ---
    const guestIds = [];
    for (let i = 0; i < (editionData.guests || []).length; i++) {
      const guest = editionData.guests[i];
      let mediaUrl = guest.media || null;
      let mediaFileId = null;

      if (guest.mediaType === "image" && req.files?.guestFiles?.[i]) {
        const file = req.files.guestFiles[i];
        const uploaded = await resolveMedia(
          null,
          file,
          "festn_breizh/logos",
          guest.name
        );
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

// === TOUTES LES ÉDITIONS ===
export const getAllEditions = async (req, res) => {
  try {
    const editions = await Edition.find()
      .populate("artists")
      .populate("guests");
    res.status(200).json(editions);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === UNE ÉDITION ===
export const getOneEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id)
      .populate("artists")
      .populate("guests");
    if (!edition) return res.status(404).json("Édition non trouvée");
    res.status(200).json(edition);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === MODIFIER UNE ÉDITION ===
export const updateEdition = async (req, res) => {
  try {
    const editionData = req.body.edition
      ? JSON.parse(req.body.edition)
      : req.body;
    const existingEdition = await Edition.findById(req.params.id);
    if (!existingEdition) return res.status(404).json("Édition non trouvée");

    if (!editionData.artists?.length && !existingEdition.artists?.length)
      return res
        .status(400)
        .json("Une édition doit contenir au moins un artiste.");

    const updatedArtistIds = [];
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

        if (artist.mediaType === "image" && req.files?.artistFiles?.[i]) {
          const file = req.files.artistFiles[i];
          const uploaded = await resolveMedia(
            null,
            file,
            "festn_breizh/artistes",
            artist.name
          );
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

        if (guest.mediaType === "image" && req.files?.guestFiles?.[i]) {
          const file = req.files.guestFiles[i];
          const uploaded = await resolveMedia(
            null,
            file,
            "festn_breizh/logos",
            guest.name
          );
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

// === SUPPRIMER UNE ÉDITION ===
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
        const artist = await Artist.findByIdAndDelete(artistId);
        if (artist?.mediaFileId && !(await isFileInUse(artist.mediaFileId)))
          await imagekit.deleteFile(artist.mediaFileId);
      }
    }

    for (const guestId of guestIds) {
      const stillUsed = await Edition.findOne({ guests: guestId });
      if (!stillUsed) {
        const guest = await Guest.findByIdAndDelete(guestId);
        if (guest?.mediaFileId && !(await isFileInUse(guest.mediaFileId)))
          await imagekit.deleteFile(guest.mediaFileId);
      }
    }

    res.status(200).json("Édition supprimée avec nettoyage");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
