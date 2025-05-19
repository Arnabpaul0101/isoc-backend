const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Repo = require("../../models/Repo");
const PRPoints = require("../../models/PRpoints");

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

// Save points for PR
router.post("/points/assign", async (req, res) => {
  const { prId, username, prTitle, points } = req.body;

  if (!prId || !username || !prTitle) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existing = await PRPoints.findOne({ prId });

    if (existing && existing.assigned) {
      return res
        .status(400)
        .json({ error: "Points already assigned for this PR" });
    }

    const updated = await PRPoints.findOneAndUpdate(
      { prId },
      {
        prId,
        username,
        prTitle,
        points,
        assigned: true,
      },
      { upsert: true, new: true }
    );

    // Update user's points
    const user = await User.findOne({ username });
    if (user) {
      user.points = (user.points || 0) + points;
      await user.save();
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Error assigning points:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
