import mongoose, { Document, Schema } from "mongoose";

export interface IMailDocument extends Document {
    userId: string;
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    content: string;
    status: "SENT" | "FAILED" | "PENDING";
    tone?: string;
    language?: string;
    openedAt?: Date;
    repliedAt?: Date;
    createdAt: Date;
}

const MailSchema = new Schema<IMailDocument>({
    userId: { type: String, required: true, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    cc: { type: String },
    bcc: { type: String },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["SENT", "FAILED", "PENDING"], default: "PENDING" },
    tone: { type: String },
    language: { type: String },
    openedAt: { type: Date },
    repliedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

export const Mail = mongoose.model<IMailDocument>("Mail", MailSchema);
