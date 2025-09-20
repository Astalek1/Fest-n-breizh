import mongoose from "mongoose";

const editionsSchema = mongoose.Schema({
  title: { type: String, required: true },
  affiche: { type: String, required: true },
  artistes: [
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      media: { type: String, required: true },
    },
  ],
  invites: [
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      media: { type: String, required: true },
    },
  ],
});
