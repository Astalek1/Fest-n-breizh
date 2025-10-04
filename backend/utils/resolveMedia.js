import imagekit from "../config/imageKit.js";

export const resolveMedia = async (media, file, folder, cleanName) => {
  // Cas 1 : URL externe
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
      // pas une URL → on continue
    }
  }

  // Cas 2 : upload (Sharp a créé une ou deux versions)
  if (file) {
    // deux versions (photo / poster)
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

    // une seule version (logo / annonce)
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

  // Cas 3 : aucun média valide
  return {
    url: null,
    urlSmall: null,
    fileId: null,
    fileIdSmall: null,
  };
};
