import multer from "multer";

// stockage en mémoire uniquement
const storage = multer.memoryStorage();

const upload = multer({ storage });

// accepte tous les fichiers envoyés
export default upload.any();
