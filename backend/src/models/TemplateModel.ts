// Template model — stores reusable email templates per user
import mongoose, { Document, Schema } from "mongoose";

export interface ITemplateDocument extends Document {
    userId: string;
    name: string;
    to: string;
    subject: string;
    body: string;
    createdAt: Date;
}

const TemplateSchema = new Schema<ITemplateDocument>({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    to: { type: String, default: "" },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});

export const Template = mongoose.model<ITemplateDocument>("Template", TemplateSchema);
