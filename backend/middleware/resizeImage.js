import sharp from "sharp";
import path from "path";

const PRESETS = {
  photo: { small: { w: 600 }, large: { w: 1600 } },
  poster: { small: { w: 800 }, large: { w: 1200 } },
  logo: { one: { w: 600, h: 600 } },
  default: { one: { w: 1600 } },
};

const fieldTypeMap = {
  media: "poster",
  artistFiles: "photo",
  guestFiles: "logo",
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
      .rotate() // ✅ corrige l’orientation des images (portrait/paysage)
      .resize({ width: small.w, fit: "inside", withoutEnlargement: true })
      .toFormat("webp", { quality: 75 })
      .toBuffer(),
    sharp(buffer)
      .rotate() // ✅ même correction sur la version large
      .resize({ width: large.w, fit: "inside", withoutEnlargement: true })
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
    .rotate() // ✅ indispensable pour corriger les images paysage
    .resize({
      width: one.w,
      height: one.h || null,
      fit: one.h ? "contain" : "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: true,
    })
    .toFormat("webp", { quality: 80 })
    .toBuffer();

  return { buffer: out, filename, mimetype: "image/webp" };
}

function inferType(req, file) {
  if (req.body?.type && PRESETS[req.body.type]) return req.body.type;
  const byField = fieldTypeMap[file.fieldname];
  return byField || "photo";
}

async function processOne(file, type) {
  const base = safeBase(file.originalname);

  if (type === "photo" || type === "poster") {
    const dual = await makeDualVersions(file.buffer, base, PRESETS[type]);
    Object.assign(file, dual);
  } else {
    const single = await makeSingleVersion(file.buffer, base, PRESETS[type] || PRESETS.default);
    Object.assign(file, single);
  }

  file.mimetype = "image/webp";
}

export default async function resizeImage(req, res, next) {
  try {
    if (req.file?.buffer) {
      await processOne(req.file, inferType(req, req.file));
      if (file.bufferLarge) file.buffer = file.bufferLarge; // test

      return next();
    }

    if (req.files && !Array.isArray(req.files)) {
      const all = [];
      for (const field of Object.keys(req.files)) {
        for (const f of req.files[field]) {
          all.push(processOne(f, inferType(req, f)));
        }
      }
      await Promise.all(all);
      return next();
    }

    if (Array.isArray(req.files) && req.files.length) {
      await Promise.all(req.files.map((f) => processOne(f, inferType(req, f))));
      return next();
    }

    return next();
  } catch (err) {
    console.error("Erreur Sharp :", err);
    res.status(500).json({ error: "Erreur lors du traitement de l’image." });
  }
}
