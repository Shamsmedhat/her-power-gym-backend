const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['super admin', 'admin', 'coach'],
      required: true,
    },
    userId: { type: String, required: true, unique: true },

    // Coach-specific fields (optional)
    salary: {
      type: Number,
      required: function () {
        return this.role === 'coach';
      },
    },
    clients: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Client',
      default: undefined,
    },
    daysOff: {
      type: [String],
      default: undefined,
    },
    daysOffHistory: [
      {
        daysOff: [String],
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Password reset fields
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
