const mongoose = require("mongoose");

const prSchema = new mongoose.Schema({
  id: Number,
  number: Number,
  title: String,
  state: String,
  status: String,
  created_at: Date,
  updated_at: Date,
  merged: Boolean,
  merged_at: Date,
  html_url: String,
  repo: String,
});

const pullRequestDataSchema = new mongoose.Schema({
  total: Number,
  open: Number,
  closed: Number,
  avgMergeTime: Number,
});

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: String,
  displayName: String,
  avatar: String,
  email: String,
  accessToken: String,
  isoc_id: { type: String, unique: true },
  ongoingprojects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Repo" }],
  joinedAt: Date,
  followers: Number,
  following: Number,
  pullRequests: [prSchema],
  pullRequestData: pullRequestDataSchema,
  points: { type: Number, default: 0 },

  pointsAssigned: [
    {
      prUrl: String,
      prTitle: String,
      points: Number,
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
