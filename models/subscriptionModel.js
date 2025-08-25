const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "Monthly", "Yearly", "Private 20 sessions"
    type: { type: String, enum: ['main', 'private'], required: true },
    durationDays: { type: Number }, // 30 for monthly, 365 for yearly
    totalSessions: { type: Number, default: 0 }, // only for private plans
    price: { type: Number, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

const SubscriptionPlan = mongoose.model(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
module.exports = SubscriptionPlan;
