import sharp from "sharp";
import path from "path";

// Tailles max par type (à ajuster plus tard si besoin)
const SIZE_PRESETS = {
    photo:   { width: 1600, height: 1600 },
    affiche: { width: 1200, height: 1800 },
    logo:    { width: 600,  height: 600  },
    annonce: { width: 1000, height: 1000 },
    default: { width: 1200, height: 1200 },
};

export default async (req, res, next) => {
  if (!req.file || !req.file.buffer) {
    return next(); // aucun fichier → on passe au suivant
  }

  const originalName = path.parse(req.file.originalname).name;
  const safeName = originalName
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "")
    .toLowerCase();

  // récupère le preset demandé (par défaut : photo)
  const preset = SIZE_PRESETS[req.body.type] || SIZE_PRESETS.photo;

  const filename = `${safeName}-${Date.now()}.webp`;

  try {
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(preset.width, preset.height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFormat("webp", { quality: 80 }) // compression WebP
      .toBuffer();

    req.file.buffer = optimizedBuffer;
    req.file.filename = filename;

    next();
  } catch (error) {
    console.error("Erreur Sharp :", error);
    res.status(500).json({ error: "Erreur lors du traitement de l’image." });
  }
};
