import express from 'express';
import dotenv from 'dotenv';
import { connect } from './config/db';
import authRouter from './auth/authcontroller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

connect().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to connect to MongoDB:", err);
});
