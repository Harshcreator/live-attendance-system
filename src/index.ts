import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { connect } from './config/db';
import authRouter from './auth/authcontroller';
import classRouter from './class/classcontroller';
import attendanceRouter from './attendance/attendancecontroller';
import { setupWebSocket } from './attendance/websocket';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/classes', classRouter);
app.use('/api/attendance', attendanceRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup WebSocket
setupWebSocket(server);

connect().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`WebSocket available at ws://localhost:${PORT}`);
    });
}).catch((err: Error) => {
    console.error("Failed to connect to MongoDB:", err);
});
