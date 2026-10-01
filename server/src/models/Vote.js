import mongoose from 'mongoose'

const voteSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    votes: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
)

export const Vote = mongoose.model('Vote', voteSchema)
