import multer from "multer";

// stockage en mémoire uniquement
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
