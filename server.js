// app.js - Fixed CORS configuration
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const app = express();
app.use(express.json());
const session = require("express-session");
const MongoStore = require('connect-mongo'); 
require("dotenv").config();

const configurePassport = require("./config/passport");
configurePassport(passport);

const allowedOrigins = [
  "http://ieeesoc.xyz",
  "https://ieeesoc.xyz",
  "http://www.ieeesoc.xyz",
  "https://www.ieeesoc.xyz",
];

// Fixed CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'Expires'
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  })
);

// Trust proxy - important for secure cookies behind reverse proxy
app.set('trust proxy', 1);

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
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600,
      ttl: 24 * 60 * 60
    }),
    cookie: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      domain: undefined
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Add middleware to log session info
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    sessionID: req.sessionID,
    authenticated: req.isAuthenticated(),
    hasCookies: !!req.headers.cookie
  });
  next();
});

app.use("/api/auth", require("./routes/authroutes/auth"));
app.use("/api/users", require("./routes/userroutes/userroute"));
app.use("/api/dashboard", require("./routes/userroutes/dashboard"));
app.use("/api/repos", require("./routes/reporoutes/reporoute"));
app.use("/api/admin-dashboard", require("./routes/reporoutes/admin-dashboard"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});