import Artiste from "../models/Artistes.js";
import Invite from "../models/Invites.js";
// Plus tard : Edition si besoin

export const isFileInUse = async (fileId) => {
  // Vérifie dans Artistes
  const artisteUse = await Artiste.findOne({ mediaFileId: fileId });
  if (artisteUse) return true;

  // Vérifie dans Invités
  const inviteUse = await Invite.findOne({ mediaFileId: fileId });
  if (inviteUse) return true;

  // Si rien trouvé → pas utilisé
  return false;
};
