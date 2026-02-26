import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { User } from "../models/User";

dotenv.config();

const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const GOOGLE_CALLBACK_URL = `${PUBLIC_API_URL}/api/auth/google/callback`;

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            callbackURL: GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    user = await User.create({
                        googleId: profile.id,
                        email: profile.emails?.[0].value || "",
                        name: profile.displayName,
                        profilePic: profile.photos?.[0].value || "",
                        refreshToken: refreshToken || "",
                        isEmailVerified: true,
                    });
                } else {
                    let isUpdated = false;
                    if (refreshToken && user.refreshToken !== refreshToken) {
                        user.refreshToken = refreshToken;
                        isUpdated = true;
                    }
                    // Retroactively auto-verify existing Google users if they somehow got stuck
                    if (!user.isEmailVerified) {
                        user.isEmailVerified = true;
                        isUpdated = true;
                    }

                    if (isUpdated) {
                        await user.save();
                    }
                }

                return done(null, user);
            } catch (error: any) {
                console.error("Error during Google Auth", error);
                return done(error, false);
            }
        }
    )
);


passport.serializeUser((user: any, done) => {
    done(null, user.id);
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
