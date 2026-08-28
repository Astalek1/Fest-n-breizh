import mongoose from 'mongoose'

const guestsSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  media: { type: String },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'logo'],
  },
  mediaFileId: { type: String },
  logo: { type: String },
  logoFileId: { type: String },
  mediaName: { type: String },
})
export default mongoose.model('Guests', guestsSchema)
