# Statistics API Documentation

## Overview

The Statistics API provides comprehensive business analytics for super-admin users only. This endpoint gives detailed insights into the gym's operations, finances, and performance metrics.

## Authentication

All statistics endpoints require:

1. Valid JWT token in the Authorization header
2. Super-admin role (`role: 'super-admin'`)

## Endpoints

### 1. Get Comprehensive Statistics

**GET** `/api/v1/statistics`

Returns detailed statistics including:

- User breakdown (super-admins, admins, coaches)
- Financial metrics (total income, salaries, net profit)
- Subscription statistics
- Session analytics
- Coach performance metrics
- Recent activity (last 30 days)

#### Response Example:

```json
{
  "status": "success",
  "data": {
    "statistics": {
      "overview": {
        "totalUsers": 15,
        "totalClients": 120,
        "totalIncome": 50000,
        "totalSalaries": 15000,
        "netProfit": 35000
      },
      "userBreakdown": {
        "superAdmins": 1,
        "admins": 2,
        "coaches": 12,
        "totalStaff": 14
      },
      "financial": {
        "totalIncome": 50000,
        "mainSubscriptionIncome": 40000,
        "privateSubscriptionIncome": 10000,
        "totalSalaries": 15000,
        "averageSalary": 1250,
        "netProfit": 35000,
        "averageIncomePerClient": 417
      },
      "subscriptions": {
        "totalPlans": 8,
        "mainPlans": 4,
        "privatePlans": 4,
        "clientsWithPrivatePlans": 25,
        "planUsage": {
          "Monthly Plan": {
            "planType": "main",
            "price": 100,
            "usage": 80,
            "revenue": 8000
          }
        }
      },
      "sessions": {
        "totalSessions": 500,
        "completedSessions": 450,
        "pendingSessions": 40,
        "canceledSessions": 10,
        "completionRate": 90
      },
      "performance": {
        "coachPerformance": {
          "John Doe": {
            "totalSessions": 50,
            "completedSessions": 45,
            "pendingSessions": 4,
            "canceledSessions": 1,
            "completionRate": 90
          }
        },
        "recentActivity": {
          "newClientsLast30Days": 15,
          "newSessionsLast30Days": 80
        }
      },
      "generatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Get Quick Statistics

**GET** `/api/v1/statistics/quick`

Returns a simplified overview with key metrics:

- Total users and clients
- Total revenue and salaries
- Net profit
- Generation timestamp

#### Response Example:

```json
{
  "status": "success",
  "data": {
    "quickStats": {
      "totalUsers": 15,
      "totalClients": 120,
      "totalRevenue": 50000,
      "totalSalaries": 15000,
      "netProfit": 35000,
      "generatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Usage Examples

### Using cURL:

```bash
# Get comprehensive statistics
curl -X GET "http://localhost:3000/api/v1/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Get quick statistics
curl -X GET "http://localhost:3000/api/v1/statistics/quick" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript/Fetch:

```javascript
const response = await fetch('/api/v1/statistics', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log(data.data.statistics);
```

## Error Responses

### 401 Unauthorized (No token or invalid token):

```json
{
  "statusCode": 401,
  "status": "error",
  "message": "You are not logged in. Please log in to get access."
}
```

### 403 Forbidden (Not super-admin):

```json
{
  "statusCode": 403,
  "status": "error",
  "message": "Access denied. Super admin role required."
}
```

### 500 Internal Server Error:

```json
{
  "status": "error",
  "message": "Failed to fetch statistics",
  "error": "Error details..."
}
```

## Statistics Included

### Financial Metrics:

- **Total Income**: Sum of all subscription and private plan payments
- **Main Subscription Income**: Revenue from regular gym memberships
- **Private Subscription Income**: Revenue from private training sessions
- **Total Salaries**: Sum of all coach salaries
- **Net Profit**: Total income minus total salaries
- **Average Salary**: Average salary per coach
- **Average Income Per Client**: Total income divided by number of clients

### User Statistics:

- **Total Users**: All users in the system
- **Super Admins**: Number of super-admin users
- **Admins**: Number of admin users
- **Coaches**: Number of coach users
- **Total Staff**: Admins + Coaches

### Subscription Analytics:

- **Total Plans**: All subscription plans available
- **Main Plans**: Regular gym membership plans
- **Private Plans**: Private training session plans
- **Clients with Private Plans**: Number of clients who have private training
- **Plan Usage**: Detailed breakdown of each plan's usage and revenue

### Session Analytics:

- **Total Sessions**: All sessions ever created
- **Completed Sessions**: Successfully completed sessions
- **Pending Sessions**: Sessions scheduled but not yet completed
- **Canceled Sessions**: Sessions that were canceled
- **Completion Rate**: Percentage of completed vs total sessions

### Performance Metrics:

- **Coach Performance**: Individual coach statistics including session counts and completion rates
- **Recent Activity**: New clients and sessions in the last 30 days

## Notes

- All monetary values are in the currency unit defined in your system
- Statistics are calculated in real-time based on current database state
- The `generatedAt` timestamp shows when the statistics were calculated
- Coach performance metrics include completion rates for quality assessment
