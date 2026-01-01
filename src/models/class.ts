import mongoose from "mongoose";

export interface IClass {
    className: string;
    teacherId: mongoose.Types.ObjectId;
    studentIds: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const classSchema = new mongoose.Schema<IClass>({
    className: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Class = mongoose.model<IClass>("Class", classSchema);