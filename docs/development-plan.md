# Removing Friday Science from the System

This document outlines all the changes needed to completely remove 'Friday Science' from the CHEC Portal system.

## Database Schema Changes

### 1. Remove fridayScience column from students table
- Drop the `fridayScience` column from the `students` table in the database
- Update the database migration to remove this field

### 2. Update shared schema
- Remove `fridayScience` field from the `students` table definition in `shared/schema.ts`
- Update the `insertStudentSchema` to exclude this field
- Update TypeScript types (`Student`, `InsertStudent`) to remove this field

## Backend Changes

### 3. Update API routes
- Remove `fridayScience` handling from student creation/update endpoints in `server/routes.ts`
- Remove references to `fridayScience` in import/export functionality
- Update CSV import logic to ignore `fridayScience` column if present in imported data

### 4. Update storage layer
- Remove `fridayScience` field handling in `server/storage.ts`
- Update student queries to exclude this field
- Update any student-related database operations

## Frontend Changes

### 5. Update student forms
- Remove `fridayScience` field from `client/src/components/forms/student-form.tsx`
- Remove the Friday Science dropdown and related logic
- Update form validation to exclude this field

### 6. Update student grids and displays
- Remove `fridayScience` column from student grids in `client/src/pages/students.tsx`
- Remove from EditableGrid column definitions
- Update any student display components that show this field

### 7. Update schedules functionality
- Remove `fridayScience` references from `client/src/pages/schedules.tsx`
- Update schedule generation and display logic
- Remove from schedule printing functionality

### 8. Update invoice calculations
- Remove `fridayScience` course fee calculations from `client/src/pages/invoices.tsx`
- Update invoice generation to exclude Friday Science courses
- Update fee calculation logic

### 9. Update import functionality
- Remove `fridayScience` field handling from `client/src/pages/import.tsx`
- Update CSV import UI to remove references to this field
- Update import validation and processing

## Data Migration

### 10. Handle existing data
- Create a migration script to safely remove existing `fridayScience` data
- Optionally preserve the data in a backup table before deletion
- Update any existing student records that have Friday Science courses assigned

## Testing and Validation

### 11. Update tests
- Remove any tests that specifically test Friday Science functionality
- Update existing tests to exclude Friday Science field validation
- Add tests to ensure the field is properly removed from all operations

### 12. Validation checklist
- Verify student creation works without Friday Science field
- Verify student editing works without Friday Science field
- Verify schedules generate correctly without Friday Science
- Verify invoices calculate correctly without Friday Science courses
- Verify CSV import/export works without Friday Science data
- Verify all forms and grids display correctly without the field

## Documentation Updates

### 13. Update user documentation
- Remove references to Friday Science from user guides
- Update screenshots and examples that show Friday Science
- Update field descriptions and help text

### 14. Update technical documentation
- Update API documentation to remove Friday Science endpoints/fields
- Update database schema documentation
- Update any architectural diagrams that reference this field

## Deployment Considerations

### 15. Database migration strategy
- Plan the database migration to minimize downtime
- Consider running the migration during maintenance windows
- Have a rollback plan in case issues arise

### 16. Gradual rollout
- Consider feature flagging to gradually remove Friday Science
- Test thoroughly in staging environment before production deployment
- Monitor for any issues after deployment

This comprehensive removal will ensure Friday Science is completely eliminated from the system while maintaining data integrity and system functionality.
