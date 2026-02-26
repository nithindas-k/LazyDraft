import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/User";

dotenv.config();

const router = Router();

function getFrontendUrl(): string {
    const configured = (process.env.FRONTEND_URL || "").trim();
    if (configured) return configured.replace(/\/+$/, "");
    return "http://localhost:5175";
}

async function resolveAuthenticatedUser(req: any) {
    // Session auth (passport)
    if (req.isAuthenticated?.() && req.user?._id) {
        return User.findById(req.user._id);
    }

    // JWT auth (Bearer token)
    const authHeader = req.headers?.authorization as string | undefined;
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(
                token,
                process.env.NEXTAUTH_SECRET || "fallback_secret"
            ) as { id?: string; email?: string };

            if (decoded?.id) {
                const byId = await User.findById(decoded.id);
                if (byId) return byId;
            }
            if (decoded?.email) {
                return User.findOne({ email: decoded.email });
            }
        } catch {
            return null;
        }
    }

    return null;
}


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
        failureRedirect: `${getFrontendUrl()}/login?error=true`,
        session: true
    }),
    (req: any, res) => {

        const token = jwt.sign(
            { id: req.user?._id, email: req.user?.email },
            process.env.NEXTAUTH_SECRET || "fallback_secret",
            { expiresIn: "7d" }
        );

        const frontendUrl = getFrontendUrl();
        res.redirect(`${frontendUrl}/user/dashboard?token=${token}`);
    }
);


router.get("/me", async (req: any, res) => {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser?._id) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        const user = await User.findById(authUser._id).select("-refreshToken");
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

router.put("/me", async (req: any, res) => {
    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser?._id) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        const user = await User.findById(authUser._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.name = name.trim();
        await user.save();

        const updatedUser = await User.findById(authUser._id).select("-refreshToken");
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
