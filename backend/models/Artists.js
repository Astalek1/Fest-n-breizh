import mongoose from "mongoose";

const artistSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  media: { type: String },
  mediaFileId: { type: String },
  logo: { type: String },
  logoFileId: { type: String },
});

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;
