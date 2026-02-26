import mongoose, { Document, Schema } from "mongoose";

export interface IMailDocument extends Document {
    userId: string;
    from: string;
    to: string;
    subject: string;
    content: string;
    status: "SENT" | "FAILED" | "PENDING";
    createdAt: Date;
}

const MailSchema = new Schema<IMailDocument>({
    userId: { type: String, required: true, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["SENT", "FAILED", "PENDING"], default: "PENDING" },
    createdAt: { type: Date, default: Date.now },
});

export const Mail = mongoose.model<IMailDocument>("Mail", MailSchema);
