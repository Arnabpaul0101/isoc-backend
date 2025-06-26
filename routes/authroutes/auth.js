// routes/authroutes/auth.js - Updated auth routes
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
    failureRedirect: "https://www.ieeesoc.xyz/login?error=auth_failed",
    session: true,
  }),
  async (req, res) => {
    console.log("=== CALLBACK SUCCESS ===");
    console.log("Session ID:", req.sessionID);
    console.log("User authenticated:", req.isAuthenticated());
    console.log("User:", req.user);
    
    try {
      // Ensure session is saved before redirect
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully");
            resolve();
          }
        });
      });

      // Add a small delay to ensure session propagation
      setTimeout(() => {
        console.log("Redirecting to dashboard");
        res.redirect("https://www.ieeesoc.xyz/dashboard?auth=success");
      }, 500);
      
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect("https://www.ieeesoc.xyz/login?error=session_failed");
    }
  }
);

// Logout
router.get("/logout", (req, res) => {
  console.log("Logout initiated for session:", req.sessionID);
  
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      
      // Clear session cookie
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "none",
        secure: true
      });
      
      console.log("User logged out successfully");
      res.redirect("https://www.ieeesoc.xyz/repos"); 
    });
  });
});

// Auth status check with enhanced debugging
router.get("/status", (req, res) => {
  console.log("=== AUTH STATUS CHECK ===");
  console.log("Session ID:", req.sessionID);
  console.log("Has cookies:", !!req.headers.cookie);
  console.log("Cookie header:", req.headers.cookie);
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("Session passport:", req.session?.passport);
  console.log("User object:", req.user);
  console.log("========================");

  // Ensure CORS headers are set
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.get('Origin') || 'https://www.ieeesoc.xyz');

  const responseData = {
    loggedIn: req.isAuthenticated(),
    user: req.user || null,
    debug: {
      sessionId: req.sessionID,
      hasCookies: !!req.headers.cookie,
      sessionExists: !!req.session,
      passportUser: req.session?.passport?.user,
      authenticated: req.isAuthenticated(),
      timestamp: new Date().toISOString()
    }
  };

  res.json(responseData);
});

// Test endpoint to check session functionality
router.get("/test-session", (req, res) => {
  req.session.testValue = Date.now();
  req.session.save((err) => {
    if (err) {
      console.error("Test session save error:", err);
      res.json({ error: "Session save failed", details: err.message });
    } else {
      res.json({ 
        message: "Test session created", 
        sessionId: req.sessionID,
        testValue: req.session.testValue,
        cookies: req.headers.cookie
      });
    }
  });
});

module.exports = router;