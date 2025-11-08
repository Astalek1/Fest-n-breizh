import mongoose from "mongoose";

const editionsSchema = mongoose.Schema({
  title: { type: String, required: true },
  poster: { type: String, required: true },
  artists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }], // références
  guests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Guest" }], // références
});

const Edition = mongoose.model("Edition", editionsSchema);

export default Edition;
