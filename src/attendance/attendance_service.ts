import mongoose from "mongoose";
import { Attendance, IAttendance } from "../models/attendance";
import { Class } from "../models/class";

export interface AttendanceRecord {
    classId: string;
    studentId: string;
    status: "present" | "absent";
}

export async function markAttendance(
    record: AttendanceRecord
): Promise<IAttendance> {
    // Upsert: update if exists for same class+student, else create
    const attendance = await Attendance.findOneAndUpdate(
        {
            classId: new mongoose.Types.ObjectId(record.classId),
            studentId: new mongoose.Types.ObjectId(record.studentId)
        },
        {
            $set: {
                status: record.status,
                updatedAt: new Date()
            },
            $setOnInsert: {
                classId: new mongoose.Types.ObjectId(record.classId),
                studentId: new mongoose.Types.ObjectId(record.studentId),
                createdAt: new Date()
            }
        },
        { upsert: true, new: true }
    );
    return attendance.toObject() as IAttendance;
}

export async function markBulkAttendance(
    classId: string,
    records: { studentId: string; status: "present" | "absent" }[]
): Promise<IAttendance[]> {
    const results: IAttendance[] = [];
    for (const record of records) {
        const attendance = await markAttendance({
            classId,
            studentId: record.studentId,
            status: record.status
        });
        results.push(attendance);
    }
    return results;
}

export async function getAttendanceByClass(classId: string): Promise<IAttendance[]> {
    const records = await Attendance.find({ classId })
        .populate("studentId", "name email");
    return records as unknown as IAttendance[];
}

export async function getAttendanceByStudent(studentId: string): Promise<IAttendance[]> {
    const records = await Attendance.find({ studentId })
        .populate("classId", "className");
    return records as unknown as IAttendance[];
}

export async function getAttendanceByClassAndStudent(
    classId: string,
    studentId: string
): Promise<IAttendance | null> {
    const record = await Attendance.findOne({
        classId,
        studentId
    }).populate("studentId", "name email")
      .populate("classId", "className");
    return record as unknown as IAttendance | null;
}

export async function isStudentEnrolled(
    classId: string,
    studentId: string
): Promise<boolean> {
    const classDoc = await Class.findOne({
        _id: classId,
        studentIds: studentId
    });
    return !!classDoc;
}

export async function isTeacherOfClass(
    classId: string,
    teacherId: string
): Promise<boolean> {
    const classDoc = await Class.findOne({
        _id: classId,
        teacherId
    });
    return !!classDoc;
}
