import mongoose from "mongoose";

const guestsSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  media: { type: String, required: true },
  mediaFileId: { type: String, required: true },
});

const Guest = mongoose.model("Guest", guestsSchema);

export default Guest;
