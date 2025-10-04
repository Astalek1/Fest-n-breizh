import mongoose from "mongoose";

const gallerySchema = mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }, // version large
  urlSmall: { type: String }, // version petite
  mediaFileId: { type: String }, // fileId de la version large
  mediaFileIdSmall: { type: String }, // fileId de la version petite
  alt: { type: String, required: true },
  caption: { type: String },
  type: { type: String, enum: ["photo", "poster"], required: true },
});

const Gallery = mongoose.model("Gallery", gallerySchema);
export default Gallery;
