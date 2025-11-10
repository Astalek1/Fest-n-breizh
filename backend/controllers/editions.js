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
    let fileCursor = 0;

    console.log("DEBUG req.files.guestFiles length:", uploadedGuestFiles.length);
    uploadedGuestFiles.forEach((f, i) => console.log(`guestFiles[${i}] →`, f.originalname));

    for (const [index, guestData] of (editionData.guests || []).entries()) {
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
    res.status(201).json({
      message: "Édition créée avec succès",
      edition: newEdition,
    });
  } catch (error) {
    console.error("createEdition error:", error);
    res.status(500).json({ error: "Erreur serveur (createEdition)" });
  }
};

// === LIRE TOUTES LES ÉDITIONS ===
export const getAllEditions = async (req, res) => {
  try {
    console.log("DEBUG getAllEditions start");
    const editions = await Edition.find().populate("artists").populate("guests");
    console.log("DEBUG editions found:", editions.length);
    res.status(200).json(editions);
  } catch (err) {
    console.error("getAllEditions error:", err);
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

// === AJOUTER UN INVITÉ À UNE ÉDITION EXISTANTE ===
export const addGuestToEdition = async (req, res) => {
  try {
    console.log("=== Route guests POST appelée ===");

    const { editionId } = req.params;
    console.log("DEBUG editionId:", editionId);

    const edition = await Edition.findById(editionId);
    if (!edition) {
      console.log("❌ Aucune édition trouvée pour cet ID");
      return res.status(404).json({ error: "Édition non trouvée" });
    }

    console.log("DEBUG création de l'invité...");
    const newGuest = await guestsCtrl.createGuest(req, null, true);

    if (!newGuest || !newGuest._id) {
      console.log("❌ Erreur lors de la création de l'invité");
      return res.status(400).json({ error: "Impossible de créer l'invité" });
    }

    console.log("✅ Invité créé :", newGuest._id);

    edition.guests.push(newGuest._id);
    await edition.save();

    console.log(`✅ Invité ajouté à l'édition ${editionId}`);
    res.status(201).json({
      message: "Invité ajouté avec succès à l'édition",
      guest: newGuest,
      editionId,
    });
  } catch (error) {
    console.error("addGuestToEdition error:", error);
    res.status(500).json({ error: "Erreur serveur (addGuestToEdition)" });
  }
};

// === METTRE À JOUR UNE ÉDITION ===
export const updateEdition = async (req, res) => {
  const { editionId, guestId } = req.params;

  if (guestId) {
    console.log("🔁 Mode édition invité spécifique");
    const fakeReq = {
      params: { id: guestId },
      body: req.body,
      file: req.file,
    };
    return await guestsCtrl.updateGuest(fakeReq, res, false);
  }

  console.log("\n🧩 CHECKPOINT 0 – Entrée dans updateEdition()");
  try {
    const editionData = req.body.edition ? JSON.parse(req.body.edition) : req.body;
    console.log("CHECKPOINT 1 – editionData keys:", Object.keys(editionData));

    const existingEdition = await Edition.findById(req.params.editionId || req.params.id);
    console.log("CHECKPOINT 2 – Edition trouvée:", !!existingEdition);
    if (!existingEdition) return res.status(404).json({ error: "Édition non trouvée" });

    const updatedArtists = [];
    const updatedGuests = [];

    // === ARTISTES ===
    console.log("CHECKPOINT 3 – Début boucle ARTISTES");
    for (const [index, artist] of (editionData.artists || []).entries()) {
      console.log(`CHECKPOINT 3.${index} – Traitement artiste ${artist._id || "sans ID"}`);
      if (!artist._id) continue;

      const file =
        req.files?.artistFiles?.[index] ||
        (req.files?.artistFiles || []).find((f) => f.originalname.includes(artist.fileName)) ||
        null;
      console.log(`CHECKPOINT 3.${index}.1 – Fichier trouvé:`, !!file);

      const fakeReq = {
        params: { id: artist._id },
        body: { artist: JSON.stringify(artist) },
        file,
      };

      console.log(`CHECKPOINT 3.${index}.2 – Appel updateArtist()`);
      const updated = await artistsCtrl.updateArtist(fakeReq, null, true);
      console.log(`CHECKPOINT 3.${index}.3 – Résultat updateArtist:`, !!updated);

      if (updated?._id) updatedArtists.push(updated._id);
    }

    // === INVITÉS ===
    console.log("CHECKPOINT 4 – Début boucle INVITÉS");
    for (const [index, guest] of (editionData.guests || []).entries()) {
      console.log(`CHECKPOINT 4.${index} – Traitement invité ${guest._id || "sans ID"}`);
      if (!guest._id) continue;

      const file =
        req.files?.guestFiles?.[index] ||
        (req.files?.guestFiles || []).find((f) => f.originalname.includes(guest.fileName)) ||
        null;
      console.log(`CHECKPOINT 4.${index}.1 – Fichier trouvé:`, !!file);

      const fakeReq = {
        params: { id: guest._id },
        body: { guest: JSON.stringify(guest) },
        file,
      };

      console.log(`CHECKPOINT 4.${index}.2 – Appel updateGuest()`);
      const updated = await guestsCtrl.updateGuest(fakeReq, null, true);
      console.log(`CHECKPOINT 4.${index}.3 – Résultat updateGuest:`, !!updated);

      if (updated?._id) updatedGuests.push(updated._id);
    }

    console.log("CHECKPOINT 5 – Fin des boucles, maj Edition");

    existingEdition.title = editionData.title || existingEdition.title;
    existingEdition.poster = editionData.poster || existingEdition.poster;

    if (updatedArtists.length) existingEdition.artists = updatedArtists;
    if (updatedGuests.length) existingEdition.guests = updatedGuests;

    console.log("CHECKPOINT 6 – Sauvegarde de l’édition en base");
    await existingEdition.save();

    console.log(`✅ CHECKPOINT 7 – Édition mise à jour (${existingEdition._id})`);

    res.status(200).json({
      message: "Édition mise à jour avec succès",
      edition: existingEdition,
    });

    console.log("CHECKPOINT 8 – Réponse envoyée");
  } catch (error) {
    console.error("❌ updateEdition error:", error);
    res.status(500).json({ error: "Erreur serveur (updateEdition)" });
  } finally {
    console.log("🧩 CHECKPOINT 9 – FIN FONCTION REELLE updateEdition()");
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
