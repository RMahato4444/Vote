import mongoose from 'mongoose'

const votingTimerSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'main',
      unique: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: 1
    },
    endAt: {
      type: Date,
      required: true
    },
    tysonInitialised: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

export const VotingTimer = mongoose.model('VotingTimer', votingTimerSchema)
