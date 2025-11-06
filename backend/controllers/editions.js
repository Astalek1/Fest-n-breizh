import Edition from "../models/Editions.js";
import * as artistsCtrl from "./artists.js";
import * as guestsCtrl from "./guests.js";
import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";

// === CRÉER UNE NOUVELLE ÉDITION ===
export const createEdition = async (req, res) => {
  try {
    const editionData = JSON.parse(req.body.edition);

    if (!editionData.title) return res.status(400).json("Le titre est obligatoire.");
    if (!editionData.poster) return res.status(400).json("Une affiche est obligatoire.");
    if (!editionData.artists || editionData.artists.length < 1)
      return res.status(400).json("Une édition doit contenir au moins un artiste.");

    // === Création des artistes ===
    const artistDocs = [];
    for (const [index, artistData] of (editionData.artists || []).entries()) {
      const file = req.files?.artistFiles?.[index] || null;

      const newArtist = new Artist({
        name: artistData.name,
        role: artistData.role || null,
        description: artistData.description || null,
        media: artistData.media || null,
        mediaFileId: artistData.mediaFileId || null,
        logo: artistData.logo || null,
        logoFileId: artistData.logoFileId || null,
        mediaName: artistData.mediaName || artistData.name?.toLowerCase().replace(/\s+/g, "-"),
        link: artistData.link || null,
      });

      await newArtist.save();
      artistDocs.push(newArtist);
    }

    // === Création des invités ===
    const guestDocs = [];
    for (const [index, guestData] of (editionData.guests || []).entries()) {
      const file = req.files?.guestFiles?.[index] || null;

      const newGuest = new Guest({
        name: guestData.name,
        role: guestData.role || null,
        description: guestData.description || null,
        media: guestData.media || null,
        mediaFileId: guestData.mediaFileId || null,
        logo: guestData.logo || null,
        logoFileId: guestData.logoFileId || null,
        mediaName: guestData.mediaName || guestData.name?.toLowerCase().replace(/\s+/g, "-"),
      });

      await newGuest.save();
      guestDocs.push(newGuest);
    }

    // === Création de l'édition ===
    const newEdition = new Edition({
      title: editionData.title,
      poster: editionData.poster,
      artists: artistDocs.map((a) => a._id),
      guests: guestDocs.map((g) => g._id),
    });

    await newEdition.save();

    // === Réponse ===
    const populatedEdition = await Edition.findById(newEdition._id)
      .populate("artists")
      .populate("guests");

    res.status(201).json({
      message: "Édition créée avec succès",
      edition: populatedEdition,
    });
  } catch (error) {
    console.error("createEdition error:", error);
    res.status(500).json({ error: "Erreur serveur (createEdition)" });
  }
};

// === LIRE TOUTES LES ÉDITIONS ===
export const getAllEditions = async (req, res) => {
  try {
    const editions = await Edition.find().populate("artists").populate("guests");
    res.status(200).json(editions);
  } catch {
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

// === METTRE À JOUR UNE ÉDITION ===
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
    for (const artistData of editionData.artists || []) {
      const fakeReq = { params: { id: artistData._id }, body: { ...artistData }, file: req.file };
      const artist = artistData._id
        ? await artistsCtrl.updateArtist(fakeReq, fakeRes, true)
        : await artistsCtrl.createArtist(fakeReq, fakeRes, true);
      updatedArtistIds.push(artist._id);
    }

    const updatedGuestIds = [];
    for (const guestData of editionData.guests || []) {
      const fakeReq = { params: { id: guestData._id }, body: { ...guestData }, file: req.file };
      const guest = guestData._id
        ? await guestsCtrl.updateGuest(fakeReq, fakeRes, true)
        : await guestsCtrl.createGuest(fakeReq, fakeRes, true);
      updatedGuestIds.push(guest._id);
    }

    existingEdition.title = editionData.title || existingEdition.title;
    existingEdition.poster = editionData.poster || existingEdition.poster;
    existingEdition.artists = updatedArtistIds;
    existingEdition.guests = updatedGuestIds;

    await existingEdition.save();
    res.status(200).json(existingEdition);
  } catch (error) {
    console.error("updateEdition error:", error);
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
    console.error("deleteEdition error:", error);
    res.status(500).json({ error: error.message || "Erreur serveur (deleteEdition)" });
  }
};
