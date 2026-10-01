import mongoose from 'mongoose'

const voterSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    candidateId: {
      type: String,
      required: true,
      index: true
    }
  },
  { timestamps: true }
)

export const Voter = mongoose.model('Voter', voterSchema)
