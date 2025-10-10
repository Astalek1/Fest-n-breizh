import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Seules les images sont autorisées"), false);
};

const upload = multer({ storage, fileFilter });

// On exporte une fonction configurée pour 1 seul fichier “file”
export const uploadSingle = upload.single("file");

export default upload;
