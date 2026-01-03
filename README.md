<!-- # Multi-Tenant SaaS Platform

A comprehensive multi-tenant SaaS application built with Next.js, Supabase, and PostgreSQL featuring role-based access control, organization management, and audit logging.

## Features

### Authentication & Authorization
- ✅ Email/password authentication via Supabase Auth
- ✅ Separate login flows for regular users and platform admins
- ✅ Automatic profile creation on signup
- ✅ Session management with automatic redirects

### Multi-Tenancy
- ✅ Organization-based isolation
- ✅ Users belong to exactly one organization
- ✅ Automatic organization creation on signup
- ✅ Row-level security policies

### Role-Based Access Control
- ✅ Pre-defined roles: Platform Admin, Client Super Admin, Manager, Employee
- ✅ Feature-based permissions system
- ✅ Customizable permissions per user
- ✅ Role templates with default permissions

### Permissions
- **Projects**: create, edit, view
- **Campaigns**: create, edit, run, view
- **Leads**: upload, edit, view
- **Analytics**: view_basic
- **Billing**: view
- **Users**: create, edit
- **Audit**: view

### Audit Trail
- ✅ Complete activity logging
- ✅ Tracks: user, action, entity type, entity ID, timestamp
- ✅ Automatic logging on user creation and permission changes
- ✅ Organization-scoped audit logs

### Dashboard
- ✅ Responsive sidebar navigation
- ✅ Permission-based UI rendering
- ✅ Protected routes
- ✅ Role indicators
- ✅ Organization context

### Pages
- Dashboard - Overview with stats
- Projects - Project management (empty shell)
- Campaigns - Campaign management (empty shell)
- Leads - Lead management (empty shell)
- Analytics - Performance metrics (empty shell)
- Users - User management with role assignment (Super Admin only)
- Audit Logs - Complete activity history

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Database Schema

### Tables
1. **organizations** - Organization details
2. **profiles** - User profiles (extends auth.users)
3. **roles** - Role definitions
4. **features** - Permission features
5. **role_permissions** - Role-to-permission mappings
6. **user_permissions** - User-specific permission overrides
7. **audit_logs** - Activity audit trail

## Setup Instructions

### 1. Database Setup

Run the SQL migration in your Supabase SQL Editor:
```bash
# File: database/schema.sql
```

This will:
- Create all necessary tables
- Set up Row Level Security policies
- Pre-populate roles and features
- Assign default role permissions
- Create automatic profile creation trigger

### 2. Environment Variables

