const express = require("express");
const passport = require("passport");

const router = express.Router();


router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["read:user", "user:email", "read:org"], 
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
    res.redirect("https://www.ieeesoc.xyz/dashboard"); 
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
        secure: false, 
      });
      res.redirect("https://www.ieeesoc.xyz/repos"); 
    });
  });
});

// Auth status check
router.get("/status", (req, res) => {
   console.log("=== STATUS CHECK ===");
  console.log("Headers:", req.headers);
  console.log("Cookies:", req.headers.cookie);
  console.log("Session ID:", req.sessionID);
  console.log("Is Authenticated:", req.isAuthenticated());
  console.log("User:", req.user);
  console.log("===================");
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false });
  }
});



module.exports = router;
