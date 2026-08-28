import mongoose from 'mongoose'

const gallerySchema = mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String }, // version large
  urlSmall: { type: String, required: true }, // version petite
  mediaFileId: { type: String }, // fileId de la version large
  mediaFileIdSmall: { type: String }, // fileId de la version petite
  caption: { type: String },
  type: { type: String, enum: ['photo', 'poster'], required: true },
  year: {
    type: Number,
    required: function () {
      return this.type === 'poster'
    },
  },
})

const Gallery = mongoose.model('Gallery', gallerySchema)
export default Gallery
