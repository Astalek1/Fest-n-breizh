import Link from "../models/Links.js";
import Partner from "../models/Partners.js";
import Artist from "../models/Artists.js";
import Guest from "../models/Guests.js";
import Edition from "../models/Editions.js";
import Announcement from "../models/Announcements.js";
import Gallery from "../models/Gallery.js";
import Video from "../models/Videos.js";

export const isFileInUse = async (fileId) => {
  if (!fileId) return false;

  const checks = await Promise.all([
    // Vérifie dans Gallery
    Gallery.exists({
      $or: [{ mediaFileIdLarge: fileId }, { mediaFileIdSmall: fileId }],
    }),

    // Vérifie dans Artistes
    Artist.exists({
      $or: [
        { mediaFileId: fileId },
        { logoFileId: fileId },
        { logo: { $regex: fileId, $options: "i" } },
      ],
    }),

    // Vérifie dans Invités
    Guest.exists({
      $or: [
        { mediaFileId: fileId },
        { logoFileId: fileId },
        { logo: { $regex: fileId, $options: "i" } },
      ],
    }),

    // Vérifie dans Partenaires
    Partner.exists({
      $or: [
        { logoFileId: fileId },
        { logo: { $regex: fileId, $options: "i" } },
      ],
    }),

    // Vérifie dans Liens
    Link.exists({
      $or: [
        { logoFileId: fileId },
        { logo: { $regex: fileId, $options: "i" } },
      ],
    }),

    // Vérifie dans Éditions
    Edition.exists({
      $or: [
        { posterFileId: fileId },
        { logoFileId: fileId },
        { poster: { $regex: fileId, $options: "i" } },
      ],
    }),

    // Vérifie dans Annonces
    Announcement.exists({
      $or: [
        { mediaFileId: fileId },
        { imageFileId: fileId },
        { image: { $regex: fileId, $options: "i" } },
      ],
    }),

    // Vérifie dans Vidéos (cas rare, mais cohérent)
    Video.exists({
      $or: [{ logoFileId: fileId }, { thumbnailFileId: fileId }],
    }),
  ]);

  // Si au moins un résultat est trouvé → fichier encore utilisé
  return checks.some((result) => result);
};
