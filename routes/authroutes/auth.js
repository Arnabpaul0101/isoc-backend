
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
    console.log("=== CALLBACK SUCCESS ===");
    console.log("Session ID:", req.sessionID);
    console.log("User authenticated:", req.isAuthenticated());
    console.log("User:", req.user);
    console.log("Session data:", req.session);
    
   
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
      } else {
        console.log("Session saved successfully");
      }
      
      // Set additional cookie for testing
      res.cookie('auth-test', 'logged-in', {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        partitioned: true
      });
      
      console.log("========================");
      res.redirect("https://www.ieeesoc.xyz/dashboard"); 
    });
  }
);

// Test route to manually set session
router.get("/test-session", (req, res) => {
  req.session.test = "test-value";
  req.session.save((err) => {
    if (err) {
      console.error("Test session save error:", err);
      res.json({ error: "Session save failed" });
    } else {
      console.log("Test session saved");
      res.json({ 
        message: "Test session set", 
        sessionId: req.sessionID,
        sessionData: req.session
      });
    }
  });
});

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      
      // Clear both cookies
      res.clearCookie("sessionId", {
        path: "/",
        httpOnly: true,
        sameSite: "none",
        secure: true,
        partitioned: true
      });
      
      res.clearCookie("auth-test", {
        path: "/",
        httpOnly: true,
        sameSite: "none",
        secure: true,
        partitioned: true
      });
      
      res.redirect("https://www.ieeesoc.xyz/repos"); 
    });
  });
});

// Auth status check
router.get("/status", (req, res) => {
  console.log("=== DETAILED STATUS CHECK ===");
  console.log("Request headers:", JSON.stringify(req.headers, null, 2));
  console.log("Cookie header:", req.get('Cookie'));
  console.log("Session ID:", req.sessionID);
  console.log("Session data:", JSON.stringify(req.session, null, 2));
  console.log("Is Authenticated:", req.isAuthenticated());
  console.log("User:", req.user);
  console.log("==============================");

  // Set response headers to help with debugging
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.get('Origin') || 'https://www.ieeesoc.xyz');

  if (req.isAuthenticated()) {
    res.json({ 
      loggedIn: true, 
      user: req.user,
      sessionId: req.sessionID,
      debug: {
        hasCookies: !!req.get('Cookie'),
        sessionExists: !!req.session,
        authenticated: req.isAuthenticated()
      }
    });
  } else {
    res.json({ 
      loggedIn: false,
      sessionId: req.sessionID,
      debug: {
        hasCookies: !!req.get('Cookie'),
        sessionExists: !!req.session,
        authenticated: req.isAuthenticated()
      }
    });
  }
});

module.exports = router;