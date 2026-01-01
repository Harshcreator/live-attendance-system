import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoURI = process.env.MONGODB_URI;

if(!mongoURI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
}

export const connect = async() => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");
    }
    catch(err) {
        console.error("Error connecting to MongoDB:", err);
        throw err;
    }
}