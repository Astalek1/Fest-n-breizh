import mongoose from "mongoose";

const videoSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
});

const Video = mongoose.model("Video", videoSchema);

export default Video;
