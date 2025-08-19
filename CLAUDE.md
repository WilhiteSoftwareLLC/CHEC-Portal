# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CHEC Portal is a full-stack TypeScript application for managing homeschool cooperative education. It manages families, students, courses, classes, schedules, and invoices with role-based authentication for administrators and parents.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (Vite client + esbuild server)  
- `npm start` - Run production build
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes using Drizzle

### Database Commands
- `npm run db:push` - Apply schema changes to database
- Check `drizzle.config.ts` for database configuration

#### Database Backup Before Migrations
Always create a backup before running database migrations:
```bash
PGPASSWORD=<password> pg_dump -h localhost -p 5432 -U <username> <database> > db/backups/backup_$(date +%Y%m%d_%H%M%S)_before_migration_name.sql
```
Database credentials (username, password, database name) are found in `.env` file under `DATABASE_URL`.

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS
- **Routing**: Wouter (client-side)
- **State Management**: TanStack Query (React Query)
- **Authentication**: Custom credential-based with sessions

### Project Structure
```
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── forms/       # Form components for entities
│   │   ├── dialogs/     # Modal dialogs
│   │   └── layout/      # Layout components
│   ├── pages/           # Route components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── contexts/        # React contexts
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   ├── auth.ts          # Authentication logic
│   └── db.ts           # Database connection
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle schema + Zod validation
└── docs/               # Documentation
```

### Database Schema
The application uses PostgreSQL with the following key entities:
- **families** - Family information and contact details
- **students** - Student records with denormalized schedules
- **courses** - Secondary courses (7th grade and older)
- **classes** - Elementary classes (6th grade and younger)  
- **grades** - Grade levels with numeric codes
- **hours** - Class periods (1st, 2nd, 3rd, etc.)
- **adminUsers** - Administrator accounts
- **parentUsers** - Parent accounts linked to families
- **settings** - Application configuration

### Authentication System
- Custom session-based authentication using Express sessions
- Two user types: Admin users and Parent users
- Admin users have full access to all functionality
- Parent users can only access their own family's data
- Role-based middleware in routes (`requireAdmin`, `requireParentOrAdmin`, etc.)

### API Structure
- RESTful API with standard CRUD operations
- Routes follow pattern: `/api/{entity}` for collections
- Individual resources: `/api/{entity}/{id}`
- Special endpoints for search: `/api/{entity}/search?q={query}`
- Import endpoints for CSV data: `/api/import/{entity}`
- All API responses use consistent JSON format

### Student Schedule Management
Students have a denormalized schedule structure with specific hour fields:
- `mathHour` - Math class assignment
- `firstHour` through `fourthHour` - Regular class periods
- `fifthHourFall` / `fifthHourSpring` - Semester-specific 5th period

### Import System
- CSV import functionality for migrating from MS Access database
- Import endpoints for families, students, courses, classes, grades, and hours
- Automatic data validation and conflict resolution
- Progress tracking for large imports

### Development Features
- Admin-only development page with Aider integration for AI-assisted development
- Build and deployment tools integrated into the UI
- Real-time streaming of development command output

## Common Development Patterns

### Adding New Entity Types
1. Add table definition to `shared/schema.ts`
2. Add storage interface methods to `server/storage.ts`
3. Implement storage methods in storage class
4. Add API routes in `server/routes.ts`
5. Create form component in `client/src/components/forms/`
6. Create page component in `client/src/pages/`
7. Add route to `client/src/App.tsx`

### Form Development
- Use React Hook Form with Zod validation
- Import schemas from `@shared/schema`
- Use shadcn/ui form components for consistency
- Handle loading states and error messages
- Use TanStack Query for data fetching and mutations

### Database Operations
- Use Drizzle ORM with prepared statements where possible
- Implement proper error handling and transactions
- Use type-safe database operations with TypeScript
- Follow existing patterns in `server/storage.ts`

