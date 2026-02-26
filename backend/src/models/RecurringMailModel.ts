import mongoose, { Document, Schema } from "mongoose";

export interface IRecurringMailDocument extends Document {
    userId: string;
    name: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    content: string;
    daysOfWeek: number[];
    timeOfDay: string;
    timezone: string;
    isActive: boolean;
    lastSentAt?: Date;
    nextRunAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const RecurringMailSchema = new Schema<IRecurringMailDocument>(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        from: { type: String, required: true },
        to: [{ type: String, required: true }],
        cc: [{ type: String }],
        bcc: [{ type: String }],
        subject: { type: String, required: true },
        content: { type: String, required: true },
        daysOfWeek: [{ type: Number, required: true }],
        timeOfDay: { type: String, required: true },
        timezone: { type: String, required: true },
        isActive: { type: Boolean, default: true, index: true },
        lastSentAt: { type: Date },
        nextRunAt: { type: Date, required: true, index: true },
    },
    { timestamps: true }
);

export const RecurringMail = mongoose.model<IRecurringMailDocument>("RecurringMail", RecurringMailSchema);
