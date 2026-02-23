import mongoose from "mongoose";

const artistSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  media: { type: String },
  mediaType: {
    type: String, enum: ["image", "video"
   ], }, 
  mediaFileId: { type: String },
  logo: { type: String },
  logoFileId: { type: String },
  mediaName: { type: String },
});

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;
