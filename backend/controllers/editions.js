import Edition from "../models/Editions.js";
import * as artistsCtrl from "./artists.js";
import * as guestsCtrl from "./guests.js";
import mongoose from "mongoose";
import Guest from "../models/Guests.js";
import Artist from "../models/Artists.js";

// Forcer l’enregistrement si Mongoose n’a pas encore les modèles
if (!mongoose.models.Guest) mongoose.model("Guest", Guest.schema);
if (!mongoose.models.Artist) mongoose.model("Artist", Artist.schema);

// === CRÉER UNE NOUVELLE ÉDITION ===
export const createEdition = async (req, res) => {
  try {
    const editionData = JSON.parse(req.body.edition);
    if (!editionData.title || !editionData.poster)
      return res.status(400).json({ error: "Titre et affiche requis." });

    const duplicate = await Edition.findOne({
      title: editionData.title,
       year: editionData.year
});

if (duplicate) {
  return res.status(400).json({
    error: "Une édition avec ce titre existe déjà"
  });
}

    // --- ARTISTES ---
    const artistDocs = [];
    const uploadedArtistFiles = req.files?.artistFiles || [];
    let fileCursor = 0;

    uploadedArtistFiles.forEach((f, i) => console.log(`artistFiles[${i}] →`, f.originalname));

    for (const [index, artistData] of (editionData.artists || []).entries()) {
      const needsFile = artistData.mediaType !== "video" && !artistData.mediaFileId;
      const mediaFile = needsFile ? uploadedArtistFiles[fileCursor++] || null : null;

      const newArtist = await artistsCtrl.createArtist(
        { body: { artist: JSON.stringify(artistData) }, file: mediaFile },
        null,
        true
      );

      if (newArtist?._id) artistDocs.push(newArtist);
    }

    // --- INVITÉS ---
    const guestDocs = [];
    const uploadedGuestFiles = req.files?.guestFiles || [];
    fileCursor = 0;

    uploadedGuestFiles.forEach((f, i) => console.log(`guestFiles[${i}] →`, f.originalname));

    for (const [index, guestData] of (editionData.guests || []).entries()) {
      const needsFile = guestData.mediaType !== "video" && !guestData.mediaFileId;
      const mediaFile = needsFile ? uploadedGuestFiles[fileCursor++] || null : null;

      const newGuest = await guestsCtrl.createGuest(
        { body: { guest: JSON.stringify(guestData) }, file: mediaFile },
        null,
        true
      );

      if (newGuest?._id) guestDocs.push(newGuest);
    }

    // --- CRÉATION DE L'ÉDITION ---
    const newEdition = new Edition({
      title: editionData.title,
      year: editionData.year,
      description: editionData.description,
      poster: editionData.poster,
      artists: artistDocs,
      guests: guestDocs,
    });

    await newEdition.save();
    res.status(201).json({
      message: "Édition créée avec succès",
      edition: newEdition,
    });
  } catch (error) {
    // res.status(500).json({ error: "Erreur serveur (createEdition)" });
    console.error("Erreur createEdition :", error);
res.status(500).json({ error: error.message });
  }
};

// === LIRE TOUTES LES ÉDITIONS ===
export const getAllEditions = async (req, res) => {
  try {
    const editions = await Edition.find().populate("artists").populate("guests");
    res.status(200).json(editions);
  } catch (error) {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === LIRE UNE ÉDITION ===
export const getOneEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id).populate("artists").populate("guests");
    if (!edition) return res.status(404).json("Édition non trouvée");
    res.status(200).json(edition);
  } catch {
    res.status(500).json("Erreur serveur, base de données inaccessible");
  }
};

