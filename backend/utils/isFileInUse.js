import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";
import Gallery from "../models/Gallery.js";

export const isFileInUse = async (fileId) => {
  // Vérifie dans Gallery
  const galleryUse = await Gallery.findOne({
    $or: [{ mediaFileIdLarge: fileId }, { mediaFileIdSmall: fileId }],
  });
  if (galleryUse) return true;

  // Vérifie dans Artistes
  const artistUse = await Artist.findOne({ mediaFileId: fileId });
  if (artistUse) return true;

  // Vérifie dans Invités
  const guestUse = await Guest.findOne({ mediaFileId: fileId });
  if (guestUse) return true;

  // Si rien trouvé → pas utilisé
  return false;
};
