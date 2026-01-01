import { z } from "zod";

export const createClassSchema = z.object({
    className: z.string().min(2, "Class name must be at least 2 characters")
});

export const updateClassSchema = z.object({
    className: z.string().min(2, "Class name must be at least 2 characters").optional()
});

export const addStudentSchema = z.object({
    studentId: z.string().min(1, "Student ID is required")
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type AddStudentInput = z.infer<typeof addStudentSchema>;
