# Development Plan: Develop Page Feature

## Overview
Add a new "Develop" page to the CHEC Portal that allows admin users to execute aider commands and deploy application changes directly from the web interface, without requiring command line access.

## Feature Requirements

### Core Functionality
1. **Develop Page**: New page accessible from dashboard navigation
2. **Prompt Input**: Large text area for entering aider prompts
3. **Submit Button**: Executes aider command with the provided prompt
4. **Results Display**: Read-only text area showing aider command output
5. **Deploy Button**: Builds and redeploys the application
6. **Status Indicators**: Visual feedback for command execution and deployment status

### User Interface Components
- **Prompt Text Area**: Multi-line input for aider commands
- **Submit Button**: Triggers aider execution
- **Results Text Area**: Displays command output (read-only, scrollable)
- **Deploy Button**: Triggers build and deployment process
- **Status Indicators**: Loading states, success/error messages
- **Clear/Reset Buttons**: Clear prompt and results areas

### Backend API Endpoints
- `POST /api/develop/execute` - Execute aider command
- `POST /api/develop/deploy` - Build and deploy application
- `GET /api/develop/status` - Check execution/deployment status

## Implementation Plan

### Phase 1: Frontend Components
1. Create `client/src/pages/develop.tsx`
2. Add Develop navigation card to dashboard
3. Implement UI components:
   - Prompt input textarea
   - Results display textarea
   - Submit and Deploy buttons
   - Status indicators and loading states
4. Add route to main router

### Phase 2: Backend API
1. Add develop routes to `server/routes.ts`
2. Implement command execution logic:
   - Spawn aider process with user prompt
   - Capture stdout/stderr output
   - Handle process completion/errors
3. Implement deployment logic:
   - Execute `npm run build`
   - Execute `pm2 restart ecosystem.config.cjs`
   - Capture build/deployment status

### Phase 3: Security & Error Handling
1. Add admin-only access control
2. Implement proper error handling and user feedback
3. Add execution mutex to prevent concurrent commands

## Technical Implementation Details

### Frontend Structure
```
client/src/pages/develop.tsx
├── PromptInput component
├── ResultsDisplay component
├── ActionButtons component
└── StatusIndicators component
```

### Backend Structure
```
server/routes.ts
├── POST /api/develop/execute
├── POST /api/develop/deploy
└── GET /api/develop/status
```

### Command Execution
- Use Node.js `child_process.spawn()` for aider execution
- Capture both stdout and stderr
- No timeout mechanism (wait indefinitely)
- Prevent concurrent executions with mutex/flag
- Load all project source files into aider context

### Aider Command Construction
- Base command: `aider` (from `/home/jeff/CHEC-Portal/`)
- Add all source files to context: `--file client/src/**/*.tsx --file client/src/**/*.ts --file server/**/*.ts --file shared/**/*.ts`
- Include user prompt as final argument
- Working directory: `/home/jeff/CHEC-Portal`

### State Management
- Track execution state with boolean flag (`isExecuting`)
- Store current command output in memory during execution
- Clear results when starting new command
- Handle process cleanup on completion/error

### Error Handling Scenarios
- Aider command not found
- Invalid working directory
- Process spawn failures
- Build command failures
- PM2 restart failures
- Network/permission issues

### Deployment Process
1. Execute `npm run build` in project root (`/home/jeff/CHEC-Portal`)
2. Check build exit code (0 = success, non-zero = failure)
3. If build fails, return error message to frontend, do not proceed
4. If build succeeds, execute `pm2 restart ecosystem.config.cjs`
5. Return deployment status to frontend
6. Note: PM2 restart will cause user's session to get 404 → automatic logout

### API Response Formats
```typescript
// Execute response
{
  success: boolean;
  output: string;  // Combined stdout/stderr
  error?: string;  // If execution failed
}

// Deploy response
{
  success: boolean;
  buildOutput: string;
  deployOutput?: string;  // Only if build succeeded
  error?: string;
}
```

### Frontend State Management
- Track execution/deployment status separately
- Disable buttons during operations
- Show loading indicators
- Display output in scrollable text area
- Handle session loss after deployment

## Security Considerations

### Access Control
- Restrict to admin users only (`requireAdmin` middleware)
- Add additional permission checks if needed

### Command Safety
- Validate aider is available on system
- Sanitize input prompts (remove dangerous characters)
- Limit command execution time
- Run commands in project directory only

### Process Management
- Prevent multiple simultaneous aider executions
- Implement command queuing if needed
- Handle zombie processes

## Technical Requirements (Answered)

### Aider Configuration
- **Command Path**: `/home/jeff/CHEC-Portal/aider` (run from project root)
- **Working Directory**: `/home/jeff/CHEC-Portal` (project root)
- **Environment Variables**: Automatically loaded by aider from `.env` file
- **Context Loading**: Load all source files in CHEC-Portal project for every prompt
- **Concurrent Execution**: Prevent multiple simultaneous aider executions
- **Timeout**: No timeout - wait for aider to complete regardless of duration
- **Output**: Show complete aider output at completion (no streaming needed)

### Security & Access
- **User Permissions**: Admin users only (assume non-malevolent)
- **Command Validation**: No sanitization needed (trust admin users)
- **File System Access**: No restrictions (aider can modify any project files)
- **Audit Logging**: Git provides sufficient audit trail

### Build & Deployment
- **Build Command**: `npm run build` (from project root)
- **Build Failure**: Show failure message, do not proceed with deployment
- **Deployment Command**: `pm2 restart ecosystem.config.cjs` (from project root)
- **Deployment Effect**: Causes 404 → automatic logout → forced re-login
- **Rollback Strategy**: Manual developer intervention if needed

### User Experience
- **Command History**: Do not preserve previous commands/results
- **Progress Feedback**: Raw aider output, unmodified
- **Error Handling**: Display errors as received from aider
- **Session Management**: User logout expected after deployment

### Infrastructure
- **Resource Limits**: Not a concern (small project fits in 200K context)
- **Backup Strategy**: Git provides sufficient backup
- **System Criticality**: Non-critical system, manual fixes acceptable

## Risk Assessment

### Accepted Risks
- **System Instability**: Bad aider changes could break the application (acceptable - manual fix)
- **Deployment Failures**: Failed deployments could cause downtime (acceptable - manual recovery)
- **UI Responsiveness**: Long commands might make interface unresponsive (acceptable)
- **User Confusion**: Complex aider output might be hard to interpret (acceptable)

### Mitigated Risks
- **Code Injection**: Not a concern (trusted admin users only)
- **Data Loss**: Git provides backup protection
- **Resource Exhaustion**: Not a concern (small project size)
- **Performance Impact**: Acceptable for non-critical system

## Success Criteria
1. Admin users can successfully execute aider commands from web interface
2. Command output is clearly displayed to users
3. Deployment process works reliably
4. No security vulnerabilities introduced
5. System remains stable during and after operations
6. Proper error handling and user feedback
7. Audit trail of all development activities

## Dependencies
- Node.js `child_process` module
- Aider CLI tool installed on server
- PM2 process manager
- Admin authentication system
- Proper file permissions for build/deployment
