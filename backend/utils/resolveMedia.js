import imagekit from "../config/imageKit.js";

export const resolveMedia = async (media, file, folder, cleanName) => {
  // 1️ Cas : l’utilisateur fournit directement une URL externe
  if (typeof media === "string") {
    try {
      new URL(media); // Vérifie si c’est une URL valide
      return {
        url: media,
        urlSmall: null,
        fileId: null,
        fileIdSmall: null,
      };
    } catch {
      // Pas une URL valide → on passe à l’upload
    }
  }

  // 2️ Cas : upload via Sharp → on vérifie si le fichier existe déjà
  if (file) {
    // Vérifie si un fichier portant le même nom existe déjà dans le dossier
    const existingFiles = await imagekit.listFiles({
      searchQuery: `name="${cleanName}" AND path="${folder}"`,
      limit: 2,
    });

    if (existingFiles.length > 0) {
      // 🔹 Si déjà présent → on réutilise les URLs existantes
      const large = existingFiles.find((f) => f.name.includes("large"));
      const small = existingFiles.find((f) => f.name.includes("small"));

      return {
        url: large ? large.url : small?.url || null,
        urlSmall: small ? small.url : null,
        fileId: large ? large.fileId : small?.fileId || null,
        fileIdSmall: small ? small.fileId : null,
      };
    }

    // 3️ Upload si le fichier n’existe pas encore
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

    // Sinon → upload simple (logos, annonces, etc.)
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

  // 4️Aucun média exploitable
  return {
    url: null,
    urlSmall: null,
    fileId: null,
    fileIdSmall: null,
  };
};
