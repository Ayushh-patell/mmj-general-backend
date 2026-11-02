const mongoose = require('mongoose');

const RecoveryCodeSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
      trim: true
    },

    code_hash: {
      type: String, // varbinary(60) → string for hashed code
      required: true
    },

    expires_at: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: false // MySQL table didn't have created_at / updated_at
  }
);

module.exports = mongoose.model('RecoveryCode', RecoveryCodeSchema);
