# How to Make a User an Admin

## Quick Method: Via Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your Budgetura project

2. **Navigate to Authentication**
   - Click **Authentication** in the left sidebar
   - Click **Users**

3. **Find Your User**
   - Locate your user account (search by email)
   - Click on the user to open their details

4. **Add Admin Role**
   - Scroll down to **User Metadata** or **App Metadata** section
   - Click **Edit** (pencil icon)

   **For `raw_app_meta_data` (Recommended - more secure):**
   ```json
   {
     "role": "admin"
   }
   ```

   **Or for `raw_user_meta_data`:**
   ```json
   {
     "role": "admin"
   }
   ```

5. **Save Changes**
   - Click **Save**
   - Log out and log back in to Budgetura

6. **Verify Admin Access**
   - Go to Settings page
   - You should now see the **Plaid Integration** section

---

## SQL Method: Bulk Admin Creation

If you need to make multiple users admins or prefer SQL:

### Make Specific User Admin

```sql
-- Replace 'user@example.com' with the actual email
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'user@example.com';
```

### Make First User Admin

```sql
-- Make the first registered user an admin
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = (
  SELECT id FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
);
```

### Check Current Admins

```sql
-- List all admin users
SELECT
  id,
  email,
  raw_app_meta_data->>'role' as app_role,
  raw_user_meta_data->>'role' as user_role,
  created_at
FROM auth.users
WHERE
  raw_app_meta_data->>'role' = 'admin'
  OR raw_user_meta_data->>'role' = 'admin';
```

### Remove Admin Role

```sql
-- Remove admin role from a user
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data - 'role'
WHERE email = 'user@example.com';
```

---

## Testing Admin Access

After making a user an admin:

1. **Log out** of Budgetura (important!)
2. **Log back in** with the admin account
3. **Go to Settings page**
4. **Scroll down** - you should see:
   ```
   🔧 Plaid Integration
   Configure Plaid API credentials (Admin Only)
   ```

If you don't see it:
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors
- Verify the metadata was saved in Supabase Dashboard

---

## Security Notes

### Why `raw_app_meta_data` is Better

**`raw_app_meta_data`:**
- ✅ Only modifiable by service_role or admin
- ✅ Users cannot edit their own permissions
- ✅ More secure for roles and permissions

**`raw_user_meta_data`:**
- ⚠️ Users can potentially modify via API
- ⚠️ Less secure for role management
- ✅ Good for user preferences (name, avatar, etc.)

### Best Practice

For production, use `raw_app_meta_data` for roles:

```sql
-- Recommended: Admin role in app metadata
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@yourcompany.com';
```

---

## Create Admin Role on User Registration

If you want new users to register as admins (not recommended for production):

```typescript
// In your registration code
const { data, error } = await supabase.auth.signUp({
  email: 'admin@example.com',
  password: 'secure_password',
  options: {
    data: {
      role: 'admin' // This goes to raw_user_meta_data
    }
  }
})
```

**Note:** This puts the role in `raw_user_meta_data`. For true security, update to `raw_app_meta_data` after registration using service_role.

---

## Troubleshooting

### Admin Section Still Not Visible

**Check 1: Verify metadata in database**
```sql
SELECT
  email,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
WHERE email = 'your@email.com';
```

**Check 2: Log out and back in**
- The auth token needs to refresh
- Simply refreshing the page won't work
- You must log out and log back in

**Check 3: Clear browser cache**
```
Chrome/Edge: Ctrl+Shift+R
Firefox: Ctrl+Shift+R
Safari: Cmd+Shift+R
```

**Check 4: Check browser console**
- Press F12
- Look for any errors
- Check if user object has the role property

### RLS Policies Not Working

If you can't access Plaid config even as admin:

```sql
-- Verify RLS policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'plaid_config';

-- Should show policies for SELECT, INSERT, UPDATE, DELETE
```

If no policies, re-run the migration.

---

## Role-Based Features

Currently, only **Plaid Integration** requires admin access. Regular users see:

- ✅ Profile & Security
- ✅ General Configuration
- ✅ AI Settings
- ✅ Billing & Subscription
- ✅ Data Management

Admins additionally see:

- ✅ **Plaid Integration** (configure credentials for all users)

---

## Future: Multiple Roles

You can extend this system with more roles:

```json
{
  "role": "admin",
  "permissions": ["manage_plaid", "view_all_users", "manage_billing"]
}
```

Or multiple roles:

```json
{
  "roles": ["admin", "moderator", "premium"]
}
```

Update the RLS policies and frontend checks accordingly.

---

## Quick Reference

**Make user admin (Dashboard):**
1. Auth → Users → Click user → Edit metadata
2. Add `{"role": "admin"}` to `raw_app_meta_data`
3. Save, log out, log back in

**Make user admin (SQL):**
```sql
UPDATE auth.users
SET raw_app_meta_data = '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

**Check if you're admin (Browser console):**
```javascript
console.log(user?.raw_app_meta_data?.role);
// Should output: "admin"
```

---

**Created:** December 4, 2025
**For:** Budgetura Settings Enhancement
