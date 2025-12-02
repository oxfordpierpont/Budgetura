# 🚨 BLACK SCREEN FIX - Dokploy Deployment

## Problem
Your Budgetura app shows a black screen because **Vite environment variables are not available at build time**.

## Quick Fix (5 minutes)

### Step 1: Configure Build Arguments in Dokploy

1. **Login to Dokploy** dashboard
2. **Navigate to Budgetura application**
3. **Go to Settings** → **Build Configuration**
4. **Find "Build Args" or "Build Arguments" section**
5. **Add these build arguments:**

```
VITE_SUPABASE_URL=https://supabase.sec-admn.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWJ1ZGdldHVyYSIsImlhdCI6MTc2NDU4NDE1NywiZXhwIjoyMDc5OTQ0MTU3fQ.rh-uKFbg0TXBIYSOnf-TB0UHSMvoL43E--ifGyJr_UU
VITE_APP_TITLE=Budgetura
```

> ⚠️ **CRITICAL:** These MUST be set as **Build Arguments**, NOT regular environment variables!

### Step 2: Redeploy

1. **Save the build arguments**
2. **Click "Redeploy" or "Rebuild"**
3. **Wait for build to complete** (2-3 minutes)
4. **Test the application**

### Step 3: Verify Fix

1. **Open your app URL** in browser
2. **You should see the login page** (not black screen)
3. **Check browser console** (F12) - no Supabase errors

---

## Why This Happens

Vite (the build tool) bundles environment variables into the JavaScript at **build time**, not runtime:

```
❌ Regular env vars → Available at runtime → Too late for Vite
✅ Build arguments   → Available at build time → Vite can bundle them
```

The Dockerfile now accepts build arguments:

```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build  # ← Environment vars available here!
```

---

## Verification Checklist

- [ ] Build arguments configured in Dokploy (Settings → Build Configuration)
- [ ] Application redeployed
- [ ] Login page visible (not black screen)
- [ ] No console errors about Supabase credentials
- [ ] Can create an account and login

---

## Still Having Issues?

### Check Build Logs
1. Go to Dokploy → Budgetura → Logs
2. Look for build errors
3. Verify "npm run build" completes successfully

### Check Browser Console
1. Press F12 to open developer tools
2. Look for error messages
3. Common errors:
   - "Supabase credentials not found" → Build args not set correctly
   - Network errors to Supabase → Check Supabase is accessible
   - 404 errors → Routing issue, check nginx config

### Verify Supabase Connection
1. Open browser console
2. Try to access: `https://supabase.sec-admn.com`
3. Should see Supabase welcome page or API response

---

## Need Help?

If you're still experiencing issues after following these steps:

1. Check the full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Review build logs in Dokploy
3. Verify Supabase credentials are correct
4. Ensure GitHub has the latest code (this commit)

---

**Last Updated:** 2025-12-02
**Issue:** Black screen on Dokploy deployment
**Solution:** Configure build arguments for Vite environment variables
