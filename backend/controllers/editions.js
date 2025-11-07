import Edition from "../models/Editions.js";
import * as artistsCtrl from "./artists.js";
import * as guestsCtrl from "./guests.js";
import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";

// === CRÉER UNE NOUVELLE ÉDITION ===
export const createEdition = async (req, res) => {
  try {
    const editionData = JSON.parse(req.body.edition);
    if (!editionData.title || !editionData.poster)
      return res.status(400).json({ error: "Titre et affiche requis." });

    // --- ARTISTES ---
    const artistDocs = [];
    for (const [index, artistData] of (editionData.artists || []).entries()) {
      const mediaFile =
        artistData.mediaType !== "video" && !artistData.mediaFileId
          ? req.files?.artistFiles?.[index] || null
          : null;

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
    let fileCursor = 0; // Curseur pour parcourir les fichiers réellement envoyés

    console.log("DEBUG req.files.guestFiles length:", uploadedGuestFiles.length);
    uploadedGuestFiles.forEach((f, i) => console.log(`guestFiles[${i}] →`, f.originalname));

    for (const [index, guestData] of (editionData.guests || []).entries()) {
      // Prend un fichier seulement si nécessaire (image ou logo sans mediaFileId)
      const needsFile = guestData.mediaType !== "video" && !guestData.mediaFileId;
      const mediaFile = needsFile ? uploadedGuestFiles[fileCursor++] || null : null;

      console.log("DEBUG guest index:", index, {
        hasFile: !!mediaFile,
        mediaType: guestData.mediaType,
        guestFilesCount: uploadedGuestFiles.length,
        fileCursor,
      });

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
      poster: editionData.poster,
      artists: artistDocs,
      guests: guestDocs,
    });

    await newEdition.save();
    res.status(201).json({ message: "Édition créée avec succès", edition: newEdition });
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

    // --- MISE À JOUR DES ARTISTES ---
    const updatedArtists = await artistsCtrl.updateArtist(editionData.artists, req.files);

    // --- MISE À JOUR DES INVITÉS ---
    const updatedGuests = await guestsCtrl.updateGuest(editionData.guests, req.files);

    // --- MISE À JOUR DE L'ÉDITION ---
    existingEdition.title = editionData.title || existingEdition.title;
    existingEdition.poster = editionData.poster || existingEdition.poster;
    existingEdition.artists = updatedArtists;
    existingEdition.guests = updatedGuests;

    await existingEdition.save();
    res.status(200).json({ message: "Édition mise à jour avec succès", edition: existingEdition });
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
