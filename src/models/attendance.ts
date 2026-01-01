import mongoose from "mongoose";

export interface IAttendance {
    classId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    status: 'present' | 'absent';
    createdAt: Date;
    updatedAt: Date;
}

const attendanceSchema = new mongoose.Schema<IAttendance>({
    classId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Class" },
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    status: { type: String, enum: ['present', 'absent'], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);