import mongoose from "mongoose";

const artistSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  media: { type: String, required: true },
  mediaFileId: { type: String, required: true },
});

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;
