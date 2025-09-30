import mongoose from "mongoose";

const guestsSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  media: { type: String },
  mediaFileId: { type: String },
  logo: { type: String },
  logoFileId: { type: String },
});

const Guest = mongoose.model("Guest", guestsSchema);

export default Guest;
