import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../middleware/auth";
import * as attendanceService from "./attendance_service";

interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    userRole?: "teacher" | "student";
    userName?: string;
}

interface ActiveSession {
    classId: string;
    teacherId: string;
    startedAt: Date;
    presentStudents: Set<string>;
}

// Single active session state (only ONE class session at a time)
let activeSession: ActiveSession | null = null;

// Track all connected clients
const clients = new Set<AuthenticatedWebSocket>();

// Message types
type IncomingMessage =
    | { type: "start_session"; classId: string }
    | { type: "end_session" }
    | { type: "mark_present" }
    | { type: "get_status" };

type OutgoingMessage =
    | { type: "session_started"; classId: string; teacherId: string }
    | { type: "session_ended"; classId: string; attendanceCount: number }
    | { type: "student_marked"; studentId: string; studentName?: string }
    | { type: "attendance_confirmed"; classId: string }
    | { type: "session_status"; active: boolean; classId?: string; presentCount?: number }
    | { type: "error"; message: string }
    | { type: "connected"; userId: string; role: string };

function broadcast(message: OutgoingMessage, exclude?: AuthenticatedWebSocket): void {
    const data = JSON.stringify(message);
    clients.forEach((client) => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

function sendTo(client: AuthenticatedWebSocket, message: OutgoingMessage): void {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
    }
}

async function handleMessage(
    ws: AuthenticatedWebSocket,
    message: IncomingMessage
): Promise<void> {
    switch (message.type) {
        case "start_session": {
            // Only teachers can start a session
            if (ws.userRole !== "teacher") {
                sendTo(ws, { type: "error", message: "Only teachers can start sessions" });
                return;
            }

            // Check if a session is already active
            if (activeSession) {
                sendTo(ws, { type: "error", message: "A session is already active" });
                return;
            }

            // Verify teacher owns this class
            const isTeacher = await attendanceService.isTeacherOfClass(
                message.classId,
                ws.userId!
            );
            if (!isTeacher) {
                sendTo(ws, { type: "error", message: "You are not the teacher of this class" });
                return;
            }

            // Start new session
            activeSession = {
                classId: message.classId,
                teacherId: ws.userId!,
                startedAt: new Date(),
                presentStudents: new Set()
            };

            broadcast({
                type: "session_started",
                classId: message.classId,
                teacherId: ws.userId!
            });
            break;
        }

        case "end_session": {
            // Only the teacher who started can end
            if (!activeSession) {
                sendTo(ws, { type: "error", message: "No active session" });
                return;
            }

            if (ws.userId !== activeSession.teacherId) {
                sendTo(ws, { type: "error", message: "Only the session teacher can end it" });
                return;
            }

            // Persist attendance to MongoDB
            const presentStudentIds = Array.from(activeSession.presentStudents);
            for (const studentId of presentStudentIds) {
                await attendanceService.markAttendance({
                    classId: activeSession.classId,
                    studentId,
                    status: "present"
                });
            }

            const attendanceCount = presentStudentIds.length;
            const classId = activeSession.classId;

            // Clear session
            activeSession = null;

            broadcast({
                type: "session_ended",
                classId,
                attendanceCount
            });
            break;
        }

        case "mark_present": {
            // Only students can mark themselves present
            if (ws.userRole !== "student") {
                sendTo(ws, { type: "error", message: "Only students can mark attendance" });
                return;
            }

            if (!activeSession) {
                sendTo(ws, { type: "error", message: "No active session" });
                return;
            }

            // Check if student is enrolled in the class
            const isEnrolled = await attendanceService.isStudentEnrolled(
                activeSession.classId,
                ws.userId!
            );
            if (!isEnrolled) {
                sendTo(ws, { type: "error", message: "You are not enrolled in this class" });
                return;
            }

            // Mark student as present
            activeSession.presentStudents.add(ws.userId!);

            // Confirm to student
            sendTo(ws, {
                type: "attendance_confirmed",
                classId: activeSession.classId
            });

            // Broadcast to all (teacher sees real-time updates)
            broadcast({
                type: "student_marked",
                studentId: ws.userId!,
                studentName: ws.userName
            }, ws);
            break;
        }

        case "get_status": {
            sendTo(ws, {
                type: "session_status",
                active: !!activeSession,
                classId: activeSession?.classId,
                presentCount: activeSession?.presentStudents.size
            });
            break;
        }
    }
}

export function setupWebSocket(server: Server): WebSocketServer {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
        // Authenticate via query parameter token
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
            ws.close(4001, "No token provided");
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            ws.close(4002, "Server configuration error");
            return;
        }

        try {
            const decoded = jwt.verify(token, secret) as JwtPayload & { name?: string };
            ws.userId = decoded.userId;
            ws.userRole = decoded.role;
            ws.userName = decoded.name;
        } catch (error) {
            ws.close(4003, "Invalid token");
            return;
        }

        // Add to connected clients
        clients.add(ws);

        // Send connection confirmation
        sendTo(ws, {
            type: "connected",
            userId: ws.userId!,
            role: ws.userRole!
        });

        // If session is active, notify new client
        if (activeSession) {
            sendTo(ws, {
                type: "session_status",
                active: true,
                classId: activeSession.classId,
                presentCount: activeSession.presentStudents.size
            });
        }

        ws.on("message", async (data) => {
            try {
                const message = JSON.parse(data.toString()) as IncomingMessage;
                await handleMessage(ws, message);
            } catch (error) {
                sendTo(ws, { type: "error", message: "Invalid message format" });
            }
        });

        ws.on("close", () => {
            clients.delete(ws);
        });

        ws.on("error", () => {
            clients.delete(ws);
        });
    });

    return wss;
}

// Export for testing/monitoring
export function getActiveSession(): ActiveSession | null {
    return activeSession;
}

export function getConnectedClientsCount(): number {
    return clients.size;
}
