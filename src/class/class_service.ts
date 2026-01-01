import mongoose from "mongoose";
import { Class, IClass } from "../models/class";
import { User } from "../models/user";
import { CreateClassInput, UpdateClassInput } from "./class.schema";

export async function createClass(
    teacherId: string,
    data: CreateClassInput
): Promise<IClass> {
    const newClass = await Class.create({
        className: data.className,
        teacherId: new mongoose.Types.ObjectId(teacherId),
        studentIds: []
    });
    return newClass.toObject() as IClass;
}

export async function getAllClasses(): Promise<IClass[]> {
    const classes = await Class.find()
        .populate("teacherId", "name email")
        .populate("studentIds", "name email");
    return classes as unknown as IClass[];
}

export async function getClassById(classId: string): Promise<IClass | null> {
    const classDoc = await Class.findById(classId)
        .populate("teacherId", "name email")
        .populate("studentIds", "name email");
    return classDoc as unknown as IClass | null;
}

export async function getClassesByTeacher(teacherId: string): Promise<IClass[]> {
    const classes = await Class.find({ teacherId })
        .populate("teacherId", "name email")
        .populate("studentIds", "name email");
    return classes as unknown as IClass[];
}

export async function getClassesByStudent(studentId: string): Promise<IClass[]> {
    const classes = await Class.find({ studentIds: studentId })
        .populate("teacherId", "name email")
        .populate("studentIds", "name email");
    return classes as unknown as IClass[];
}

export async function updateClass(
    classId: string,
    teacherId: string,
    data: UpdateClassInput
): Promise<IClass | null> {
    const classDoc = await Class.findOneAndUpdate(
        { _id: classId, teacherId },
        { $set: { ...data, updatedAt: new Date() } },
        { new: true }
    ).populate("teacherId", "name email")
     .populate("studentIds", "name email");
    return classDoc as unknown as IClass | null;
}

export async function deleteClass(
    classId: string,
    teacherId: string
): Promise<boolean> {
    const result = await Class.deleteOne({ _id: classId, teacherId });
    return result.deletedCount > 0;
}

export async function addStudentToClass(
    classId: string,
    teacherId: string,
    studentId: string
): Promise<IClass | null> {
    // Verify student exists and is a student
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
        throw new Error("Student not found");
    }

    const classDoc = await Class.findOneAndUpdate(
        { _id: classId, teacherId },
        { $addToSet: { studentIds: new mongoose.Types.ObjectId(studentId) } },
        { new: true }
    ).populate("teacherId", "name email")
     .populate("studentIds", "name email");
    return classDoc as unknown as IClass | null;
}

export async function removeStudentFromClass(
    classId: string,
    teacherId: string,
    studentId: string
): Promise<IClass | null> {
    const classDoc = await Class.findOneAndUpdate(
        { _id: classId, teacherId },
        { $pull: { studentIds: new mongoose.Types.ObjectId(studentId) } },
        { new: true }
    ).populate("teacherId", "name email")
     .populate("studentIds", "name email");
    return classDoc as unknown as IClass | null;
}
