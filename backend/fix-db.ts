import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/User";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "");
        console.log("Connected to DB");
        const result = await User.updateMany({}, { $set: { isEmailVerified: true } });
        console.log(`Updated ${result.modifiedCount} users.`);
    } catch (error) {
        console.error("Error", error);
    } finally {
        mongoose.disconnect();
    }
};

run();
