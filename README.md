# Her Power Gym Backend API

A comprehensive gym management system with role-based access control for managing users, clients, sessions, and subscriptions.

## Features

- **Role-based Access Control**: Super Admin, Admin, Coach, and Client roles
- **User Management**: Complete CRUD operations for staff members
- **Client Management**: Client profiles with subscription tracking
- **Session Management**: Training sessions with status tracking
- **Subscription Plans**: Main and private subscription plans
- **Authentication**: JWT-based authentication system

## Role Permissions

### Super Admin

- Full CRUD access to all entities
- Can create admin users
- Can manage all coaches and clients
- Can view all sessions and subscriptions

### Admin

- Can manage coaches and clients
- Can create and manage sessions
- Can manage subscription plans
- Cannot create other admin users

### Coach

- Can view their own clients
- Can view their own sessions
- Can update session status to completed
- Can manage their own days off
- Can view client subscription details

### Client

- Can view their own profile and subscription
- Can view their sessions
- Can mark sessions as completed
- Can view their coach's information

## API Endpoints

### Authentication

#### Public Routes

- `POST /api/v1/auth/login` - Login for staff members
- `POST /api/v1/auth/login-client` - Login for clients
- `POST /api/v1/auth/forgot-password` - Request password reset
- `PATCH /api/v1/auth/reset-password` - Reset password with token

#### Protected Routes

- `GET /api/v1/auth/me` - Get current user profile
- `PATCH /api/v1/auth/update-password` - Update password
- `POST /api/v1/auth/register` - Register new user (Admin/Super Admin only)

### Users

#### CRUD Operations

- `GET /api/v1/users` - Get all users (Admin/Super Admin)
- `POST /api/v1/users` - Create new user (Admin/Super Admin)
- `GET /api/v1/users/:id` - Get single user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (Admin/Super Admin)

#### Coach-specific Routes

- `PATCH /api/v1/users/:id/days-off` - Update coach's days off
- `GET /api/v1/users/me/clients` - Get coach's clients
- `GET /api/v1/users/me/sessions` - Get coach's sessions

### Clients

#### CRUD Operations

- `GET /api/v1/clients` - Get all clients (Admin/Super Admin/Coach)
- `POST /api/v1/clients` - Create new client (Admin/Super Admin)
- `GET /api/v1/clients/:id` - Get single client
- `PATCH /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Delete client (Admin/Super Admin)

#### Client-specific Routes

- `GET /api/v1/clients/:id/subscription` - Get client's subscription details
- `GET /api/v1/clients/:id/sessions` - Get client's sessions

### Sessions

#### CRUD Operations

- `GET /api/v1/sessions` - Get all sessions (Admin/Super Admin/Coach)
- `POST /api/v1/sessions` - Create new session (Admin/Super Admin)
- `GET /api/v1/sessions/:id` - Get single session
- `PATCH /api/v1/sessions/:id` - Update session
- `DELETE /api/v1/sessions/:id` - Delete session (Admin/Super Admin)

#### Session-specific Routes

- `PATCH /api/v1/sessions/:id/status` - Update session status (Coach/Client)
- `GET /api/v1/sessions/client/:clientId` - Get sessions by client

### Subscriptions

#### CRUD Operations

- `GET /api/v1/subscriptions` - Get all subscription plans
- `POST /api/v1/subscriptions` - Create new plan (Admin/Super Admin)
- `GET /api/v1/subscriptions/:id` - Get single plan
- `PATCH /api/v1/subscriptions/:id` - Update plan (Admin/Super Admin)
- `DELETE /api/v1/subscriptions/:id` - Delete plan (Admin/Super Admin)

#### Subscription-specific Routes

- `GET /api/v1/subscriptions/main` - Get main subscription plans
- `GET /api/v1/subscriptions/private` - Get private subscription plans

## Data Models

### User Model

```javascript
{
  name: String,
  phone: String (unique),
  password: String,
  role: ['super admin', 'admin', 'coach'],
  userId: String (unique),
  salary: Number (coach only),
  clients: [ObjectId], // coach only
  daysOff: [String], // coach only
  daysOffHistory: [{
    daysOff: [String],
    changedBy: ObjectId,
    changedAt: Date
  }]
}
```

### Client Model

```javascript
{
  name: String,
  phone: String (unique),
  nationalId: String (unique),
  clientId: String (unique),
  subscription: {
    plan: ObjectId,
    priceAtPurchase: Number,
    startDate: Date,
    endDate: Date
  },
  privatePlan: {
    plan: ObjectId,
    coach: ObjectId,
    totalSessions: Number,
    sessions: [ObjectId],
    priceAtPurchase: Number
  }
}
```

### Session Model

```javascript
{
  client: ObjectId,
  coach: ObjectId,
  date: Date,
  status: ['pending', 'completed', 'canceled'],
  notes: String,
  statusChangeHistory: [{
    status: String,
    changedBy: ObjectId,
    changedAt: Date,
    reason: String
  }]
}
```

### Subscription Plan Model

```javascript
{
  name: String (unique),
  type: ['main', 'private'],
  durationDays: Number,
  totalSessions: Number, // private plans only
  price: Number,
  description: String
}
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Environment Variables

Create a `config.env` file with the following variables:

```
NODE_ENV=development
PORT=3000
DATABASE=mongodb://localhost:27017/her-power-gym
DATABASE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=90d
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm start`

## Usage Examples

### Login as Staff Member

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "password": "password123"}'
```

### Login as Client

```bash
curl -X POST http://localhost:3000/api/v1/auth/login-client \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "clientId": "CLIENT001"}'
```

### Create New Session (Admin/Super Admin)

```bash
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "client": "client_id",
    "coach": "coach_id",
    "date": "2024-01-15T10:00:00Z",
    "notes": "Strength training session"
  }'
```

### Update Session Status (Coach/Client)

```bash
curl -X PATCH http://localhost:3000/api/v1/sessions/session_id/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "reason": "Session completed successfully"
  }'
```

## Error Handling

The API returns consistent error responses:

```javascript
{
  "status": "error",
  "message": "Error description"
}
```

## Success Responses

All successful responses follow this format:

```javascript
{
  "status": "success",
  "data": {
    // Response data
  }
}
```
