import mongoose from "mongoose";

const linkSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  logo: { type: String, required: true },
  logoFileId: { type: String, required: true },
});

const Link = mongoose.model("Link", linkSchema);

export default Link;
