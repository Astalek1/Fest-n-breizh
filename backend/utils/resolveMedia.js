import imagekit from "../config/imageKit.js";

export const resolveMedia = async (media, file, folder, cleanName) => {
  // 1. Si c’est une URL directe (non upload)
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
      // pas une URL valide → on continue
    }
  }

  // 2. Upload depuis req.file (Sharp)
  if (file) {
    // Si Sharp a généré deux versions
    if (file.bufferSmall && file.bufferLarge) {
      const timestamp = Date.now();

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

    // Sinon, image unique (logos, annonces, etc.)
    if (file.buffer) {
      const upload = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: `${cleanName}-${Date.now()}.webp`,
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

  // 3. Rien d’exploitable
  return {
    url: null,
    urlSmall: null,
    fileId: null,
    fileIdSmall: null,
  };
};
