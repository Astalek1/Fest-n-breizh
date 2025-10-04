import multer from "multer";

// Utilisation de memoryStorage pour Sharp
const storage = multer.memoryStorage();

// Filtre simple (facultatif, mais recommandé)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images sont autorisées"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
