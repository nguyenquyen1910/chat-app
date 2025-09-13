import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import FacebookStrategy from "passport-facebook";
import User from "../models/userModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }
        const existingUser = await User.findOne({
          email: profile.emails[0].value,
        });
        if (existingUser) {
          existingUser.googleId = profile.id;
          existingUser.profilePic = profile.photos[0].value;
          await existingUser.save();
          return done(null, existingUser);
        }

        user = await User.create({
          googleId: profile.id,
          fullName: profile.displayName,
          email: profile.emails[0].value,
          profilePic: profile.photos[0].value,
          isVerify: true,
        });

        return done(null, user);
      } catch (error) {
        console.log("Google strategy error: ", error);
        return done(error, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "picture"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });
        if (user) {
          return done(null, user);
        }
        const email = profile.emails && profile.emails[0].value;
        if (email) {
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            existingUser.facebookId = profile.id;
            existingUser.profilePic = profile.photos[0].value;
            await existingUser.save();
            return done(null, existingUser);
          }
        }

        user = await User.create({
          facebookId: profile.id,
          fullName: `${profile.name.givenName} ${profile.name.familyName}`,
          email: email || `${profile.id}@facebook.com`,
          profilePic: profile.photos[0].value,
          isVerify: !!email,
        });

        return done(null, user);
      } catch (error) {
        console.log("Facebook strategy error: ", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
