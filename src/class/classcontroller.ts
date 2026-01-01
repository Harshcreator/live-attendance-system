import { Router, Response } from "express";
import { createClassSchema, updateClassSchema, addStudentSchema } from "./class.schema";
import * as classService from "./class_service";
import { authenticate, AuthRequest } from "../middleware/auth";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new class (teacher only)
router.post(
    "/",
    roleGuard("teacher"),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const validatedData = createClassSchema.parse(req.body);
            const newClass = await classService.createClass(
                req.user!._id.toString(),
                validatedData
            );
            res.status(201).json(newClass);
        } catch (error) {
            if (error instanceof Error && error.name === "ZodError") {
                res.status(400).json({ message: "Validation error", errors: error });
                return;
            }
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

// Get all classes
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const classes = await classService.getAllClasses();
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get my classes (teacher sees their classes, student sees enrolled classes)
router.get("/my", async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id.toString();
        const classes = req.user!.role === "teacher"
            ? await classService.getClassesByTeacher(userId)
            : await classService.getClassesByStudent(userId);
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get class by ID
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const classDoc = await classService.getClassById(req.params.id);
        if (!classDoc) {
            res.status(404).json({ message: "Class not found" });
            return;
        }
        res.status(200).json(classDoc);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update a class (teacher only, must own the class)
router.put(
    "/:id",
    roleGuard("teacher"),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const validatedData = updateClassSchema.parse(req.body);
            const updatedClass = await classService.updateClass(
                req.params.id,
                req.user!._id.toString(),
                validatedData
            );
            if (!updatedClass) {
                res.status(404).json({ message: "Class not found or not authorized" });
                return;
            }
            res.status(200).json(updatedClass);
        } catch (error) {
            if (error instanceof Error && error.name === "ZodError") {
                res.status(400).json({ message: "Validation error", errors: error });
                return;
            }
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

// Delete a class (teacher only, must own the class)
router.delete(
    "/:id",
    roleGuard("teacher"),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const deleted = await classService.deleteClass(
                req.params.id,
                req.user!._id.toString()
            );
            if (!deleted) {
                res.status(404).json({ message: "Class not found or not authorized" });
                return;
            }
            res.status(200).json({ message: "Class deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

// Add student to class (teacher only)
router.post(
    "/:id/students",
    roleGuard("teacher"),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const validatedData = addStudentSchema.parse(req.body);
            const updatedClass = await classService.addStudentToClass(
                req.params.id,
                req.user!._id.toString(),
                validatedData.studentId
            );
            if (!updatedClass) {
                res.status(404).json({ message: "Class not found or not authorized" });
                return;
            }
            res.status(200).json(updatedClass);
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === "ZodError") {
                    res.status(400).json({ message: "Validation error", errors: error });
                    return;
                }
                if (error.message === "Student not found") {
                    res.status(404).json({ message: error.message });
                    return;
                }
            }
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

// Remove student from class (teacher only)
router.delete(
    "/:id/students/:studentId",
    roleGuard("teacher"),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const updatedClass = await classService.removeStudentFromClass(
                req.params.id,
                req.user!._id.toString(),
                req.params.studentId
            );
            if (!updatedClass) {
                res.status(404).json({ message: "Class not found or not authorized" });
                return;
            }
            res.status(200).json(updatedClass);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

export default router;
