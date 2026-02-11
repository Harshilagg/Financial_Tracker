
Fischer Jordan Backend Assignment for Financial Analysis

## Overview

Finance Manager is a full-stack web application designed to help users manage their personal finances efficiently. The system allows users to track income and expenses, manage budgets, categorize transactions, upload receipts, import bank statements, and visualize financial data through analytics dashboards.

The application is built with a modular architecture that ensures scalability, maintainability, and secure data handling.

---

## Features

- User Authentication (Register/Login)
- Income & Expense Management
- Category-based Transaction Organization
- Budget Tracking & Limit Monitoring
- Multi-Currency Transaction Support
- Dashboard Analytics & Reports
- Receipt Upload & Management
- Bank Statement Import
- Notification System
- Secure User Data Isolation

---

## System Architecture

```
Frontend (React)
        │
        │ REST API Calls
        ▼
Backend (Node.js + Express)
        │
        ├── Routes
        ├── Controllers
        ├── Services
        ├── Middleware
        └── Utilities
        │
        ▼
Database (SQL)
```

### Frontend
- React-based user interface
- Authentication context for session management
- Protected routes for authenticated users
- Dashboard and transaction management UI

### Backend
- Node.js with Express
- RESTful API architecture
- JWT-based authentication
- Modular controller-service structure

### Database
Main entities:
- Users
- Categories
- Transactions
- Budgets
- Notifications
- Receipts

---

## Authentication Flow

1. User registers or logs in.
2. Credentials are validated by the backend.
3. JWT token is generated upon successful authentication.
4. Token is stored on the frontend.
5. Protected APIs require token verification via middleware.

### Edge Cases Handled
- Invalid credentials
- Missing or expired tokens
- Unauthorized API access
- Duplicate user registration

---

## User Management Flow

- Each user has isolated financial data.
- All database queries are filtered using `user_id`.
- Users can update profile details securely.

### Edge Cases Handled
- Cross-user data access prevention
- Invalid profile updates blocked

---

## Category Management Flow

Users can create and manage categories for organizing transactions.

### Flow
1. User creates/updates/deletes a category.
2. Request is validated.
3. Category is stored with user ownership.

### Edge Cases Handled
- Duplicate categories prevention
- Safe handling of categories linked with transactions

---

## Transaction Management Flow (Core Module)

Transactions represent income or expenses and form the core functionality.

### Flow

```
User Input → API Request → Validation → Database Insert
                  ↓
          Budget Update
                  ↓
          Notification Trigger
```

### Supported Operations
- Add transaction
- Edit transaction
- Delete transaction
- Fetch transaction history
- Multi-currency transactions

### Internal Processing
- Currency normalization
- Monthly summary recalculation
- Budget usage update

### Edge Cases Handled
- Invalid amount or date
- Currency inconsistencies
- Editing transactions updates summaries correctly
- Deleting transactions recalculates budgets
- Negative or zero values restricted

---

## Budget Management Flow

Users can set budgets per category and track spending.

### Flow
1. User sets budget for a period.
2. Transactions update budget usage.
3. Notifications generated when limits are exceeded.

### Edge Cases Handled
- Budget overflow detection
- Duplicate budgets prevention
- Budget recalculation after transaction updates

---

## Dashboard & Analytics Flow

The dashboard provides financial insights and summaries.

### Data Includes
- Monthly spending
- Income vs expense comparison
- Category-wise distribution

### Flow
1. Dashboard requests aggregated data.
2. Backend performs aggregation queries.
3. Data returned in chart-ready format.

### Edge Cases Handled
- Empty dataset handling
- First-time user support
- Currency-safe aggregation

---

## Receipt Upload Flow

Users can upload receipts and link them to transactions.

### Flow
1. Receipt uploaded by user.
2. File stored via storage service.
3. Metadata saved in database.
4. Linked to transaction.

### Edge Cases Handled
- Invalid file type rejection
- Missing transaction handling
- Storage failure handling

---

## Bank Statement Import Flow

Users can import transactions using bank statements.

### Flow
1. Bank file uploaded.
2. Parser extracts transaction data.
3. Transactions inserted in batch.
4. Dashboard summaries updated.

### Edge Cases Handled
- Duplicate transaction detection
- Invalid file formats
- Partial import error handling

---

## Notification Flow

Notifications are generated when:
- Budget limits are exceeded
- Important financial updates occur

### Flow
```
Transaction/Budget Update
            ↓
   Notification Service
            ↓
   Stored in Database
```

---

## Security & Data Integrity

The system ensures:

- JWT-based authentication
- Protected API routes
- User-specific data isolation
- Backend validation before database operations
- Prevention of orphan records

---

## Key Design Decisions

- Modular backend architecture
- Service layer for reusable business logic
- Utility modules for financial calculations
- Aggregation-based reporting
- Scalable database structure

---
