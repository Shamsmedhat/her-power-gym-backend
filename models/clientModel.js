const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    nationalId: { type: String, required: true, unique: true },
    clientId: { type: String, required: true, unique: true },

    // Main subscription (always required, snapshot of price)
    subscription: {
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true,
      },
      priceAtPurchase: { type: Number, required: true }, // frozen price
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },

    // Optional private training plan
    privatePlan: {
      plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' }, // private plan ref
      coach: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // must be coach
      totalSessions: { type: Number },
      sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
      priceAtPurchase: { type: Number }, // snapshot of private plan price
    },
  },
  { timestamps: true }
);

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
