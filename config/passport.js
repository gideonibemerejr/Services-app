const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOne({ 'googleId': profile.id }, (err, user) => {
        if (err) return cb(err);
        if (user) {
          if (!user.avatar) {
            user.avatar = profile.photos[0].value;
            user.save(err => {
              return cb(null, user);
            });
          } else {
            return cb(null, user);
          }
        } else {
          // here we should have a NEW user via OAuth!
          let newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0].value
          });
          newUser.save(err => {
            if (err) return cb(err);
            return cb(null, newUser);
          });
        }
      });
    }
  )
);
passport.use(
  new LocalStrategy(
    {
      usernameField: 'name'
    },
    function (name, password, done) {
      User.findOne({ name: name }, function (err, user) {
        if (err) return done(err);
        if (!user) {
          return done(null, false, { message: 'Incorrect Username' });
        }
        user.comparePassword(password, function (err, res) {
          if (err) {
            return done(err);
          }
          if (!res) {
            return done(null, false);
          }
          return done(null, user);
        })
      });
    }
  )
);



passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
