// middleware/resizeImage.js
import sharp from "sharp";
import path from "path";

const PRESETS = {
  photo: { small: { w: 600, h: 600 }, large: { w: 1600, h: 1600 } },
  poster: { small: { w: 800, h: 1200 }, large: { w: 1200, h: 1800 } },
  logo: { one: { w: 600, h: 600 } },
  default: { one: { w: 1200, h: 1200 } },
};

const fieldTypeMap = {
  // Editions
  media: "poster",
  artistFiles: "photo",
  guestFiles: "logo",
  // Gallery (selon champ utilisés ailleurs)
  photo: "photo",
  poster: "poster",
  logo: "logo",
};

const safeBase = (name) =>
  path
    .parse(name || "image")
    .name.replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "")
    .toLowerCase();

async function makeDualVersions(buffer, base, { small, large }) {
  const ts = Date.now();
  const filenameSmall = `${base}-small-${ts}.webp`;
  const filenameLarge = `${base}-large-${ts}.webp`;

  const [bufSmall, bufLarge] = await Promise.all([
    sharp(buffer)
      .resize(small.w, small.h, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFormat("webp", { quality: 75 })
      .toBuffer(),
    sharp(buffer)
      .resize(large.w, large.h, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFormat("webp", { quality: 85 })
      .toBuffer(),
  ]);

  return {
    bufferSmall: bufSmall,
    filenameSmall,
    bufferLarge: bufLarge,
    filenameLarge,
    mimetype: "image/webp",
  };
}

async function makeSingleVersion(buffer, base, { one }) {
  const ts = Date.now();
  const filename = `${base}-${ts}.webp`;
  const out = await sharp(buffer)
    .resize(one.w, one.h, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toFormat("webp", { quality: 80 })
    .toBuffer();

  return { buffer: out, filename, mimetype: "image/webp" };
}

function inferType(req, file) {
  // 1) priorité à un 'type' explicite dans le body
  if (req.body?.type && PRESETS[req.body.type]) return req.body.type;

  // 2) sinon d’après le nom de champ
  const byField = fieldTypeMap[file.fieldname];
  if (byField) return byField;

  // 3) fallback (compatibilité gallery photos)
  return "photo";
}

async function processOne(file, type) {
  const base = safeBase(file.originalname);
  if (type === "photo" || type === "poster") {
    const dual = await makeDualVersions(file.buffer, base, PRESETS[type]);
    // on enrichit l’objet file (compatible avec resolveMedia)
    Object.assign(file, dual);
  } else {
    const single = await makeSingleVersion(
      file.buffer,
      base,
      PRESETS[type] || PRESETS.default
    );
    Object.assign(file, single);
  }
  file.mimetype = "image/webp";
}

export default async function resizeImage(req, res, next) {
  try {
    // Cas 1 : un seul fichier (multer.single)
    if (req.file?.buffer) {
      const type = inferType(req, req.file);
      await processOne(req.file, type);
      return next();
    }

    // Cas 2a : .fields() -> req.files est un OBJET { fieldName: [files...] }
    if (req.files && !Array.isArray(req.files)) {
      const all = [];
      for (const field of Object.keys(req.files)) {
        for (const f of req.files[field]) {
          const t = inferType(req, f);
          all.push(processOne(f, t));
        }
      }
      await Promise.all(all);
      return next();
    }

    // Cas 2b : .any() -> req.files est un ARRAY
    if (Array.isArray(req.files) && req.files.length) {
      await Promise.all(req.files.map((f) => processOne(f, inferType(req, f))));
      return next();
    }

    // Aucun fichier → on passe
    return next();
  } catch (err) {
    console.error("Erreur Sharp :", err);
    return res
      .status(500)
      .json({ error: "Erreur lors du traitement de l’image." });
  }
}
