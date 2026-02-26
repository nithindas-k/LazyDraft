import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    googleId: string;
    email: string;
    name: string;
    profilePic?: string;
    refreshToken?: string;
    isEmailVerified: boolean;
    verificationToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        googleId: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        profilePic: { type: String },
        refreshToken: { type: String },
        isEmailVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
