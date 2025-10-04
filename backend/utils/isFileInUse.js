import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";
// Plus tard : Edition si besoin

export const isFileInUse = async (fileId) => {
  console.log("🧩 Vérif utilisation fichier :", fileId, "→", inUse);

  // Vérifie dans Artistes
  const artistUse = await Artist.findOne({ mediaFileId: fileId });
  if (artistUse) return true;

  // Vérifie dans Invités
  const guestUse = await Guest.findOne({ mediaFileId: fileId });
  if (guestUse) return true;

  // Si rien trouvé → pas utilisé
  return false;
};
