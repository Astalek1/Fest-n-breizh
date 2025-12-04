import mongoose from "mongoose";

const linkSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  logo: { type: String},
  logoFileId: { type: String},
  logoName: { type: String },
});

const Link = mongoose.model("Link", linkSchema);

export default Link;
