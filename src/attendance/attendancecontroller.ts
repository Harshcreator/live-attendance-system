import { Router, Response } from "express";
import * as attendanceService from "./attendance_service";
import { authenticate, AuthRequest } from "../middleware/auth";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get attendance for a class (teacher only)
router.get(
    "/class/:classId",
    roleGuard("teacher"),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const isTeacher = await attendanceService.isTeacherOfClass(
                req.params.classId,
                req.user!._id.toString()
            );
            if (!isTeacher) {
                res.status(403).json({ message: "Not authorized to view this class" });
                return;
            }

            const records = await attendanceService.getAttendanceByClass(req.params.classId);
            res.status(200).json(records);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

// Get my attendance history (student only)
router.get(
    "/my",
    roleGuard("student"),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const records = await attendanceService.getAttendanceByStudent(
                req.user!._id.toString()
            );
            res.status(200).json(records);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

export default router;
