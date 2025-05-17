const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Repo = require("../../models/Repo");

// Contribute to a repo
router.post("/:userId/contribute", async (req, res) => {
  console.log("Contribute route hit");
  const { userId } = req.params;
  const { repoId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.ongoingprojects.includes(repoId)) {
      return res
        .status(400)
        .json({ message: "Repo already in ongoing projects" });
    }

    if (user.ongoingprojects.length >= 5) {
      return res
        .status(400)
        .json({ message: "You can only contribute to 5 projects at a time." });
    }

    user.ongoingprojects.push(repoId);
    await user.save();

    res.status(200).json({ message: "Repo added to ongoing projects" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users
router.get("/allUserdata", async (req, res) => {
  try {
    const users = await User.find({})
      .populate("pullRequestData", "total open closed")
      .exec();
    res.status(200).json({
      success: true,
      message: "All user data fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
      error: error.message,
    });
  }
});

// Get repos for user
router.get("/:userId/repos", async (req, res) => {
  const { userId } = req.params;
  console.log("GET /:userId/repos hit");

  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const user = await User.findById(userId).populate("ongoingprojects");

    if (!user) return res.status(404).json({ error: "User not found" });

    console.log("User ongoing projects:", user.ongoingprojects);
    res.json({ ongoingprojects: user.ongoingprojects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Remove repo from ongoing projects
router.delete("/:userId/repos/:repoId", async (req, res) => {
  const { userId, repoId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.ongoingprojects = user.ongoingprojects.filter(
      (project) => project.toString() !== repoId
    );

    await user.save();

    res.status(200).json({ message: "Repo removed from ongoing projects" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user points and record assigned PR
router.patch("/:username/points", async (req, res) => {
  const { username } = req.params;
  const { points, prUrl, prTitle } = req.body;

  if (
    typeof points !== "number" ||
    !Number.isInteger(points) ||
    points < 0 ||
    !prUrl ||
    !prTitle
  ) {
    return res.status(400).json({
      message:
        "Invalid request. Must include non-negative integer points, prUrl, and prTitle.",
    });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.points += points;

    // Save points assignment for PR
    user.pointsAssigned.push({ prUrl, prTitle, points });

    await user.save();

    res.status(200).json({ message: "Points updated and PR tracked", user });
  } catch (err) {
    console.error("Error updating points:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
