import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { MailRoutes } from "./routes/mail.routes";
import { MailController } from "./controllers/mail.controller";
import { MailService } from "./services/mail.service";
import { GroqAIService } from "./services/ai.service";
import { MongoMailRepository } from "./repositories/mail.repository";
import { MongoTemplateRepository } from "./repositories/template.repository";
import { MongoRecurringMailRepository } from "./repositories/recurring-mail.repository";
import { GmailVendor } from "./vendors/GmailVendor";

import passport from "./config/passport";
import authRoutes from "./routes/auth.routes";
import session from "express-session";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: ["http://localhost:5175", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express.json());

app.use(
    session({
        secret: process.env.NEXTAUTH_SECRET || "default_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

const mailRepository = new MongoMailRepository();
const templateRepository = new MongoTemplateRepository();
const recurringMailRepository = new MongoRecurringMailRepository();
const aiService = new GroqAIService();
const emailVendor = new GmailVendor();
const mailService = new MailService(mailRepository, aiService, emailVendor, templateRepository, recurringMailRepository);
const mailController = new MailController(mailService);
const mailRoutes = new MailRoutes(mailController);

app.use("/api/v1", mailRoutes.router);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("LazyDraft API is running...");
});

const PORT = process.env.PORT || 5000;

// Process due scheduled emails frequently for near-time delivery.
setInterval(() => {
    mailService.processScheduledEmails().catch((err) => {
        console.error("Scheduled email processing error:", err?.message || err);
    });
}, 15 * 1000);

// Process recurring mails.
setInterval(() => {
    mailService.processRecurringMails().catch((err) => {
        console.error("Recurring email processing error:", err?.message || err);
    });
}, 15 * 1000);

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export default app;
