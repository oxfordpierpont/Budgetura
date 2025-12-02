# Plaid Backend Deployment Guide

## 🎯 Overview

Since your self-hosted Supabase doesn't have Edge Functions, I've created a standalone Node.js backend service that handles Plaid API integration.

**Location**: `/plaid-backend/`

## ✅ What's Been Created

### Backend Service
- **`plaid-backend/index.js`** - Express server with Plaid API endpoints
- **`plaid-backend/package.json`** - Dependencies (Express, Plaid SDK, Supabase)
- **`plaid-backend/Dockerfile`** - For containerized deployment
- **`plaid-backend/.env.example`** - Environment variables template

### Frontend Updates
- **`src/lib/supabase/operations.ts`** - Updated to call backend API instead of Edge Functions
- **`.env.example`** - Added `VITE_PLAID_BACKEND_URL` configuration

## 📋 Deployment Steps

### Step 1: Get Supabase Service Role Key

1. Go to https://supabase.sec-admn.com
2. Navigate to **Settings** → **API**
3. Look for **service_role** key (this is a SECRET key, not the public anon key)
4. Copy it - you'll need it in Step 3

**⚠️ Important**: This is different from the `anon` key. The service_role key has full database access.

### Step 2: Run Database Migration

If you haven't already:

1. Go to https://supabase.sec-admn.com → **SQL Editor**
2. Copy contents of `supabase/migrations/001_plaid_tables.sql`
3. Run it to create Plaid tables

### Step 3: Deploy Backend on Dokploy

#### Option A: Same Repository (Recommended)

1. In Dokploy, create a new application:
   - **Name**: `budgetura-plaid-backend`
   - **Type**: Docker/GitHub
   - **Repository**: Same as main app (already connected)
   - **Branch**: main

2. Configure build settings:
   - **Build Context**: `plaid-backend`
   - **Dockerfile Path**: `plaid-backend/Dockerfile`
   - **Port**: `3001`

3. Add environment variables:
   ```
   SUPABASE_URL=https://supabase.sec-admn.com
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-step-1>
   PORT=3001
   ```

4. Deploy the backend

5. Note the deployed URL (e.g., `https://budgetura-plaid-backend.your-domain.com`)

#### Option B: Separate Deployment

If Dokploy doesn't support multiple apps from one repo:

**On the server:**
```bash
# Clone and navigate
cd /opt/
git clone https://github.com/oxfordpierpont/Budgetura.git plaid-backend
cd plaid-backend/plaid-backend

# Create .env file
cp .env.example .env
nano .env  # Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# Install and run with PM2
npm install
npm install -g pm2
pm2 start index.js --name plaid-backend
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### Step 4: Configure Main App

Update your main Budgetura app's environment variables:

1. In Dokploy (or wherever main app is deployed):
   - Add environment variable:
   ```
   VITE_PLAID_BACKEND_URL=https://budgetura-plaid-backend.your-domain.com
   ```

2. For local development, create `.env`:
   ```
   VITE_PLAID_BACKEND_URL=http://localhost:3001
   ```

3. Redeploy the main app to pick up the new environment variable

### Step 5: Test the Integration

1. Deploy both services
2. Go to your Budgetura app
3. Navigate to **Bank Accounts**
4. Click **Connect Bank Account**
5. Should see Plaid Link modal
6. Test with:
   - Username: `user_good`
   - Password: `pass_good`

## 🔧 Architecture

```
┌─────────────────┐         ┌────────────────────┐         ┌──────────────┐
│  Budgetura App  │────────>│  Plaid Backend     │────────>│  Plaid API   │
│  (React/Vite)   │         │  (Node.js/Express) │         │  (External)  │
└─────────────────┘         └────────────────────┘         └──────────────┘
         │                            │
         │                            │
         └────────────────────────────┴──────────> Supabase Database
                                                   (plaid_items, plaid_accounts)
```

## 📍 API Endpoints

The backend exposes:

- `GET /health` - Health check
- `POST /api/plaid/create-link-token` - Create Plaid Link token
- `POST /api/plaid/exchange-token` - Exchange public token and store connection

## 🐛 Troubleshooting

### Backend won't start - "Plaid credentials not found"

**Check:**
1. Supabase Vault has `client_id`, `secret`, `environment`
2. `SUPABASE_SERVICE_ROLE_KEY` is correct and has Vault access
3. Backend can reach Supabase (network/firewall)

**Test Vault access:**
```bash
curl -X POST https://supabase.sec-admn.com/rest/v1/vault.decrypted_secrets \
  -H "apikey: <your-anon-key>" \
  -H "Authorization: Bearer <your-service-role-key>"
```

### Frontend can't reach backend

**Check:**
1. `VITE_PLAID_BACKEND_URL` is set correctly
2. Backend is running (check Dokploy logs or `pm2 logs`)
3. CORS is enabled (it is by default in index.js)
4. Network connectivity between services

**Test backend:**
```bash
curl https://budgetura-plaid-backend.your-domain.com/health
```

Should return: `{"status":"ok","service":"budgetura-plaid-backend"}`

### "Failed to store Plaid connection"

**Check:**
1. Database migration ran successfully
2. Tables exist: `plaid_items`, `plaid_accounts`, `plaid_transactions`
3. RLS policies are correct
4. User is authenticated

## 🔒 Security Notes

✅ **Secure:**
- Service Role Key only in backend (never exposed to frontend)
- Plaid credentials in Vault
- CORS configured for your domain

⚠️ **Important:**
- Service Role Key has FULL database access - keep it secret!
- Don't commit `.env` files to Git
- Use HTTPS in production
- Rotate keys regularly

## 📝 Configuration Summary

### Backend Environment Variables
```env
SUPABASE_URL=https://supabase.sec-admn.com
SUPABASE_SERVICE_ROLE_KEY=<secret>
PORT=3001
```

### Frontend Environment Variables
```env
VITE_PLAID_BACKEND_URL=https://budgetura-plaid-backend.your-domain.com
```

### Supabase Vault Secrets
```
client_id = <your-plaid-client-id>
secret = <your-plaid-secret>
environment = sandbox
```

## ✅ Deployment Checklist

- [ ] Database migration ran (plaid tables created)
- [ ] Supabase Service Role Key obtained
- [ ] Backend deployed with correct environment variables
- [ ] Backend health check returns 200 OK
- [ ] Frontend deployed with VITE_PLAID_BACKEND_URL set
- [ ] Can access Bank Accounts page
- [ ] Plaid Link modal appears when clicking "Connect Bank Account"
- [ ] Test connection successful with sandbox credentials
- [ ] Data appears in Supabase database after connection

## 🚀 Next Steps After Deployment

Once working:
1. Test disconnect functionality
2. Implement transaction sync (future enhancement)
3. Add bank balances to dashboard
4. Switch to Production Plaid credentials when ready

## 💬 Need Help?

Check the logs:
- **Dokploy**: View deployment logs in dashboard
- **PM2**: `pm2 logs plaid-backend`
- **Docker**: `docker logs <container-id>`
- **Browser**: Check console for frontend errors
