const express = require("express");
const router = express.Router();
const Repo = require("../../models/Repo");

router.get("/", async (req, res) => {
  try {
    const repos = await Repo.find({});
    // console.log(repos);
    res.json(repos);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching repos." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const repo = await Repo.findOne({ id: parseInt(req.params.id) });
    if (!repo) return res.status(404).json({ message: "Repository not found." });
    res.json(repo);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching the repo." });
  }
});

module.exports = router;
