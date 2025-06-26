const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const app = express();
app.use(express.json());
const session = require("express-session");
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
    origin: true,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: 'None', // required for cross-origin
      secure: true      // required when sameSite is 'None'
    }
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
