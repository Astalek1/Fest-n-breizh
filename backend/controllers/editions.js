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

// === METTRE À JOUR UNE ÉDITION (analyse complète + logs détaillés) ===
export const updateEdition = async (req, res) => {
  try {
    console.log("\n=== DÉBUT updateEdition ===");

    // --- Lecture des données ---
    const editionData = req.body.edition ? JSON.parse(req.body.edition) : req.body;
    console.log("editionData keys:", Object.keys(editionData));

    const existingEdition = await Edition.findById(req.params.id);
    if (!existingEdition) return res.status(404).json({ error: "Édition non trouvée" });

    const updatedArtists = [];
    const updatedGuests = [];

    // ===================== ARTISTES =====================
    console.log("=== ARTISTES ===");

    for (const [index, artist] of (editionData.artists || []).entries()) {
      console.log(`→ artiste[${index}]`, artist);

      if (!artist._id) {
        console.log(`❌ artiste[${index}] ignoré (pas d'_id)`);
        continue;
      }

      const file =
        req.files?.artistFiles?.[index] ||
        (req.files?.artistFiles || []).find((f) => f.originalname.includes(artist.fileName)) ||
        null;

      console.log(`file artiste[${index}] présent ?`, !!file);

      const fakeReq = {
        params: { id: artist._id },
        body: { artist: JSON.stringify(artist) },
        file,
      };

      try {
        const updated = await artistsCtrl.updateArtist(fakeReq, null, true);
        console.log(`→ artiste[${index}] ${artist.name} ${updated ? "✅" : "⚠️ échec"}`);
        if (updated?._id) updatedArtists.push(updated._id);
      } catch (e) {
        console.error(`⚠️ updateArtist[${index}] ${artist.name}:`, e.message);
      }
    }

    // ===================== INVITÉS =====================
    console.log("=== INVITÉS ===");

    for (const [index, guest] of (editionData.guests || []).entries()) {
      console.log(`→ invité[${index}]`, guest);

      if (!guest._id) {
        console.log(`❌ invité[${index}] ignoré (pas d'_id)`);
        continue;
      }

      // --- LOG COMPLET DES FICHIERS REÇUS ---
      console.log(
        `DEBUG fichiers reçus pour invité[${index}]:`,
        req.files?.guestFiles?.map((f) => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
        })) || "Aucun fichier reçu"
      );

      const allGuestFiles = req.files?.guestFiles || [];

      const file =
        allGuestFiles.find((f) =>
          f.originalname.toLowerCase().includes((guest.fileName || guest.name || "").toLowerCase())
        ) ||
        allGuestFiles.find(
          (f) =>
            guest.mediaType === "image" &&
            f.mimetype.startsWith("image/") &&
            !f.originalname.toLowerCase().includes("logo")
        ) ||
        allGuestFiles.find(
          (f) =>
            guest.mediaType === "logo" &&
            f.mimetype.startsWith("image/") &&
            f.originalname.toLowerCase().includes("logo")
        ) ||
        null;

      console.log(`file invité[${index}] présent ?`, !!file);

      // --- TEST DEBUG : détection du mediaType réel ---
      const inferredType =
        guest.mediaType?.toLowerCase() || (guest.fileName?.includes("image") ? "image" : "logo");

      console.log(`DEBUG invité[${index}] → mediaType avant envoi:`, guest.mediaType);
      console.log(`DEBUG invité[${index}] → mediaType après inférence:`, inferredType);
      console.log(
        `DEBUG invité[${index}] → folder attendu:`,
        inferredType === "logo" ? "/festn_breizh/logos" : "/festn_breizh/invités"
      );
      console.log(`DEBUG invité[${index}] → fileName:`, guest.fileName);

      // --- TEST SUPPLÉMENTAIRE : analyse du comportement erroné ---
      if (file && inferredType === "image") {
        console.log(
          `⚠️ TEST DEBUG CRITIQUE → invité[${index}] possède un fichier image mais risque de finir dans logo :`,
          {
            fileDetected: file.originalname,
            typeDétecté: inferredType,
            mediaTypeInitial: guest.mediaType,
            filePathAttendu: "/festn_breizh/invités",
          }
        );
      }
      // --- Vérification stricte pour éviter les doublons de logos existants ---
      if (guest.mediaFileId && guest.mediaType === "logo") {
        console.log(
          `⚠️ INVITÉ[${index}] a un logo existant (ID: ${guest.mediaFileId}), on ignore tout upload pour éviter le doublon.`
        );
        file = null; // On désactive le fichier uploadé
      }

      const fakeReq = {
        params: { id: guest._id },
        body: {
          guest: JSON.stringify({
            ...guest,
            mediaType: inferredType,
          }),
        },
        file,
      };

      try {
        const updated = await guestsCtrl.updateGuest(fakeReq, null, true);
        console.log(`résultat updateGuest[${index}]:`, updated ? updated._id : "aucun retour");
        if (updated?._id) updatedGuests.push(updated._id);
      } catch (err) {
        console.error(`❌ Erreur updateGuest[${index}] (${guest.name}) →`, err.message);
      }
    }

    // ===================== MISE À JOUR ÉDITION =====================
    existingEdition.title = editionData.title || existingEdition.title;
    existingEdition.poster = editionData.poster || existingEdition.poster;
    if (updatedArtists.length) existingEdition.artists = updatedArtists;
    if (updatedGuests.length) existingEdition.guests = updatedGuests;

    await existingEdition.save();

    console.log(`✅ Édition mise à jour (${existingEdition._id})`);
    console.log("→ Artistes :", updatedArtists.length);
    console.log("→ Invités :", updatedGuests.length);
    console.log("=== FIN updateEdition ===\n");

    res.status(200).json({
      message: "Édition mise à jour avec succès",
      edition: existingEdition,
    });
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
