const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../../models/User");
const Repo = require("../../models/Repo");

// Auth middleware
const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.get("/:userId/dashboard", ensureAuth, async (req, res) => {
  console.log("Dashboard route hit");
  const { userId } = req.params;

  try {
    // Fetch all repos stored in DB
    const repos = await Repo.find({});
    console.log("Repos from DB:", repos.length);

    const user = await User.findById(userId);
    if (!user || !user.accessToken)
      return res.status(404).json({ message: "User not found" });

    const { username, accessToken } = user;
    const headers = {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "IEEE-SOC-App",
    };

    let allPRs = [];
    let mergedDurations = [];
    let detailedPRs = [];

    for (const repo of repos) {
      let repoUrl = repo.url;

      // Convert GitHub HTML URL to API URL
      if (repoUrl.startsWith("https://github.com/")) {
        const parts = repoUrl.replace("https://github.com/", "").split("/");
        if (parts.length >= 2) {
          const owner = parts[0];
          const name = parts[1];
          repoUrl = `https://api.github.com/repos/${owner}/${name}`;
          console.log("Converted repo URL:", repoUrl);
        } else {
          console.warn("Invalid GitHub HTML repo URL:", repo.url);
          continue;
        }
      }

      const match = repoUrl.match(/repos\/([^/]+)\/([^/]+)$/);
      if (!match) {
        console.warn("Unrecognized repo URL format:", repoUrl);
        continue;
      }
      const [_, owner, name] = match;

      const q = `repo:${owner}/${name} type:pr author:${username}`;
      let prPage = 1;

      while (true) {
        try {
          const resPR = await axios.get(
            "https://api.github.com/search/issues",
            {
              headers,
              params: { q, per_page: 100, page: prPage },
            }
          );

          const items = resPR.data.items.filter((item) => item.pull_request);
          if (items.length === 0) break;

          const repoPRs = items.map((item) => ({
            ...item,
            repoOwner: owner,
            repoName: name,
          }));
          allPRs.push(...repoPRs);
          prPage++;

          await sleep(300); // delay to avoid abuse detection
        } catch (err) {
          if (
            err.response?.status === 403 &&
            err.response.headers["x-ratelimit-remaining"] === "0"
          ) {
            const reset =
              parseInt(err.response.headers["x-ratelimit-reset"]) * 1000;
            const waitTime = reset - Date.now();
            console.warn(
              `Rate limit hit. Waiting ${Math.ceil(
                waitTime / 1000
              )}s before retrying...`
            );
            await sleep(waitTime + 1000); // extra 1s buffer
            continue; // retry same page
          }

          console.warn(
            `Error fetching PRs for ${owner}/${name}: ${err.message}`
          );
          break;
        }
      }

      for (const pr of allPRs.filter(
        (p) => p.repoOwner === owner && p.repoName === name
      )) {
        try {
          await sleep(300); // avoid burst request

          const prDetails = await axios.get(
            `https://api.github.com/repos/${owner}/${name}/pulls/${pr.number}`,
            { headers }
          );

          const prData = prDetails.data;
          if (prData.merged_at) {
            const created = new Date(prData.created_at);
            const merged = new Date(prData.merged_at);
            mergedDurations.push((merged - created) / (1000 * 60 * 60 * 24)); // days
          }

          detailedPRs.push({
            id: prData.id,
            number: prData.number,
            title: prData.title,
            state: prData.state,
            created_at: prData.created_at,
            updated_at: prData.updated_at,
            html_url: prData.html_url,
            status: prData.merged_at ? "merged" : prData.state,
            merged: !!prData.merged_at,
            merged_at: prData.merged_at,
            repo: `${owner}/${name}`,
          });
        } catch (err) {
          console.warn(
            `Failed to fetch PR #${pr.number} from ${owner}/${name}: ${err.response?.status} ${err.response?.statusText}`
          );
        }
      }
    }

    // PR Summary
    const pullRequestData = {
      total: detailedPRs.length,
      open: detailedPRs.filter((pr) => pr.state === "open").length,
      closed: detailedPRs.filter((pr) => pr.state === "closed").length,
      merged: detailedPRs.filter((pr) => pr.merged).length,
      avgMergeTime: mergedDurations.length
        ? mergedDurations.reduce((a, b) => a + b, 0) / mergedDurations.length
        : 0,
    };

    // Save to user (optional)
    await User.findByIdAndUpdate(userId, {
      pullRequests: detailedPRs,
      pullRequestData,
    });

    res.status(200).json({
      message: "Dashboard data loaded",
      pullRequestData,
      pullRequests: detailedPRs,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
