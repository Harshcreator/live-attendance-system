# Live Attendance System

A real-time attendance tracking system built with Node.js, Express, WebSocket, and MongoDB. Teachers can start live attendance sessions, and students can mark their presence in real-time.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-brightgreen)
![WebSocket](https://img.shields.io/badge/WebSocket-Enabled-orange)

## Features

- **Real-time Attendance**: WebSocket-based live attendance marking
- **Role-based Access**: Separate flows for teachers and students
- **JWT Authentication**: Secure token-based authentication
- **Class Management**: Create, update, and manage classes
- **Attendance History**: Track and view attendance records
- **Input Validation**: Request validation using Zod schemas

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Teacher   │    │   Student   │    │   Admin Dashboard   │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway Layer                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Express Server                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │ │
│  │  │   REST   │  │ WebSocket│  │   Auth   │  │   Health   │  │ │
│  │  │   APIs   │  │  Server  │  │Middleware│  │   Check    │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Auth Service │  │Class Service │  │ Attendance Service   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      MongoDB                               │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │ │
│  │  │  Users   │  │   Classes    │  │     Attendance        │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 7.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Harshcreator/live-attendance-system.git
   cd live-attendance-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/attendance
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   The server will be available at `http://localhost:3000`

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

#### Signup Request
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher"  // or "student"
}
```

#### Login Request
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher"
  }
}
```

### Classes

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/classes` | Get all classes | ✅ | Any |
| GET | `/api/classes/my` | Get my classes | ✅ | Any |
| GET | `/api/classes/:id` | Get class by ID | ✅ | Any |
| POST | `/api/classes` | Create new class | ✅ | Teacher |
| PUT | `/api/classes/:id` | Update class | ✅ | Teacher |
| DELETE | `/api/classes/:id` | Delete class | ✅ | Teacher |
| POST | `/api/classes/:id/students` | Add student to class | ✅ | Teacher |
| DELETE | `/api/classes/:id/students/:studentId` | Remove student | ✅ | Teacher |

#### Create Class Request
```json
{
  "className": "Mathematics 101"
}
```

#### Add Student Request
```json
{
  "studentId": "student_mongodb_id"
}
```

### Attendance

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/attendance/class/:classId` | Get class attendance | ✅ | Teacher |
| GET | `/api/attendance/my` | Get my attendance | ✅ | Student |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## 🔌 WebSocket API

Connect to the WebSocket server for real-time attendance:

```
ws://localhost:3000?token=<JWT_TOKEN>
```

### Connection

Upon successful connection, you'll receive:
```json
{
  "type": "connected",
  "userId": "user_id",
  "role": "teacher"
}
```

### Message Types

#### Teacher: Start Session
```json
{
  "type": "start_session",
  "classId": "class_mongodb_id"
}
```

**Broadcast Response:**
```json
{
  "type": "session_started",
  "classId": "class_id",
  "teacherId": "teacher_id"
}
```

#### Teacher: End Session
```json
{
  "type": "end_session"
}
```

**Broadcast Response:**
```json
{
  "type": "session_ended",
  "classId": "class_id",
  "attendanceCount": 25
}
```

#### Student: Mark Present
```json
{
  "type": "mark_present"
}
```

**Response to Student:**
```json
{
  "type": "attendance_confirmed",
  "classId": "class_id"
}
```

**Broadcast to Others:**
```json
{
  "type": "student_marked",
  "studentId": "student_id",
  "studentName": "John Doe"
}
```

#### Get Session Status
```json
{
  "type": "get_status"
}
```

**Response:**
```json
{
  "type": "session_status",
  "active": true,
  "classId": "class_id",
  "presentCount": 15
}
```

### Error Responses
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  Client │         │  Server │         │   DB    │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │  POST /signup     │                   │
     │──────────────────>│                   │
     │                   │  Create User      │
     │                   │──────────────────>│
     │                   │<──────────────────│
     │   { token, user } │                   │
     │<──────────────────│                   │
     │                   │                   │
     │  Request + Bearer │                   │
     │──────────────────>│                   │
     │                   │  Verify JWT       │
     │                   │──────────────────>│
     │                   │<──────────────────│
     │   Protected Data  │                   │
     │<──────────────────│                   │
     │                   │                   │
```

## Data Models

### User
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,        // unique
  password: string,     // hashed with bcrypt
  role: 'teacher' | 'student',
  createdAt: Date,
  updatedAt: Date
}
```

### Class
```typescript
{
  _id: ObjectId,
  className: string,
  teacherId: ObjectId,      // ref: User
  studentIds: ObjectId[],   // ref: User[]
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance
```typescript
{
  _id: ObjectId,
  classId: ObjectId,     // ref: Class
  studentId: ObjectId,   // ref: User
  status: 'present' | 'absent',
  createdAt: Date,
  updatedAt: Date
}
```

## Real-time Attendance Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Teacher  │      │  Server  │      │ Student  │      │   DB     │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │  start_session  │                 │                 │
     │────────────────>│                 │                 │
     │                 │  Validate       │                 │
     │                 │  Ownership      │                 │
     │                 │────────────────────────────────-->│
     │                 │<──────────────────────────────────│
     │                 │                 │                 │
     │                 │ session_started │                 │
     │<────────────────│────────────────>│                 │
     │                 │                 │                 │
     │                 │  mark_present   │                 │
     │                 │<────────────────│                 │
     │                 │  Validate       │                 │
     │                 │  Enrollment     │                 │
     │                 │────────────────────────────────-->│
     │                 │<──────────────────────────────────│
     │                 │                 │                 │
     │  student_marked │ confirm         │                 │
     │<────────────────│────────────────>│                 │
     │                 │                 │                 │
     │   end_session   │                 │                 │
     │────────────────>│                 │                 │
     │                 │ Save all        │                 │
     │                 │ attendance      │                 │
     │                 │────────────────────────────────-->│
     │                 │<──────────────────────────────────│
     │                 │                 │                 │
     │  session_ended  │ session_ended   │                 │
     │<────────────────│────────────────>│                 │
     │                 │                 │                 │
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **TypeScript** | Type-safe JavaScript |
| **Express.js** | REST API framework |
| **WebSocket (ws)** | Real-time communication |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **Zod** | Schema validation |
| **dotenv** | Environment configuration |

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Stateless token-based authentication
- **Role-based Access Control**: Routes protected by role guards
- **Input Validation**: All inputs validated using Zod schemas
- **WebSocket Authentication**: Token-based WS connection auth

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |

## Testing WebSocket

You can test the WebSocket connection using a tool like `wscat`:

```bash
# Install wscat
npm install -g wscat

# Connect as a teacher
wscat -c "ws://localhost:3000?token=<TEACHER_JWT_TOKEN>"

# Start a session
{"type": "start_session", "classId": "<CLASS_ID>"}

# End the session
{"type": "end_session"}
```

## License

This project is licensed under the ISC License.

## Author

**Harshcreator**

- GitHub: [@Harshcreator](https://github.com/Harshcreator)

---

<p align="center">Made with ❤️ for seamless attendance tracking</p>
