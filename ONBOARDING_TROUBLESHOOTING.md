# 🔍 Onboarding Screen Not Showing - Troubleshooting Guide

## Issue
The onboarding screen is not appearing after user signup/login.

## Root Causes & Solutions

### ✅ Fix Applied: API Not Returning onboarding_status

**Problem:** The `/api/auth/user` endpoint was not fetching `onboarding_status` from organizations table.

**Fix Applied:** Updated the query to include `onboarding_status`:
```javascript
// Before
organization:organizations(id, name)

// After
organization:organizations(id, name, onboarding_status)
```

---

## Debugging Steps

### Step 1: Check Database

**Verify organization was created with PENDING status:**

```sql
-- Check organizations
SELECT id, name, onboarding_status, created_at 
FROM organizations 
ORDER BY created_at DESC 
LIMIT 5;

-- Should show onboarding_status = 'PENDING' for new orgs
```

**If onboarding_status is NULL or missing:**
```sql
-- Add the column
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'PENDING';

-- Update existing organizations
UPDATE organizations 
SET onboarding_status = 'PENDING' 
WHERE onboarding_status IS NULL;
```

---

### Step 2: Check User Profile

**Verify user has organization_id:**

```sql
SELECT 
  p.email, 
  p.organization_id,
  o.name as org_name,
  o.onboarding_status,
  r.name as role
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.email = 'your-test-email@example.com';
```

**Expected Result:**
- organization_id: Should have a UUID
- org_name: Should show organization name
- onboarding_status: Should be 'PENDING'
- role: Should be 'Client Super Admin'

**If organization_id is NULL:**
The onboarding API didn't complete properly. Re-run onboarding or manually fix:

```sql
-- Create org if missing
INSERT INTO organizations (name, onboarding_status)
VALUES ('Test Org', 'PENDING')
RETURNING id;

-- Update user's profile with org_id
UPDATE profiles 
SET organization_id = 'PASTE_ORG_ID_HERE'
WHERE email = 'your-test-email@example.com';
```

---

### Step 3: Test API Response

**Visit Debug Page:**
```
http://localhost:3000/debug
```

This will show you the exact data structure returned by `/api/auth/user`.

**Expected Structure:**
```json
{
  "session": true,
  "userData": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "profile": {
        "organization_id": "uuid",
        "role_id": "uuid",
        "organization": {
          "id": "uuid",
          "name": "Test Org",
          "onboarding_status": "PENDING"  ← CRITICAL
        },
        "role": {
          "name": "Client Super Admin"
        }
      }
    }
  }
}
```

**If `onboarding_status` is missing:**
- Run the updated migration again
- Make sure the API fix is deployed (restart: `sudo supervisorctl restart nextjs`)

---

### Step 4: Check Browser Console

**Open browser console (F12) and check for errors:**

1. After login, watch for API calls
2. Look for `/api/auth/user` request
3. Check the response - does it have `onboarding_status`?

**Common Issues:**
- API returns 401: User not logged in
- API returns but missing `organization`: User profile not linked to org
- API returns but missing `onboarding_status`: Database column missing or API not updated

---

### Step 5: Manual Test Flow

**Complete signup flow manually:**

```bash
# 1. Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"test123456"}'

# 2. Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"test123456"}' \
  -c cookies.txt

# 3. Run onboarding
curl -X POST http://localhost:3000/api/onboard \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"fullName":"Test User","organizationName":"Test Corp"}'

# 4. Check user data
curl -X GET http://localhost:3000/api/auth/user \
  -b cookies.txt
```

---

### Step 6: Check Dashboard Layout Logic

The dashboard layout should redirect to `/onboarding` if status is PENDING.

**Verify the logic in `/app/app/dashboard/layout.js`:**

```javascript
// Check onboarding status
if (data.user.profile?.organization?.onboarding_status === 'PENDING') {
  router.push('/onboarding')
  return
}
```

**If this isn't working:**
- Make sure Next.js restarted after code changes
- Check browser console for any JavaScript errors
- Try hard refresh (Ctrl+Shift+R)

---

## Quick Fixes

### Fix 1: Force User to Onboarding

If a user is stuck, manually set status to PENDING:

```sql
UPDATE organizations 
SET onboarding_status = 'PENDING'
WHERE id = (
  SELECT organization_id FROM profiles WHERE email = 'stuck-user@example.com'
);
```

Then have user logout and login again.

### Fix 2: Complete Onboarding Manually

If onboarding is broken, complete it manually:

```sql
-- Update organization profile
INSERT INTO organization_profiles (
  organization_id, sector, business_type, 
  company_name, contact_number, 
  address_line_1, city, state, pincode, country
)
VALUES (
  'ORG_ID_HERE', 'real_estate', 'agent',
  'Test Company', '+91 9876543210',
  '123 Main St', 'Mumbai', 'Maharashtra', '400001', 'India'
);

-- Mark onboarding complete
UPDATE organizations 
SET onboarding_status = 'COMPLETED'
WHERE id = 'ORG_ID_HERE';
```

### Fix 3: Clear Browser Cache

Sometimes cached redirects cause issues:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

---

## Testing Checklist

After fixes, test this flow:

1. ✅ **Signup**: Create new account
2. ✅ **Verify DB**: Check org created with PENDING status
3. ✅ **Login**: Sign in with new account
4. ✅ **Check Redirect**: Should go to `/onboarding`
5. ✅ **See Wizard**: 5-step onboarding form visible
6. ✅ **Complete Steps**: Fill all 5 steps
7. ✅ **Submit**: Click "Complete Onboarding"
8. ✅ **Verify DB**: onboarding_status = 'COMPLETED'
9. ✅ **Check Redirect**: Should go to `/dashboard`
10. ✅ **Dashboard Access**: Can see dashboard properly

---

## Still Not Working?

**Run these diagnostic queries:**

```sql
-- 1. Check if onboarding_status column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' AND column_name = 'onboarding_status';

-- 2. Check all organizations
SELECT * FROM organizations;

-- 3. Check specific user
SELECT 
  p.*,
  o.name as org_name,
  o.onboarding_status
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.email = 'your@email.com';

-- 4. Check if organization_profiles table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'organization_profiles';
```

---

## Expected Behavior

### New User Signup Flow:
```
Signup → POST /api/auth/signup → Auth user created
  ↓
Login → POST /api/auth/signin → Session created
  ↓
Onboard → POST /api/onboard → Org created (PENDING)
  ↓
Login again → GET /api/auth/user → Returns onboarding_status: PENDING
  ↓
Dashboard Layout → Checks status → Redirects to /onboarding
  ↓
Onboarding Page → Shows 5-step wizard
  ↓
Complete → POST /api/organization/profile → Sets COMPLETED
  ↓
Redirect → /dashboard → Normal dashboard access
```

---

## Contact Points

If issue persists, provide:
1. Result of `/debug` page (JSON output)
2. SQL query results from Step 2
3. Browser console errors (if any)
4. Server logs: `tail -f /var/log/supervisor/nextjs.out.log`
