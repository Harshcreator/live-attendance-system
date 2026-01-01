import mongoose from "mongoose";

export interface IUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: 'teacher' | 'student';
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'student'], default: 'student' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);