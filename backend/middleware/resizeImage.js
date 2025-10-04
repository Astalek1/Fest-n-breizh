import sharp from "sharp";
import path from "path";

// Tailles max par type (à ajuster plus tard si besoin)
const SIZE_PRESETS = {
  photo: {
    small: { width: 600, height: 600 },
    large: { width: 1600, height: 1600 },
  },
  affiche: {
    small: { width: 800, height: 1200 },
    large: { width: 1200, height: 1800 },
  },
  logo: { width: 600, height: 600 },
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

  const type = req.body.type;
  const preset = SIZE_PRESETS[type] || SIZE_PRESETS.photo;

  try {
    // Si photo ou affiche → deux versions
    if (preset.small && preset.large) {
      // petite version
      const smallBuffer = await sharp(req.file.buffer)
        .resize(preset.small.width, preset.small.height, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toFormat("webp", { quality: 75 })
        .toBuffer();

      // grande version
      const largeBuffer = await sharp(req.file.buffer)
        .resize(preset.large.width, preset.large.height, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toFormat("webp", { quality: 85 })
        .toBuffer();

      req.file = {
        bufferSmall: smallBuffer,
        filenameSmall: `${safeName}-small-${Date.now()}.webp`,
        bufferLarge: largeBuffer,
        filenameLarge: `${safeName}-large-${Date.now()}.webp`,
        mimetype: "image/webp",
      };
    } else {
      // Sinon → version unique
      const optimizedBuffer = await sharp(req.file.buffer)
        .resize(preset.width, preset.height, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toFormat("webp", { quality: 80 })
        .toBuffer();

      req.file.buffer = optimizedBuffer;
      req.file.filename = `${safeName}-${Date.now()}.webp`;
    }

    next();
  } catch (error) {
    console.error("Erreur Sharp :", error);
    res.status(500).json({ error: "Erreur lors du traitement de l’image." });
  }
};