### UI Component Usage
- Use shadcn/ui components from `@/components/ui/`
- Follow existing design patterns in the application
- Use the custom `EditableGrid` component for data tables
- Implement proper loading states and error boundaries

## Path Aliases
- `@/` - Points to `client/src/`
- `@shared/` - Points to `shared/`
- `@assets/` - Points to `attached_assets/`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment (development/production)
- `SERVER_PORT` - Server port (default: 5000)

### Email Configuration (for family notifications)
- `USE_SMTP` - Use SMTP (1) or mail command (0) for sending emails (default: 1)
- `SMTP_HOST` - Mail server hostname (default: localhost, used when USE_SMTP=1)
- `SMTP_PORT` - Mail server port (default: 25, used when USE_SMTP=1)
- `SMTP_SECURE` - Use SSL/TLS (true for port 465, false for others, used when USE_SMTP=1)
- `FROM_EMAIL` - From email address (required for both SMTP and mail command)

### SMS Configuration (for emergency messaging)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_PHONE_NUMBER` - Twilio phone number (format: +1234567890)

## Email System Setup

The application includes email functionality for sending family links to invoices and schedules.

### Email Configuration Options
1. Set up email configuration in your `.env` file (see `.env.example` for template)

**Option 1: Using mail command (recommended for production)**
   - `USE_SMTP=0`
   - `FROM_EMAIL=your-email@domain.com`

**Option 2: Using SMTP server**
   - `USE_SMTP=1`
   - `SMTP_HOST=localhost`
   - `SMTP_PORT=25`
   - `SMTP_SECURE=false`
   - `FROM_EMAIL=your-email@domain.com`

### Testing Email Functionality
1. Navigate to Settings → Tools tab
2. Click "Test Connection" to verify email configuration (tests 'mail' command availability when USE_SMTP=0, or SMTP connection when USE_SMTP=1)
3. Use "Send Family Links" to send emails to all families with email addresses
4. Monitor server logs for any email delivery errors

### Email Features
- **Family Links Email**: Sends secure links for both invoice and schedules to each family
- **HTML Templates**: Professional email formatting with responsive design
- **Bulk Sending**: Processes all families with email addresses
- **Error Handling**: Tracks successful sends and failures
- **Security**: Uses hash-based URLs that don't require authentication

## SMS Messaging System

The application includes emergency SMS messaging functionality for sending urgent notifications to all families.

### Twilio Configuration
1. Set up Twilio credentials in your `.env` file (see `.env.example` for template)
2. Required Twilio account information:
   - `TWILIO_ACCOUNT_SID` - Your Twilio account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio authentication token
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (e.g., +1234567890)

### Using Emergency Messaging
1. Navigate to Messaging page (admin access only)
2. Compose your emergency message (keep under 160 characters for single SMS)
3. Click "Send Emergency SMS" to send to all families with registered phone numbers
4. Monitor results showing successful sends and any failures

### SMS Features
- **Emergency Alerts**: Sends urgent notifications to all families with phone numbers
- **Bulk SMS**: Processes all active families with registered phone numbers
- **Message Formatting**: Automatically prefixes messages with "CHEC Emergency Alert: "
- **Error Tracking**: Detailed reporting of successful sends and failures
- **Admin Only**: Restricted to administrator users for security
- **Length Warnings**: Alerts when messages exceed single SMS length

## Authentication Flow
1. Users log in via `/api/login` with username/password
2. Server validates credentials and creates session
3. Session data stored in `req.session.authUser`
4. Protected routes use middleware to check authentication
5. Frontend uses `useCredentialAuth` hook to manage auth state

## Testing and Deployment
- No specific test framework configured - check project for testing setup
- Production deployment uses PM2 with `ecosystem.config.cjs`
- Build process creates optimized client bundle and server bundle
- Database migrations handled through Drizzle Kit
- Don't offer to 'npm run dev'. I will always run the app outside of Claude Code.