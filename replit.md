# CHEC Portal Management System

## Overview

CHEC Portal is a comprehensive family, student, and course management system built with modern web technologies. The application provides tools for managing families, students, courses, classes, grades, hours, invoices, and schedules. It features a dual authentication system supporting both credential-based authentication for administrators and Replit Auth for regular users.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Dual system - credential-based sessions and Replit Auth
- **Session Management**: express-session with PostgreSQL store

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Node.js pg driver with connection pooling
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Migrations**: Managed through drizzle-kit

### Authentication System
- **Dual Authentication**: 
  - Credential-based authentication for admin users with bcrypt password hashing
  - Replit Auth integration for regular users
- **Session Management**: Express sessions stored in PostgreSQL
- **Authorization**: Role-based access control (admin, parent roles)

### Data Models
Core entities include:
- **Users**: Replit Auth users and admin users
- **Families**: Family units with contact information
- **Students**: Student records linked to families
- **Courses**: Course definitions with pricing
- **Classes**: Class instances with schedules
- **Grades**: Student grade records
- **Hours**: Time tracking for activities
- **Settings**: Application configuration

### API Architecture
- **RESTful Design**: Standard HTTP methods and status codes
- **Error Handling**: Centralized error handling middleware
- **Request Logging**: Detailed API request logging
- **Data Validation**: Schema validation using Drizzle and Zod

## Data Flow

1. **Authentication Flow**:
   - Credential login validates against admin_users table
   - Successful authentication creates session
   - Session data stored in PostgreSQL sessions table
   - Route protection via middleware

2. **Request Processing**:
   - Client requests routed through Express middleware
   - Authentication check on protected routes
   - Database queries via Drizzle ORM
   - JSON responses with proper error handling

3. **State Management**:
   - TanStack Query manages server state caching
   - Optimistic updates for better UX
   - Background refetching and invalidation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon database connectivity
- **bcryptjs**: Password hashing for authentication
- **connect-pg-simple**: PostgreSQL session store
- **drizzle-orm**: Database ORM and query builder
- **express-session**: Session management middleware

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Development server and build tool

## Deployment Strategy

### Build Process
- **Development**: `npm run dev` - Uses tsx for TypeScript execution
- **Production Build**: 
  - Frontend: Vite builds React app to `dist/public`
  - Backend: esbuild bundles server code to `dist/index.js`
- **Start Command**: `npm start` runs the bundled server

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable
- **Sessions**: Uses `SESSION_SECRET` for session encryption
- **Replit Integration**: Configured for Replit deployment with autoscale

### Deployment Target
- **Platform**: Replit with autoscale deployment
- **Database**: PostgreSQL (configured for Neon compatibility)
- **Port Configuration**: Internal port 5000 mapped to external port 80

## Changelog
- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.