import mongoose from "mongoose";

const announcementSchema = mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  url: { type: String },
  media: { type: String },
  mediaFileId: { type: String },
  mediaType: {
    type: String,
    enum: ["photo", "video", "logo"],
    required: true,
  },
});

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
