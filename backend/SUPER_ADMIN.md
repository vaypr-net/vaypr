# Super Admin Management

This document describes how to create and manage super admin accounts for the Vaypr platform.

## ⚠️ CRITICAL SECURITY NOTICE

**Super admin users can ONLY be created via the CLI script.**

The `isSuperAdmin` field is **explicitly blocked** in all public APIs:
- ❌ Cannot be set during registration (`POST /user/register`)
- ❌ Cannot be set during Google OAuth signup
- ❌ Cannot be modified via user update (`PATCH /user/:id`)
- ❌ Cannot be set through Swagger UI
- ❌ Not available in any DTO (CreateUserDto, UpdateUserDto)

✅ **The ONLY way to create/modify super admin status is via the CLI script: `npm run create-superadmin`**

This ensures maximum security and prevents unauthorized privilege escalation.

## Overview

The Vaypr platform uses a simple super admin system where **one designated user** has full administrative access to:

- User management
- Subscription management
- Transaction monitoring
- Platform settings
- Reports and analytics
- Support tickets
- Affiliate management

This approach is simpler than role-based access control (RBAC) and suits the platform's needs.

## Creating a Super Admin

### Prerequisites

1. MongoDB must be running
2. Backend application must be configured
3. You must have terminal access to the backend directory

### Steps

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the super admin CLI script:
   ```bash
   npm run create-superadmin
   ```

3. Choose one of the following options:
   - **Option 1: Create new super admin** - Creates a brand new user with super admin privileges
   - **Option 2: Promote existing user** - Promotes an existing user to super admin
   - **Option 3: Remove super admin status** - Demotes a super admin to regular user

4. Follow the prompts to enter the required information.

### Example: Creating a New Super Admin

```bash
$ npm run create-superadmin

🔐 Super Admin Management Tool

Choose action:
  1. Create new super admin
  2. Promote existing user to super admin
  3. Remove super admin status
Enter choice (1-3): 1

📝 Create New Super Admin

Enter full name: Admin User
Enter email: admin@vaypr.com
Enter password: ********

✅ Super admin created successfully!
   Name: Admin User
   Email: admin@vaypr.com
```

### Example: Promoting an Existing User

```bash
$ npm run create-superadmin

🔐 Super Admin Management Tool

Choose action:
  1. Create new super admin
  2. Promote existing user to super admin
  3. Remove super admin status
Enter choice (1-3): 2

⬆️  Promote User to Super Admin

Enter user email: john@example.com

✅ User promoted to super admin!
   Name: John Doe
   Email: john@example.com
```

## How It Works

### Database Field

The super admin system uses a simple boolean flag in the User entity:

```typescript
isSuperAdmin: boolean  // Default: false
```

### Backend Protection

Super admin routes are protected by the `SuperAdminGuard`:

```typescript
@UseGuards(SuperAdminGuard)
@Get('/admin/users')
async getAllUsers() {
  // Only accessible by super admin
}
```

The guard:
1. Verifies JWT authentication
2. Checks if `user.isSuperAdmin === true`
3. Returns 403 Forbidden if not super admin

### Frontend Protection

Super admin routes in the frontend are wrapped with `AdminRoute`:

```tsx
<Route path="/super-admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route path="overview" element={<Overview />} />
  {/* ... more routes */}
</Route>
```

The `AdminRoute` component:
1. Checks if user is authenticated
2. Checks if `user.isSuperAdmin === true`
3. Redirects to `/dashboard` if not super admin

### Login/Authentication

When a super admin logs in (via email/password or Google OAuth), the backend response includes:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "Admin User",
    "email": "admin@vaypr.com",
    "isSuperAdmin": true
  }
}
```

The frontend stores this in the AuthContext and uses it for route protection.

## Security Considerations

### Best Practices

1. **Single Super Admin**: Keep only one super admin account active
2. **Strong Password**: Use a strong, unique password for the super admin account
3. **Secure Access**: Never share super admin credentials
4. **Regular Audits**: Periodically review super admin access logs
5. **Revoke When Needed**: Use Option 3 to remove super admin status if needed

### What Super Admin Can Access

- `/super-admin/*` routes in the frontend
- All backend APIs protected by `SuperAdminGuard`
- User management (view, edit, delete users)
- Subscription management
- Transaction history
- Platform settings
- Analytics and reports
- Support ticket management
- Affiliate program management

### What Super Admin Cannot Do

- Login as another user (not implemented)
- Bypass other security measures (rate limiting, CORS, etc.)
- Access user passwords (encrypted in database)

## Troubleshooting

### "User not found" Error

If you get this error when promoting a user:
- Double-check the email address (case-sensitive)
- Verify the user exists in the database

### "Email already exists" Error

When creating a new super admin, this means a user with that email already exists. Use Option 2 to promote the existing user instead.

### Cannot Access Super Admin Routes

If a super admin cannot access `/super-admin` routes:

1. **Backend**: Check that the user has `isSuperAdmin: true` in MongoDB
   ```javascript
   db.users.findOne({ email: "admin@vaypr.com" })
   ```

2. **Frontend**: Verify the user object in AuthContext includes `isSuperAdmin: true`
   - Open browser DevTools → Console
   - Type: `localStorage.getItem('user')`
   - Verify the `isSuperAdmin` field

3. **Token**: The user may need to log out and log back in for the `isSuperAdmin` flag to be included in the JWT response

## CLI Script Location

The super admin management script is located at:
```
backend/src/scripts/create-superadmin.ts
```

## Backend Code References

- **SuperAdminGuard**: `backend/src/common/guards/super-admin.guard.ts`
- **User Entity**: `backend/src/user/entities/user.entity.ts`
- **User Service**: `backend/src/user/user.service.ts` (see `setSuperAdmin` method)
- **Login Service**: `backend/src/login/login.service.ts` (includes `isSuperAdmin` in response)

## Frontend Code References

- **AdminRoute**: `frontend/src/components/auth/AdminRoute.tsx`
- **User Type**: `frontend/src/types/app.ts` (includes `isSuperAdmin?: boolean`)
- **App Routes**: `frontend/src/App.tsx` (super admin routes wrapped with AdminRoute)
- **AuthContext**: `frontend/src/contexts/AuthContext.tsx` (stores user with isSuperAdmin flag)
