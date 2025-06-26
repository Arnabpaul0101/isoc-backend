
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

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600 
    }),
    cookie: {
      sameSite: 'None',
      secure: true, 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, 
      // domain: '.ieeesoc.xyz' 
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", require("./routes/authroutes/auth"));
app.use("/api/users", require("./routes/userroutes/userroute"));
app.use("/api/dashboard", require("./routes/userroutes/dashboard"));
app.use("/api/repos", require("./routes/reporoutes/reporoute"));
app.use("/api/admin-dashboard", require("./routes/reporoutes/admin-dashboard"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});