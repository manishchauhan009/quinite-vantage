# Quick Fix SQL Commands

Run these in Supabase SQL Editor to diagnose and fix the issue:

```sql
-- 1. Check if profile exists for this user
SELECT * FROM profiles WHERE id = '4f15480a-edd9-408b-9232-80060bb4f0bb';

-- 2. Check if profile exists but query is failing
SELECT 
  p.*,
  o.id as org_id,
  o.name as org_name,
  o.onboarding_status,
  r.id as role_id,
  r.name as role_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.id = '4f15480a-edd9-408b-9232-80060bb4f0bb';

-- 3. If profile doesn't exist, create it manually
-- (Replace with actual user email)
INSERT INTO profiles (id, email, created_at, updated_at)
VALUES ('4f15480a-edd9-408b-9232-80060bb4f0bb', 'sunnysingh889014@gmail.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Check all auth users vs profiles
SELECT 
  u.id,
  u.email,
  CASE WHEN p.id IS NULL THEN 'Missing Profile' ELSE 'Has Profile' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
```

Run these queries and share the results!
