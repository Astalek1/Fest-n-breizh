import imagekit from "../config/imageKit.js";

// Fonction pour résoudre le média (URL externe ou upload ImageKit) //
export const resolveMedia = async (media, file, folder, cleanName) => {
  // 1️ Cas : l’utilisateur fournit directement une URL
  if (typeof media === "string") {
    try {
      new URL(media); // Vérifie si c’est une vraie URL
      return { url: media, fileId: null }; // Pas besoin d’upload
    } catch {
      // Pas une URL valide → on continue
    }
  }

  // 2️ Cas : upload d’une image envoyée via req.file (photo, affiche, logo, etc.)
  if (file) {
    // Si Sharp a créé deux versions → upload les deux
    if (file.bufferSmall && file.bufferLarge) {
      const [smallUpload, largeUpload] = await Promise.all([
        imagekit.upload({
          file: file.bufferSmall.toString("base64"),
          fileName: file.filenameSmall,
          folder,
        }),
        imagekit.upload({
          file: file.bufferLarge.toString("base64"),
          fileName: file.filenameLarge,
          folder,
        }),
      ]);

      return {
        urlSmall: smallUpload.url,
        fileIdSmall: smallUpload.fileId,
        urlLarge: largeUpload.url,
        fileIdLarge: largeUpload.fileId,
      };
    }

    // Sinon, version unique (logos, annonces, etc.)
    if (file.buffer) {
      const uploadResult = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: file.filename || `${cleanName}-${Date.now()}.webp`,
        folder,
      });

      return { url: uploadResult.url, fileId: uploadResult.fileId };
    }
  }

  //  3 Rien d’exploitable
  return { url: null, fileId: null };
};