// === AJOUTER UN ARTISTE À UNE ÉDITION ===
export const addArtistToEdition = async (req, res) => {
  try {
    const { editionId } = req.params;

    const edition = await Edition.findById(editionId);
    if (!edition) return res.status(404).json("Édition non trouvée");

    // Récupération et parsing du body (gestion Postman)
    const artistData =
      typeof req.body.artist === "string"
        ? JSON.parse(req.body.artist)
        : req.body.artist || req.body;

    // Récupération du fichier média
    const file = req.file || (req.files?.media ? req.files.media[0] : null);

    // Construction d'une requête factice pour createGuest()
    const fakeReq = {
      params: {},
      body: { artist: JSON.stringify(artistData) },
      file,
    };

    // Création de l'artiste
    const createdArtist = await artistsCtrl.createArtist(fakeReq, null, true);
    if (!createdArtist?._id) {
      return res.status(400).json({ message: "Échec de la création de l’artiste" });
    }

    // Ajout à l’édition
    edition.artists.push(createdArtist._id);
    await edition.save();

    res.status(201).json({
      message: "Artiste ajouté avec succès",
      artist: createdArtist,
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (addArtistToEdition)" });
  }
};
// === AJOUTER UN INVITÉ À UNE ÉDITION ===
export const addGuestToEdition = async (req, res) => {
  try {
    const { editionId } = req.params

    const edition = await Edition.findById(editionId)
    if (!edition) return res.status(404).json("Édition non trouvée")

    const guestData =
      typeof req.body.guest === "string"
        ? JSON.parse(req.body.guest)
        : req.body.guest || req.body

    const file = req.file || (req.files?.media ? req.files.media[0] : null)

    const fakeReq = {
      params: {},
      body: { guest: JSON.stringify(guestData) },
      file,
    }

    const createdGuest = await guestsCtrl.createGuest(fakeReq, null, true)

    if (!createdGuest?._id) {
      return res.status(400).json({ message: "Échec de la création de l’invité" })
    }

    edition.guests.push(createdGuest._id)
    await edition.save()

    res.status(201).json({
      message: "Invité ajouté avec succès",
      guest: createdGuest,
    })
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (addGuestToEdition)" })
  }
};

// === METTRE À JOUR UNE ÉDITION ===
export const updateEdition = async (req, res) => {
  const { editionId, guestId } = req.params;


  if (guestId) {
    const fakeReq = {
      params: { id: guestId },
      body: req.body,
      file: req.file,
    };

    return await guestsCtrl.updateGuest(fakeReq, res, false);
  }

  try {
    const guestFileIds = JSON.parse(req.body.guestFileIds || '[]')
    const artistFileIds = JSON.parse(req.body.artistFileIds || '[]')
    const editionData = req.body.edition ? JSON.parse(req.body.edition) : req.body;

    const existingEdition = await Edition.findById(req.params.editionId || req.params.id);
    if (!existingEdition) return res.status(404).json({ error: "Édition non trouvée" });

    // Vérifier doublon seulement si le titre est modifié
if (
  (editionData.title && editionData.title !== existingEdition.title) ||
  (editionData.year && editionData.year !== existingEdition.year)
) {
  const duplicate = await Edition.findOne({
    title: editionData.title ?? existingEdition.title,
    year: editionData.year ?? existingEdition.year,
    _id: { $ne: existingEdition._id }
  });

  if (duplicate) {
    return res.status(400).json({
      error: "Une édition avec ce titre et cette année existe déjà"
    });
  }
}
    

    const updatedArtists = [];
    const updatedGuests = [];

    // === ARTISTES ===
    for (const [index, artist] of (editionData.artists || []).entries()) {
      if (!artist._id) continue;

     const fileIndex = artistFileIds.indexOf(artist._id)

     const file =
      fileIndex !== -1
      ? req.files?.artistFiles?.[fileIndex]
      : null

      const fakeReq = {
        params: { id: artist._id },
        body: { artist: JSON.stringify(artist) },
        file,
      };

      const updated = await artistsCtrl.updateArtist(fakeReq, null, true);

      if (updated?._id) updatedArtists.push(updated._id);
    }

    // === INVITÉS ===
    for (const [index, guest] of (editionData.guests || []).entries()) {
      if (!guest._id) continue;

      const fileIndex = guestFileIds.indexOf(guest._id)

      const file =
        fileIndex !== -1
         ? req.files?.guestFiles?.[fileIndex]
          : null
      
      const fakeReq = {
        params: { id: guest._id },
        body: { guest: JSON.stringify(guest), mediaType: guest.mediaType },
        file,
      };
 
      
      const updated = await guestsCtrl.updateGuest(fakeReq, null, true);

      if (updated?._id) updatedGuests.push(updated._id);
    }

    existingEdition.title = editionData.title || existingEdition.title;
    existingEdition.description = editionData.description || existingEdition.description;
    existingEdition.poster = editionData.poster || existingEdition.poster;
    existingEdition.year = editionData.year || existingEdition.year;

    if (updatedArtists.length) existingEdition.artists = updatedArtists;
    if (updatedGuests.length) existingEdition.guests = updatedGuests;

    await existingEdition.save();

    res.status(200).json({
      message: "Édition mise à jour avec succès",
      edition: existingEdition,
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur (updateEdition)" });
  }
};

// === SUPPRIMER UNE ÉDITION ===
export const deleteEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id);
    if (!edition) return res.status(404).json("Édition non trouvée");

    const fakeRes = { status: () => ({ json: () => {} }) };

    for (const artistId of edition.artists || []) {
      const fakeReq = { params: { id: artistId } };
      await artistsCtrl.deleteArtist(fakeReq, fakeRes, true);
    }

    for (const guestId of edition.guests || []) {
      const fakeReq = { params: { id: guestId } };
      await guestsCtrl.deleteGuest(fakeReq, fakeRes, true);
    }

    await Edition.findByIdAndDelete(req.params.id);
    res.status(200).json("Édition supprimée avec succès");
  } catch (error) {
    res.status(500).json({ error: error.message || "Erreur serveur (deleteEdition)" });
  }
};
