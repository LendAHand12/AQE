# Admin IP Whitelisting Security Plan

## Objective
Implement a secure IP whitelisting mechanism for administrative access that cannot be modified or bypassed by a "Super Admin" through the application interface or database.

## Proposed Solution: Server-Level Whitelisting

### 1. Configuration Storage
- **Location**: Server environment variables (`.env` file).
- **Format**: `ADMIN_IP_WHITELIST=ip1, ip2, ip3`
- **Rationale**: The `.env` file is outside the scope of application-level permissions. A Super Admin can manage users, roles, and data, but they cannot access the server's filesystem or environment variables through the app UI.

### 2. Implementation Architecture
- **Middleware**: A dedicated Express middleware (`ipWhitelistAdmin`) will be created.
- **Placement**: This middleware will be applied globally to the Admin Router in the backend.
- **Execution Flow**:
    1. Request hits `/api/admin/*`.
    2. Middleware extracts client IP (handling `x-forwarded-for` for proxies).
    3. Middleware compares client IP against the parsed list from `process.env.ADMIN_IP_WHITELIST`.
    4. If no match: Return `403 Forbidden` immediately.
    5. If match: Proceed to authentication (JWT/2FA).

### 3. Key Security Benefits
- **Infrastructure Locked**: Changes require SSH access or access to the deployment environment management (e.g., AWS/Heroku dashboard).
- **Early Rejection**: Prevents brute-force attempts from unauthorized IPs before they even reach the login logic.
- **Zero UI Dependency**: No risk of accidental deletion or modification via the Admin Dashboard.

## Implementation Steps (To be executed upon request)
1. Update `.env` on the server with authorized IPs.
2. Create `server/src/middleware/ipWhitelist.js`.
3. Integrate middleware into `server/src/routes/adminRoutes.js`.
4. Test with authorized and unauthorized network connections.
