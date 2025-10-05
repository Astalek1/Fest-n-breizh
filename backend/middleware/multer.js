import multer from "multer";

// Stockage en mémoire (pour Sharp ensuite)
const storage = multer.memoryStorage();

// Filtrage simple (optionnel mais recommandé)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Seules les images sont autorisées"), false);
};

const upload = multer({ storage, fileFilter });

export default upload;