Already configured in `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://dlbxhbukzyygbabrujuv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### 3. Supabase Dashboard Configuration

In your Supabase Dashboard (Authentication → URL Configuration):

**Redirect URLs to add:**
```
https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/auth/callback
https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/**
```

### 4. Create Platform Admin (Manual)

Since Platform Admin doesn't have signup, create manually in Supabase:

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with email/password
3. Note the user ID
4. Run this SQL in SQL Editor:
```sql
UPDATE profiles 
SET is_platform_admin = TRUE, 
    role_id = (SELECT id FROM roles WHERE name = 'Platform Admin')
WHERE id = 'USER_ID_HERE';
```

### 5. Start Application

```bash
yarn install
yarn dev
```

Application runs on: `http://localhost:3000`

## User Flows

### Regular User Signup
1. Visit homepage
2. Click "Sign Up" tab
3. Enter: Full Name, Organization Name, Email, Password
4. User is created as Client Super Admin
5. Organization is created automatically
6. Redirected to dashboard

### Regular User Login
1. Visit homepage
2. Enter email and password
3. Click "Sign In"
4. Redirected to dashboard

### Platform Admin Login
1. Visit `/admin-login`
2. Enter admin email and password
3. Login validates platform admin status
4. Redirected to dashboard with full access

## Default Role Permissions

### Client Super Admin
- Full access to all features within organization
- Can create and manage users
- Can view audit logs
- Cannot access other organizations

### Manager
- All Employee permissions
- Analytics access
- Can create/edit/run campaigns
- Can create/edit projects

### Employee
- View projects
- View campaigns
- View leads
- Basic access only

## Permission System

### How It Works
1. **Role Permissions**: Default permissions assigned to roles
2. **User Overrides**: Specific permissions can be granted/revoked per user
3. **Platform Admin**: Bypasses all permission checks
4. **Organization Scope**: Regular users only see data in their organization

### Checking Permissions
```javascript
// Backend
const canCreate = await hasPermission(supabase, userId, 'project.create')

// Frontend (from user context)
const canView = permissions.includes('analytics.view_basic')
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account + organization
- `POST /api/auth/signin` - Login (regular or admin)
- `POST /api/auth/signout` - Logout
- `GET /api/auth/user` - Get current user with permissions

### Users
- `GET /api/users` - List organization users
- `POST /api/users` - Create new user
- `PUT /api/users/:id/permissions` - Update user permissions

### Reference Data
- `GET /api/roles` - List all roles
- `GET /api/features` - List all features
- `GET /api/organizations` - List organizations

### Audit
- `GET /api/audit?limit=50` - Get audit logs

## Security Features

### Row Level Security (RLS)
- Organizations: Users can only see their own organization
- Profiles: Users can view profiles in their organization
- Audit Logs: Users can only see logs from their organization
- Platform Admins bypass these restrictions

### Authentication
- Session-based auth with Supabase
- Automatic token refresh
- Protected API routes
- Client and server-side auth checks

### Permission Enforcement
- Backend permission checks on all protected routes
- Frontend UI adapts based on permissions
- Audit logging for sensitive actions

## File Structure

```
/app
├── app/
│   ├── page.js                    # Auth page (login/signup)
│   ├── admin-login/page.js        # Platform admin login
│   ├── dashboard/
│   │   ├── layout.js              # Dashboard layout with sidebar
│   │   ├── page.js                # Dashboard home
│   │   ├── projects/page.js       # Projects page
│   │   ├── campaigns/page.js      # Campaigns page
│   │   ├── leads/page.js          # Leads page
│   │   ├── analytics/page.js      # Analytics page
│   │   ├── users/page.js          # User management
│   │   └── audit/page.js          # Audit logs
│   └── api/[[...path]]/route.js   # API routes
├── lib/
│   ├── supabase/
│   │   ├── client.js              # Browser Supabase client
│   │   └── server.js              # Server Supabase client
│   └── permissions.js             # Permission utilities
├── database/
│   └── schema.sql                 # Database schema
└── components/ui/                 # shadcn components

```

## Next Steps

This MVP provides the foundation. Here's what to add next:

### Phase 2 - Core Features
- [ ] Complete project management (CRUD)
- [ ] Complete campaign management
- [ ] Lead import/export functionality
- [ ] Real analytics with charts

### Phase 3 - Advanced Features
- [ ] AI calling integration
- [ ] Email/SMS campaigns
- [ ] Billing integration (Stripe)
- [ ] Advanced permission editor UI
- [ ] User invitation system
- [ ] Password reset flow

### Phase 4 - Enterprise
- [ ] SSO integration
- [ ] Advanced analytics
- [ ] API rate limiting
- [ ] Webhooks
- [ ] Multi-language support

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Check browser console for frontend errors
3. Check server logs: `tail -f /var/log/supervisor/nextjs.out.log`

## License

Proprietary - All rights reserved -->

# Multi-Tenant SaaS Platform

A comprehensive multi-tenant SaaS application built with Next.js, Supabase, and PostgreSQL featuring role-based access control, organization management, and audit logging.

## Features

### Authentication & Authorization
- ✅ Email/password authentication via Supabase Auth
- ✅ Separate login flows for regular users and platform admins
- ✅ Automatic profile creation on signup
- ✅ Session management with automatic redirects

### Multi-Tenancy
- ✅ Organization-based isolation
- ✅ Users belong to exactly one organization
- ✅ Automatic organization creation on signup
- ✅ Row-level security policies

### Role-Based Access Control
- ✅ Pre-defined roles: Platform Admin, Client Super Admin, Manager, Employee
- ✅ Feature-based permissions system
- ✅ Customizable permissions per user
- ✅ Role templates with default permissions

### Permissions
- **Projects**: create, edit, view
- **Campaigns**: create, edit, run, view
- **Leads**: upload, edit, view
- **Analytics**: view_basic
- **Billing**: view
- **Users**: create, edit
- **Audit**: view

### Audit Trail
- ✅ Complete activity logging
- ✅ Tracks: user, action, entity type, entity ID, timestamp
- ✅ Automatic logging on user creation and permission changes
- ✅ Organization-scoped audit logs

### Dashboard
- ✅ Responsive sidebar navigation
- ✅ Permission-based UI rendering
- ✅ Protected routes
- ✅ Role indicators
- ✅ Organization context

### Pages
- Dashboard - Overview with stats
- Projects - Project management (empty shell)
- Campaigns - Campaign management (empty shell)
- Leads - Lead management (empty shell)
- Analytics - Performance metrics (empty shell)
- Users - User management with role assignment (Super Admin only)
- Audit Logs - Complete activity history

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Database Schema

### Tables
1. **organizations** - Organization details
2. **profiles** - User profiles (extends auth.users)
3. **roles** - Role definitions
4. **features** - Permission features
5. **role_permissions** - Role-to-permission mappings
6. **user_permissions** - User-specific permission overrides
7. **audit_logs** - Activity audit trail

## Setup Instructions

### 1. Database Setup

Run the SQL migration in your Supabase SQL Editor:
```bash
# File: database/schema.sql
```

This will:
- Create all necessary tables
- Set up Row Level Security policies
- Pre-populate roles and features
- Assign default role permissions
- Create automatic profile creation trigger

### 2. Environment Variables

Already configured in `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://dlbxhbukzyygbabrujuv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### 3. Supabase Dashboard Configuration

In your Supabase Dashboard (Authentication → URL Configuration):

**Redirect URLs to add:**
```
https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/auth/callback
https://6e5ca5f8-8fae-4bf5-8e5f-8b2b651de5d6.e1.dev.codezero.emergent.app/**
```

### 4. Create Platform Admin (Manual)

Since Platform Admin doesn't have signup, create manually in Supabase:

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with email/password
3. Note the user ID
4. Run this SQL in SQL Editor:
```sql
UPDATE profiles 
SET is_platform_admin = TRUE, 
    role_id = (SELECT id FROM roles WHERE name = 'Platform Admin')
WHERE id = 'USER_ID_HERE';
```

### 5. Start Application

```bash
yarn install
yarn dev
```

Application runs on: `http://localhost:3000`

## User Flows

### Regular User Signup
1. Visit homepage
2. Click "Sign Up" tab
3. Enter: Full Name, Organization Name, Email, Password
4. User is created as Client Super Admin
5. Organization is created automatically
6. Redirected to dashboard

### Regular User Login
1. Visit homepage
2. Enter email and password
3. Click "Sign In"
4. Redirected to dashboard

### Platform Admin Login
1. Visit `/admin-login`
2. Enter admin email and password
3. Login validates platform admin status
4. Redirected to dashboard with full access

## Default Role Permissions

### Client Super Admin
- Full access to all features within organization
- Can create and manage users
- Can view audit logs
- Cannot access other organizations

### Manager
- All Employee permissions
- Analytics access
- Can create/edit/run campaigns
- Can create/edit projects

### Employee
- View projects
- View campaigns
- View leads
- Basic access only

## Permission System

### How It Works
1. **Role Permissions**: Default permissions assigned to roles
2. **User Overrides**: Specific permissions can be granted/revoked per user
3. **Platform Admin**: Bypasses all permission checks
4. **Organization Scope**: Regular users only see data in their organization

### Checking Permissions
```javascript
// Backend
const canCreate = await hasPermission(supabase, userId, 'project.create')

// Frontend (from user context)
const canView = permissions.includes('analytics.view_basic')
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account + organization
- `POST /api/auth/signin` - Login (regular or admin)
- `POST /api/auth/signout` - Logout
- `GET /api/auth/user` - Get current user with permissions

### Users
- `GET /api/users` - List organization users
- `POST /api/users` - Create new user
- `PUT /api/users/:id/permissions` - Update user permissions

### Reference Data
- `GET /api/roles` - List all roles
- `GET /api/features` - List all features
- `GET /api/organizations` - List organizations

### Audit
- `GET /api/audit?limit=50` - Get audit logs

## Security Features

### Row Level Security (RLS)
- Organizations: Users can only see their own organization
- Profiles: Users can view profiles in their organization
- Audit Logs: Users can only see logs from their organization
- Platform Admins bypass these restrictions

### Authentication
- Session-based auth with Supabase
- Automatic token refresh
- Protected API routes
- Client and server-side auth checks

### Permission Enforcement
- Backend permission checks on all protected routes
- Frontend UI adapts based on permissions
- Audit logging for sensitive actions

## File Structure

```
/app
├── app/
│   ├── page.js                    # Auth page (login/signup)
│   ├── admin-login/page.js        # Platform admin login
│   ├── dashboard/
│   │   ├── layout.js              # Dashboard layout with sidebar
│   │   ├── page.js                # Dashboard home
│   │   ├── projects/page.js       # Projects page
│   │   ├── campaigns/page.js      # Campaigns page
│   │   ├── leads/page.js          # Leads page
│   │   ├── analytics/page.js      # Analytics page
│   │   ├── users/page.js          # User management
│   │   └── audit/page.js          # Audit logs
│   └── api/[[...path]]/route.js   # API routes
├── lib/
│   ├── supabase/
│   │   ├── client.js              # Browser Supabase client
│   │   └── server.js              # Server Supabase client
│   └── permissions.js             # Permission utilities
├── database/
│   └── schema.sql                 # Database schema
└── components/ui/                 # shadcn components

```

## Next Steps

This MVP provides the foundation. Here's what to add next:

### Phase 2 - Core Features
- [ ] Complete project management (CRUD)
- [ ] Complete campaign management
- [ ] Lead import/export functionality
- [ ] Real analytics with charts

### Phase 3 - Advanced Features
- [ ] AI calling integration
- [ ] Email/SMS campaigns
- [ ] Billing integration (Stripe)
- [ ] Advanced permission editor UI
- [ ] User invitation system
- [ ] Password reset flow

### Phase 4 - Enterprise
- [ ] SSO integration
- [ ] Advanced analytics
- [ ] API rate limiting
- [ ] Webhooks
- [ ] Multi-language support

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Check browser console for frontend errors
3. Check server logs: `tail -f /var/log/supervisor/nextjs.out.log`

## License

Proprietary - All rights reserved
