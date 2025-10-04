import Gallery from "../models/Gallery.js";
import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";
// Plus tard : Edition si besoin

export const isFileInUse = async (fileId) => {
  try {
    // Vérifie d'abord dans Gallery
    const galleryUse = await Gallery.findOne({
      $or: [{ mediaFileIdLarge: fileId }, { mediaFileIdSmall: fileId }],
    });

    // Vérifie dans Artistes
    const artistUse = await Artist.findOne({ mediaFileId: fileId });

    // Vérifie dans Invités
    const guestUse = await Guest.findOne({ mediaFileId: fileId });

    const inUse = !!(galleryUse || artistUse || guestUse);

    console.log("🧩 Vérif utilisation fichier :", fileId, "→", inUse);

    return inUse;
  } catch (error) {
    console.error("Erreur dans isFileInUse :", error.message);
    return false;
  }
};
