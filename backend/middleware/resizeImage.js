// middleware/resizeImage.js
import sharp from "sharp";
import path from "path";

const PRESETS = {
  photo: { small: { w: 600, h: 400 }, large: { w: 1600, h: 1400 } },
  poster: { small: { w: 800, h: 1200 }, large: { w: 1200, h: 1800 } },
  logo: { one: { w: 600, h: 600 } },
  default: { one: { w: 1600, h: 1400 } },
};

const fieldTypeMap = {
  media: "poster", // affiche d’édition
  artistFiles: "photo", // photos artistes
  guestFiles: "logo", // logos invités
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
        fit: "cover",
        position: "center",
      })
      .toFormat("webp", { quality: 75 })
      .toBuffer(),
    sharp(buffer)
      .resize(large.w, large.h, {
        fit: "cover",
        position: "center",
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
      fit: "cover",
      position: "center",
    })
    .toFormat("webp", { quality: 80 })
    .toBuffer();

  return { buffer: out, filename, mimetype: "image/webp" };
}

function inferType(req, file) {
  if (req.body?.type && PRESETS[req.body.type]) return req.body.type;
  const byField = fieldTypeMap[file.fieldname];
  return byField || "default";
}

async function processOne(file, type) {
  const base = safeBase(file.originalname);
  if (type === "photo" || type === "poster") {
    Object.assign(
      file,
      await makeDualVersions(file.buffer, base, PRESETS[type])
    );
  } else {
    Object.assign(
      file,
      await makeSingleVersion(
        file.buffer,
        base,
        PRESETS[type] || PRESETS.default
      )
    );
  }
  file.mimetype = "image/webp";
}

export default async function resizeImage(req, res, next) {
  try {
    // .single()
    if (req.file?.buffer) {
      await processOne(req.file, inferType(req, req.file));
      return next();
    }

    // .fields()
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

    // .any()
    if (Array.isArray(req.files) && req.files.length) {
      await Promise.all(req.files.map((f) => processOne(f, inferType(req, f))));
      return next();
    }

    next();
  } catch (err) {
    console.error("Erreur Sharp :", err);
    res.status(500).json({ error: "Erreur lors du traitement de l’image." });
  }
}
