import imagekit from "../config/imageKit.js";

// Fonction pour résoudre le média (URL externe ou upload ImageKit) //
export const resolveMedia = async (media, file, folder, cleanName) => {
  // 1. Cas : l’utilisateur fournit directement une URL
  if (typeof media === "string") {
    try {
      new URL(media); // essaie de créer un objet URL
      return { url: media, fileId: null }; // URL externe → pas de fileId
    } catch {
      // ce n’est pas une URL valide → on passe à l’upload
    }
  }

  // 2. Cas : upload d’une image envoyée dans req.file
  if (file && file.buffer) {
    const uploadResult = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName: `${cleanName}-${Date.now()}.webp`,
      folder: folder,
    });

    return { url: uploadResult.url, fileId: uploadResult.fileId };
  }

  // 3. Si rien n’est valide -> on retourne null
  return { url: null, fileId: null };
};
