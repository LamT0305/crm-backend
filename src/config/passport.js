import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import UserModel from "../model/UserModel.js";
import { setUserCredentials } from "./gmailConfig.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      // console.log("🔑 Access Token:", accessToken);
      // console.log("🔄 Refresh Token:", refreshToken);
      // console.log("👤 User Profile:", profile);

      try {
        let user = await UserModel.findOne({ googleId: profile.id });

        if (!user) {
          user = new UserModel({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            userName: profile.emails[0].value.split("@")[0],
            refreshToken: refreshToken,
            accessToken: accessToken,
            hasCompletedOnboarding: false,
          });

          await user.save();
        } else {
          await UserModel.updateOne(
            { googleId: profile.id },
            {
              refreshToken: refreshToken,
              accessToken: accessToken,
            },
            { upsert: true }
          );
        }

        setUserCredentials(user.refreshToken);

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser((id, done) => {
  done(null, { id });
});

export default passport;
