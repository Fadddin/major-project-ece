# RFID Dashboard Backend

This is the backend API for the RFID attendance tracking system built with Next.js, MongoDB, and Mongoose.

## Features

- RFID-based attendance tracking
- User registration and management
- Unregistered user handling
- Attendance records with timestamps
- Dashboard statistics
- RESTful API endpoints

## Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/rfid-dashboard
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

## Database Models

### User Schema
```typescript
{
  userId?: ObjectId; // optional if RFID is not registered
  rfid: string;
  name: string; 
  employeeId: string;
  attendance: number;
  createdAt: Date;
}
```

### UnregisteredUser Schema
```typescript
{
  rfid: string;
  lastSeen: Date;
  scannedCount: number;
}
```

### AttendanceRecord Schema
```typescript
{
  rfid: string;
  userId?: ObjectId;
  timestamp: Date;
  type: 'check-in' | 'check-out';
}
```

## API Endpoints

### Attendance Tracking

#### POST `/api/attendance`
Record attendance when RFID is scanned.

**Request Body:**
```json
{
  "rfid": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "user": {
    "name": "string",
    "employeeId": "string",
    "attendance": number
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### User Management

#### GET `/api/users`
Get all registered users with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### POST `/api/users/register`
Register a new user.

**Request Body:**
```json
{
  "rfid": "string",
  "name": "string",
  "employeeId": "string"
}
```

### Unregistered Users

#### GET `/api/unregistered`
Get all unregistered users with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### Attendance Records

#### GET `/api/attendance/records`
Get attendance records with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `startDate` (optional): Start date filter (ISO string)
- `endDate` (optional): End date filter (ISO string)
- `userId` (optional): Filter by user ID

### Dashboard Statistics

#### GET `/api/dashboard/stats`
Get dashboard statistics including:
- Total users and unregistered users
- Attendance counts (today, this week, this month)
- Top users by attendance
- Recent activity

## Usage Examples

### Recording Attendance
```javascript
const response = await fetch('/api/attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rfid: 'RFID123456'
  })
});

const data = await response.json();
console.log(data);
```

### Registering a User
```javascript
const response = await fetch('/api/users/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rfid: 'RFID123456',
    name: 'John Doe',
    employeeId: 'EMP001'
  })
});

const data = await response.json();
console.log(data);
```

### Getting Dashboard Stats
```javascript
const response = await fetch('/api/dashboard/stats');
const data = await response.json();
console.log(data);
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing or invalid data)
- `500`: Internal Server Error

## Development

The backend uses Next.js API routes, so all endpoints are automatically available when running the development server. The MongoDB connection is cached globally to prevent connection issues during development hot reloads.
