import mongoose from "mongoose";

const partnerSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String },
  logo: { type: String, required: true },
  logoFileId: { type: String, required: true },
});

const Partner = mongoose.model("Partner", partnerSchema);

export default Partner;
