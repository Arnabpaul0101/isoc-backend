const express = require("express");
const passport = require("passport");

const router = express.Router();

// GitHub login - include 'repo' scope for access to public repos + commit stats
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["read:user", "user:email", "read:org"], // access to user email, org info, and public repos only
  })
);

// GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login-failed",
    session: true,
  }),
  (req, res) => {
    // Successful login
    res.redirect("https://www.ieeesoc.xyz/dashboard"); // replace with your frontend
  }
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false, // set to true in production with HTTPS
      });
      res.redirect("https://www.ieeesoc.xyz/repos"); // replace with your frontend
    });
  });
});

// Auth status check
router.get("/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false });
  }
});

module.exports = router;
