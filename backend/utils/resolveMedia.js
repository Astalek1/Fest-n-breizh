import imagekit from "../config/imageKit.js";

export const resolveMedia = async (media, file, folder, cleanName) => {
  // 1️ Si c’est une URL (YouTube, site externe…)
  if (typeof media === "string") {
    try {
      new URL(media);
      return {
        url: media,
        urlSmall: null,
        fileId: null,
        fileIdSmall: null,
      };
    } catch {
      // Pas une URL valide → on continue
    }
  }

  // 2️ Upload depuis Sharp (buffer(s) déjà traités)
  if (file && (file.buffer || file.bufferSmall || file.bufferLarge)) {
    const timestamp = Date.now();

    // Cas A — Sharp a généré deux tailles (photo, poster)
    if (file.bufferSmall && file.bufferLarge) {
      const [smallUpload, largeUpload] = await Promise.all([
        imagekit.upload({
          file: file.bufferSmall.toString("base64"),
          fileName: `${cleanName}-small-${timestamp}.webp`,
          folder,
        }),
        imagekit.upload({
          file: file.bufferLarge.toString("base64"),
          fileName: `${cleanName}-large-${timestamp}.webp`,
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

    // Cas B — Sharp a généré une seule image (logo, etc.)
    const sourceBuffer = file.buffer || file.bufferLarge || file.bufferSmall; // fallback si un seul buffer existe

    if (sourceBuffer) {
      const upload = await imagekit.upload({
        file: sourceBuffer.toString("base64"),
        fileName: `${cleanName}-${timestamp}.webp`,
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

  // 3️ Aucun fichier exploitable
  return {
    url: null,
    urlSmall: null,
    fileId: null,
    fileIdSmall: null,
  };
};
