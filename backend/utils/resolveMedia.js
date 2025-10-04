import imagekit from "../config/imageKit.js";

export const resolveMedia = async (media, file, folder, cleanName) => {
  //  1. Cas : URL externe directe
  if (typeof media === "string") {
    try {
      new URL(media); // vérifie que c'est une URL valide
      return {
        url: media,
        urlSmall: null,
        fileId: null,
        fileIdSmall: null,
      };
    } catch {
      // ce n'est pas une URL valide → on passe à l'upload
    }
  }

  //  2. Cas : upload d’un fichier envoyé via Sharp
  if (file) {
    // Si Sharp a généré deux versions (photo/poster)
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
        url: largeUpload.url,
        urlSmall: smallUpload.url,
        fileId: largeUpload.fileId,
        fileIdSmall: smallUpload.fileId,
      };
    }

    // Sinon → version unique (logos, annonces, etc.)
    if (file.buffer) {
      const upload = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: file.filename || `${cleanName}-${Date.now()}.webp`,
        folder,
      });

      return {
        url: upload.url,
        urlSmall: null,
        fileId: upload.fileId,
        fileIdSmall: null,
      };
    }
  }

  //  3. Rien d'exploitable
  return {
    url: null,
    urlSmall: null,
    fileId: null,
    fileIdSmall: null,
  };
};
