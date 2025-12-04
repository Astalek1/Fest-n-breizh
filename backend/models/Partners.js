import mongoose from "mongoose";

const partnerSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String },
  logo: { type: String},
  logoFileId: { type: String},
  logoName: { type: String },
});

const Partner = mongoose.model("Partner", partnerSchema);

export default Partner;
