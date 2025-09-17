# Her Power Gym Backend - Implementation Summary

## What Was Implemented

I've created a comprehensive gym management system with role-based access control that includes:

### 1. **Enhanced Models**

- **User Model**: Added password reset functionality, days off history tracking
- **Session Model**: Added status change history to track who changes session status
- **Client Model**: Added nationalId field (required, unique) with subscription and private plan support
- **Subscription Model**: Maintained existing structure for main and private plans

### 2. **Complete CRUD Controllers**

- **User Controller**: Full CRUD with role-based permissions
- **Client Controller**: Full CRUD with role-based permissions
- **Session Controller**: Full CRUD with status tracking
- **Subscription Controller**: Full CRUD for subscription plans
- **Auth Controller**: Login, registration, password management

### 3. **Role-Based Access Control**

#### Super Admin

- ✅ Full CRUD access to all entities
- ✅ Can create admin users
- ✅ Can manage all coaches and clients
- ✅ Can view all sessions and subscriptions

#### Admin

- ✅ Can manage coaches and clients
- ✅ Can create and manage sessions
- ✅ Can manage subscription plans
- ❌ Cannot create other admin users

#### Coach

- ✅ Can view their own clients
- ✅ Can view their own sessions
- ✅ Can update session status to completed
- ✅ Can manage their own days off
- ✅ Can view client subscription details

#### Client

- ✅ Can view their own profile and subscription
- ✅ Can view their sessions
- ✅ Can mark sessions as completed
- ✅ Can view their coach's information

### 4. **Authentication & Authorization**

- JWT-based authentication
- Role-based middleware
- Password hashing with bcrypt
- Password reset functionality
- Separate login for clients vs staff

### 5. **API Endpoints**

#### Authentication Routes

- `POST /api/v1/auth/login` - Staff login
- `POST /api/v1/auth/login-client` - Client login
- `POST /api/v1/auth/register` - Register new user (Admin/Super Admin)
- `GET /api/v1/auth/me` - Get current user profile
- `PATCH /api/v1/auth/update-password` - Update password
- `POST /api/v1/auth/forgot-password` - Request password reset
- `PATCH /api/v1/auth/reset-password` - Reset password

#### User Routes

- `GET /api/v1/users` - Get all users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get single user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `PATCH /api/v1/users/:id/days-off` - Update coach's days off
- `GET /api/v1/users/me/clients` - Get coach's clients
- `GET /api/v1/users/me/sessions` - Get coach's sessions

#### Client Routes

- `GET /api/v1/clients` - Get all clients
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients/:id` - Get single client
- `PATCH /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Delete client
- `GET /api/v1/clients/:id/subscription` - Get client's subscription
- `GET /api/v1/clients/:id/sessions` - Get client's sessions

#### Session Routes

- `GET /api/v1/sessions` - Get all sessions
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions/:id` - Get single session
- `PATCH /api/v1/sessions/:id` - Update session
- `DELETE /api/v1/sessions/:id` - Delete session
- `PATCH /api/v1/sessions/:id/status` - Update session status
- `GET /api/v1/sessions/client/:clientId` - Get sessions by client

#### Subscription Routes

- `GET /api/v1/subscriptions` - Get all plans
- `POST /api/v1/subscriptions` - Create plan
- `GET /api/v1/subscriptions/:id` - Get single plan
- `PATCH /api/v1/subscriptions/:id` - Update plan
- `DELETE /api/v1/subscriptions/:id` - Delete plan
- `GET /api/v1/subscriptions/main` - Get main plans
- `GET /api/v1/subscriptions/private` - Get private plans

### 6. **Key Features Implemented**

#### Session Status Tracking

- Sessions track who changes the status and when
- Coaches and clients can only mark sessions as "completed"
- Full history of status changes is maintained

#### Days Off Management

- Coaches can manage their own days off
- Admins can manage any coach's days off
- History of changes is tracked with who made the change

#### Subscription Management

- Clients can view their subscription details
- Remaining sessions are calculated automatically
- Both main and private subscriptions are supported

#### Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and error handling

## How to Use the System

### 1. **Setup**

```bash
# Install dependencies
npm install

# Copy environment file
cp config.env

# Edit config.env with your database and JWT settings

# Run setup script to create sample data
npm run setup

# Start the server
npm start
```

### 2. **Sample Users Created by Setup**

- **Super Admin**: Phone: 1234567890, Password: admin123
- **Admin**: Phone: 1234567891, Password: admin123
- **Coach John**: Phone: 1234567892, Password: coach123
- **Coach Sarah**: Phone: 1234567893, Password: coach123

### 3. **Sample Subscription Plans**

- Monthly Basic: $50
- Yearly Basic: $500
- Private Training - 10 Sessions: $300
- Private Training - 20 Sessions: $550

### 4. **API Usage Examples**

#### Login as Staff

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "password": "admin123"}'
```

#### Create a Client

```bash
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "1234567894",
    "nationalId": "12345678901234567890",
    "subscription": {
      "plan": "subscription_plan_id",
      "startDate": "2024-01-01",
      "endDate": "2024-02-01"
    }
  }'
```

#### Create a Session

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

#### Mark Session as Completed

```bash
curl -X PATCH http://localhost:3000/api/v1/sessions/session_id/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "reason": "Session completed successfully"
  }'
```

## System Architecture

The system follows a clean architecture pattern:

```
├── models/          # Database models
├── controllers/     # Business logic
├── routes/          # API endpoints
├── middleware/      # Authentication & error handling
├── scripts/         # Setup and utility scripts
└── config.env       # Environment configuration
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permissions based on user roles
- **Input Validation**: Mongoose schema validation
- **Error Handling**: Comprehensive error handling and logging
- **Status Tracking**: Audit trail for important changes

## Database Schema

The system uses MongoDB with Mongoose ODM and includes:

- User management with role-based access
- Client profiles with subscription tracking
- Session management with status history
- Subscription plans for main and private training
- Audit trails for important changes

This implementation provides a complete, secure, and scalable gym management system that meets all the requirements specified in your request.
