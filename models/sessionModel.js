const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'canceled'],
      default: 'pending',
    },
    notes: { type: String },
    statusChangeHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'completed', 'canceled'],
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        reason: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
