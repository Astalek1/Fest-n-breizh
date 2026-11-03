import mongoose from 'mongoose'

const visitSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0,
  },
})

const Visit = mongoose.model('Visit', visitSchema)

export default Visit
