require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
require("./db/conn");
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userdb = require("./model/userSchema");

const clientid =
  "516080705407-1vb97t7qn0lu1v0ivp7dap7rvha0ritr.apps.googleusercontent.com";
const clientsecret = "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";

app.use(
  cors({
    origin: "https://login-with-google-client.vercel.app/",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.json());

// setup session
app.use(
  session({
    secret: "123456!@#$%^",
    resave: false,
    saveUninitialized: true,
  })
);

// setuppassport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new OAuth2Strategy(
    {
      clientID: clientid,
      clientSecret: clientsecret,
      callbackURL:
        "https://login-with-google-server.vercel.app/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userdb.findOne({ googleId: profile.id });

        if (!user) {
          user = new userdb({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            image: profile.photos[0].value,
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// initial google ouath login
app.get(
  "https://login-with-google-client.vercel.app//auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "https://login-with-google-client.vercel.app//auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "https://login-with-google-client.vercel.app/dashboard",
    failureRedirect: "https://login-with-google-client.vercel.app/login",
  })
);

app.get("/login/sucess", async (req, res) => {
  if (req.user) {
    res.status(200).json({ message: "user Login", user: req.user });
  } else {
    res.status(400).json({ message: "Not Authorized" });
  }
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("https://login-with-google-client.vercel.app/");
  });
});

app.listen(6005, () => {
  console.log(`server start at port no`);
});
