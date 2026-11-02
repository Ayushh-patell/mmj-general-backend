// src/models/Site.js
const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: String
  },
  {
    collection: 'sites',
    strict: false,
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.models.Site || mongoose.model('Site', siteSchema);