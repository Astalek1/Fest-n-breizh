import imagekit from "../config/imageKit.js";

export const resolveMedia = async (media, file, folder, cleanName) => {
  // 1️⃣ Cas : URL externe
  if (typeof media === "string") {
    try {
      new URL(media);
      return {
        url: media,
        urlSmall: null,
        fileId: null,
        fileIdSmall: null,
      };
    } catch {}
  }

  // 2️⃣ Vérifie si une image portant le même "cleanName" existe déjà
  const existingFiles = await imagekit.listFiles({
    searchQuery: `name="${cleanName}" AND path="${folder}"`,
    limit: 2,
  });

  if (existingFiles.length > 0) {
    const large = existingFiles.find((f) => f.name.includes("large"));
    const small = existingFiles.find((f) => f.name.includes("small"));

    return {
      url: large ? large.url : small?.url || null,
      urlSmall: small ? small.url : null,
      fileId: large ? large.fileId : small?.fileId || null,
      fileIdSmall: small ? small.fileId : null,
    };
  }

  // 3️⃣ Upload si le fichier n’existe pas déjà
  if (file) {
    if (file.bufferSmall && file.bufferLarge) {
      const [smallUpload, largeUpload] = await Promise.all([
        imagekit.upload({
          file: file.bufferSmall.toString("base64"),
          fileName: `${cleanName}-small.webp`,
          folder,
          useUniqueFileName: false, // 🔹 Empêche ImageKit d’ajouter un suffixe
          tags: ["photo", "small"],
          customMetadata: { title: cleanName },
        }),
        imagekit.upload({
          file: file.bufferLarge.toString("base64"),
          fileName: `${cleanName}-large.webp`,
          folder,
          useUniqueFileName: false,
          tags: ["photo", "large"],
          customMetadata: { title: cleanName },
        }),
      ]);

      return {
        url: largeUpload.url,
        urlSmall: smallUpload.url,
        fileId: largeUpload.fileId,
        fileIdSmall: smallUpload.fileId,
      };
    }

    // Sinon version unique (logos, annonces)
    if (file.buffer) {
      const upload = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: `${cleanName}.webp`,
        folder,
        useUniqueFileName: false,
        customMetadata: { title: cleanName },
      });

      return {
        url: upload.url,
        urlSmall: null,
        fileId: upload.fileId,
        fileIdSmall: null,
      };
    }
  }

  // 4️⃣ Fallback
  return {
    url: null,
    urlSmall: null,
    fileId: null,
    fileIdSmall: null,
  };
};
