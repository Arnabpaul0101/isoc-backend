const express = require("express");
const passport = require("passport");
const jwt = require('jsonwebtoken');
const router = express.Router();

// GitHub callback with JWT
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login-failed",
    session: false, // Disable session for JWT approach
  }),
  (req, res) => {
    console.log("=== CALLBACK SUCCESS (JWT) ===");
    console.log("User authenticated:", req.user);
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: req.user._id,
        githubId: req.user.githubId,
        username: req.user.username 
      },
      process.env.JWT_SECRET || process.env.SESSION_SECRET,
      { expiresIn: '24h' }
    );
    
    
    res.redirect(`https://www.ieeesoc.xyz/dashboard?token=${token}`);
  }
);

// JWT verification middleware
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token
  
  if (!token) {
    return res.status(401).json({ loggedIn: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ loggedIn: false, message: 'Invalid token' });
  }
};

// Status check with JWT
router.get("/status", async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log("=== JWT STATUS CHECK ===");
  console.log("Token received:", !!token);
  console.log("Headers:", req.headers.authorization);
  
  if (!token) {
    return res.json({ loggedIn: false });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    

    const User = require('../../models/User'); 
    const user = await User.findById(decoded.userId);
    
    if (user) {
      res.json({ loggedIn: true, user });
    } else {
      res.json({ loggedIn: false, message: 'User not found' });
    }
  } catch (error) {
    console.error("JWT verification failed:", error);
    res.json({ loggedIn: false, message: 'Invalid token' });
  }
});


router.get("/protected", verifyJWT, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

module.exports = router;