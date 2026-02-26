import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/User";

dotenv.config();

const router = Router();

const FRONTEND_URL = process.env.NODE_ENV === "production"
    ? "https://lazydraft.com"
    : process.env.FRONTEND_URL || "http://localhost:5175";


router.get(
    "/google",
    passport.authenticate("google", {
        scope: [
            "profile",
            "email",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly",
        ],
        accessType: 'offline',
        prompt: 'consent'
    })
);

// Google OAuth Callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${FRONTEND_URL}/login?error=true`,
        session: true
    }),
    (req: any, res) => {

        const token = jwt.sign(
            { id: req.user?._id, email: req.user?.email },
            process.env.NEXTAUTH_SECRET || "fallback_secret",
            { expiresIn: "7d" }
        );


        res.redirect(`${FRONTEND_URL}/user/dashboard?token=${token}`);
    }
);


router.get("/me", async (req: any, res) => {
    if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        const user = await User.findById(req.user._id).select("-refreshToken");
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

router.put("/me", async (req: any, res) => {
    if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.name = name.trim();
        await user.save();

        const updatedUser = await User.findById(req.user._id).select("-refreshToken");
        return res.status(200).json({ success: true, user: updatedUser, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});


router.post("/logout", (req: any, res) => {
    req.logout((err: any) => {
        if (err) return res.status(500).json({ success: false, message: "Logout failed" });
        req.session = null;
        res.status(200).json({ success: true, message: "Logged out successfully" });
    });
});

router.post("/verify-email", async (req: any, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Verification token is required" });
        }

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        user.isEmailVerified = true;
        user.verificationToken = undefined;
        await user.save();

        return res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("Email verification error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
