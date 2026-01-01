import { Router, Request, Response } from "express";
import { signupSchema, loginSchema } from "./auth.schema";
import * as authService from "./authservice";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/signup", async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = signupSchema.parse(req.body);
        const result = await authService.signup(validatedData);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === "ZodError") {
                res.status(400).json({ message: "Validation error", errors: error });
                return;
            }
            if (error.message === "Email already registered") {
                res.status(409).json({ message: error.message });
                return;
            }
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const result = await authService.login(validatedData);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === "ZodError") {
                res.status(400).json({ message: "Validation error", errors: error });
                return;
            }
            if (error.message === "Invalid email or password") {
                res.status(401).json({ message: error.message });
                return;
            }
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = await authService.me(req.user._id.toString());
        res.status(200).json({ user });
    } catch (error) {
        if (error instanceof Error && error.message === "User not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
