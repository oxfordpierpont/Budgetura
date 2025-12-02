# 🚀 Plaid Integration - Deploy Now Checklist

Everything is ready to deploy! Follow these steps in order.

## Prerequisites ✅

- [x] Plaid credentials in Supabase Vault (`client_id`, `secret`, `environment`)
- [x] Code committed and pushed to GitHub
- [x] Frontend updated to call backend API
- [x] Backend service created and ready to deploy

---

## Step 1: Run Database Migration (5 minutes)

### Create Plaid Tables in Supabase

1. Go to https://supabase.sec-admn.com
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Open this file on your computer: `supabase/migrations/001_plaid_tables.sql`
5. Copy the **entire contents** (all 106 lines)
6. Paste into the SQL Editor
7. Click **Run** or press `Ctrl+Enter`
8. ✅ You should see: "Success. No rows returned"

### Verify Tables Created

1. Click **Database** in left sidebar
2. Click **Tables**
3. ✅ Confirm you see these 3 new tables:
   - `plaid_items`
   - `plaid_accounts`
   - `plaid_transactions`

**✅ Step 1 Complete** when you see all 3 tables.

---

## Step 2: Get Supabase Service Role Key (2 minutes)

1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **API** section
3. Scroll to **Project API keys**
4. Find the **service_role** key (different from `anon` key)
5. Click **Reveal** to see the full key
6. Copy it - you'll need it in Step 3

⚠️ **Important**: This is a SECRET key with full database access. Don't share it publicly!

**Example format** (yours will be different):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MTU1MDAwMDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**✅ Step 2 Complete** when you have the service_role key copied.

---

## Step 3: Deploy Plaid Backend on Dokploy (10 minutes)

### Create New App

1. Go to your Dokploy dashboard
2. Click **Create Application** (or similar)
3. Fill in:
   - **Name**: `budgetura-plaid-backend`
   - **Type**: Docker / GitHub
   - **Repository**: Select your Budgetura repository (already connected)
   - **Branch**: `main`

### Configure Build Settings

1. **Build Context**: `plaid-backend`
2. **Dockerfile Path**: `plaid-backend/Dockerfile` (or just `Dockerfile` if it auto-detects)
3. **Port**: `3001`

### Add Environment Variables

Add these 3 environment variables:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://supabase.sec-admn.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Paste the key from Step 2 |
| `PORT` | `3001` |

### Deploy

1. Click **Deploy** or **Create**
2. Wait for deployment to complete (check logs)
3. ✅ Deployment successful when you see: "Plaid backend running on port 3001"
4. Note the deployed URL (e.g., `https://budgetura-plaid-backend.your-domain.com`)

### Test Backend

Open this URL in your browser (replace with your actual URL):
```
https://budgetura-plaid-backend.your-domain.com/health
```

✅ You should see:
```json
{"status":"ok","service":"budgetura-plaid-backend"}
```

**✅ Step 3 Complete** when health check returns OK.

---

## Step 4: Update Main App Environment Variable (3 minutes)

### Add Backend URL to Main App

1. In Dokploy, go to your **main Budgetura app** (not the backend)
2. Go to **Environment Variables** or **Settings**
3. Add new environment variable:

| Name | Value |
|------|-------|
| `VITE_PLAID_BACKEND_URL` | Your backend URL from Step 3 |

**Example**:
```
VITE_PLAID_BACKEND_URL=https://budgetura-plaid-backend.your-domain.com
```

⚠️ **Important**: No trailing slash!

### Redeploy Main App

1. Click **Redeploy** or **Rebuild** for the main Budgetura app
2. Wait for deployment to complete
3. ✅ Main app should now be able to communicate with Plaid backend

**✅ Step 4 Complete** when main app is redeployed with new env var.

---

## Step 5: Test the Integration! (5 minutes)

### Test Bank Connection

1. Open your deployed Budgetura app
2. Log in to your account
3. In the sidebar, click **Bank Accounts** (new menu item)
4. Click **Connect Bank Account** button
5. ✅ Plaid Link modal should appear

### Complete Test Connection

1. Select any test bank (e.g., "First Platypus Bank")
2. Use Plaid Sandbox credentials:
   - **Username**: `user_good`
   - **Password**: `pass_good`
   - **2FA** (if prompted): `1234`
3. Select one or more accounts
4. Click **Continue**
5. ✅ You should see success message: "Bank account connected successfully!"

### Verify Data Stored

