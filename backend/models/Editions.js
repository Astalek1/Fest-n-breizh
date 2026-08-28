import mongoose from 'mongoose'
import '../models/Artists.js'
import '../models/Guests.js'

const editionsSchema = mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number, required: true },
  description: { type: String },
  poster: { type: String, required: true },
  artists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }], // références
  guests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guest' }], // références
})
editionsSchema.index({ title: 1, year: 1 }, { unique: true })

const Edition = mongoose.model('Edition', editionsSchema)

export default Edition
