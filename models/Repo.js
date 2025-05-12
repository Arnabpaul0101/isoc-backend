const mongoose = require('mongoose');

const repoSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: String,
  shortDescription: String,
  longDescription: String,
  language: [String],
  stars: Number,
  forks: Number,
  url: String,
  image: String,
}, { timestamps: true });

module.exports = mongoose.model('Repo', repoSchema);
