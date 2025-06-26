// backend/server.js - Complete fix

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const app = express();
const session = require("express-session");
const MongoStore = require('connect-mongo'); 
require("dotenv").config();

const configurePassport = require("./config/passport");
configurePassport(passport);

// Trust proxy (important for Render/Heroku)
app.set('trust proxy', 1);

const allowedOrigins = [
  "http://ieeesoc.xyz",
  "https://ieeesoc.xyz",
  "http://www.ieeesoc.xyz",
  "https://www.ieeesoc.xyz",
];

// CORS configuration - must be before session
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
  })
);

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    name: 'sessionId', // Custom session name
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600,
      collectionName: 'sessions'
    }),
    cookie: {
      sameSite: 'none', // lowercase 'none'
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      partitioned: true // Add this for Chrome
    }
  })
);

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Origin:', req.get('Origin'));
  console.log('Cookies:', req.get('Cookie'));
  console.log('Session ID:', req.sessionID);
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", require("./routes/authroutes/auth"));
app.use("/api/users", require("./routes/userroutes/userroute"));
app.use("/api/dashboard", require("./routes/userroutes/dashboard"));
app.use("/api/repos", require("./routes/reporoutes/reporoute"));
app.use("/api/admin-dashboard", require("./routes/reporoutes/admin-dashboard"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});