1. Go back to Supabase dashboard
2. Click **Database** → **Tables** → **plaid_items**
3. ✅ You should see 1 row with your connection
4. Click **plaid_accounts** table
5. ✅ You should see row(s) for each account you connected

**✅ Step 5 Complete** when:
- [ ] Plaid Link modal appears
- [ ] Can complete connection with test credentials
- [ ] See success message in app
- [ ] See data in Supabase tables

---

## 🎉 Success Criteria

You'll know everything is working when:

✅ **Database**:
- 3 Plaid tables exist in Supabase
- Data appears in tables after connection

✅ **Backend**:
- Health check returns 200 OK
- No errors in Dokploy logs
- Backend can read from Vault

✅ **Frontend**:
- Bank Accounts menu appears in sidebar
- Clicking "Connect Bank Account" opens Plaid Link
- Can complete connection with test credentials
- Success message appears

✅ **Integration**:
- Connected accounts appear in UI
- Can disconnect accounts
- Data persists after page refresh

---

## 🐛 Troubleshooting

### Problem: "Failed to create link token"

**Check**:
1. Backend deployed and running
2. VITE_PLAID_BACKEND_URL set correctly in main app
3. Backend health check works
4. Plaid credentials in Vault are correct

**Fix**: Check backend logs in Dokploy

### Problem: "Plaid credentials not found in Vault"

**Check**:
1. Vault has `client_id`, `secret`, `environment` secrets
2. SUPABASE_SERVICE_ROLE_KEY is correct
3. Backend can reach Supabase

**Fix**: Verify service role key and redeploy backend

### Problem: Backend won't start

**Check**:
1. Environment variables set correctly
2. Port 3001 available
3. Build completed successfully

**Fix**: Check Dokploy build logs for errors

### Problem: Plaid Link won't open

**Check**:
1. Browser console for errors
2. VITE_PLAID_BACKEND_URL is accessible
3. CORS enabled (it is by default)

**Fix**: Check browser console and network tab

### Problem: Database tables not found

**Check**:
1. Migration ran successfully
2. Connected to correct Supabase project

**Fix**: Re-run migration SQL in Supabase SQL Editor

---

## 📞 Need Help?

### Check Logs

**Backend logs**: Dokploy → plaid-backend app → Logs
**Frontend logs**: Browser → Console (F12)
**Database logs**: Supabase → Logs

### Verify Each Component

1. **Supabase Vault**: Can see secrets in Vault UI
2. **Backend Health**: `/health` endpoint returns OK
3. **Frontend Build**: No errors in browser console
4. **Network**: Check browser Network tab for failed requests

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS error | Backend has CORS enabled by default, check URL |
| 404 on backend | Check VITE_PLAID_BACKEND_URL is correct |
| Vault access denied | Verify SERVICE_ROLE_KEY is correct |
| Tables not found | Run migration SQL |

---

## 📚 Documentation Reference

- **Full deployment guide**: [PLAID_BACKEND_DEPLOYMENT.md](PLAID_BACKEND_DEPLOYMENT.md)
- **Implementation verification**: [PLAID_IMPLEMENTATION_VERIFIED.md](PLAID_IMPLEMENTATION_VERIFIED.md)
- **Vault setup**: [supabase/VAULT_SETUP_COMPLETE.md](supabase/VAULT_SETUP_COMPLETE.md)
- **Backend README**: [plaid-backend/README.md](plaid-backend/README.md)

---

## 🔐 Security Checklist

Before going to production:

- [ ] Service Role Key never exposed to frontend
- [ ] Plaid credentials in Vault (not in code)
- [ ] HTTPS enabled for backend
- [ ] HTTPS enabled for main app
- [ ] Using Sandbox credentials (switch to Production when ready)
- [ ] Regular secret rotation scheduled

---

## 🚀 After Successful Deployment

Once everything works in Sandbox:

1. **Test thoroughly** with different banks and scenarios
2. **Monitor logs** for any unexpected errors
3. **Gather user feedback** on the bank connection flow
4. **When ready for production**:
   - Get Production Plaid credentials
   - Update Vault: change `environment` to `production`
   - Update Vault: change `secret` to Production secret
   - Test again!

---

## Version Info

- **Budgetura**: v2.2.0
- **Plaid Integration**: Complete and verified
- **Last Updated**: 2025-12-02
- **Status**: Ready for deployment ✅

---

Good luck with deployment! 🎉
