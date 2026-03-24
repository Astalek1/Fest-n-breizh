import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tokenActif: { type: String, default: null, unique: true },
  lastSeen: { type: Number, default: null }
});

const User = mongoose.model("User", userSchema);

export default User;
