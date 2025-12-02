# Budgetura Plaid Backend

This is a standalone Node.js backend service that handles Plaid API integration for Budgetura.

## Why a Separate Backend?

The self-hosted Supabase instance doesn't have Edge Functions available, so this backend provides the same functionality:
- Creating Plaid Link tokens
- Exchanging public tokens for access tokens
- Storing bank connections in Supabase

## Setup

### 1. Install Dependencies

```bash
cd plaid-backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
# Supabase Configuration
SUPABASE_URL=https://supabase.sec-admn.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3001
```

**Note:** Plaid credentials are read from Supabase Vault automatically. No need to add them here.

### 3. Get Supabase Service Role Key

1. Go to https://supabase.sec-admn.com
2. Navigate to **Settings** → **API**
3. Find **service_role** key (secret, not public!)
4. Copy and paste into `.env`

### 4. Run Locally

```bash
npm start
```

Server will start on http://localhost:3001

Test it:
```bash
curl http://localhost:3001/health
```

## Deployment

### Option 1: Deploy on Dokploy (Recommended)

1. Create new app in Dokploy:
   - **Name**: budgetura-plaid-backend
   - **Type**: Docker
   - **Port**: 3001
   - **Repository**: Same as main app

2. Set build context: `plaid-backend`

3. Add environment variables:
   - `SUPABASE_URL`: https://supabase.sec-admn.com
   - `SUPABASE_SERVICE_ROLE_KEY`: (from Supabase dashboard)
   - `PORT`: 3001

4. Deploy!

### Option 2: Run with Docker

```bash
cd plaid-backend
docker build -t budgetura-plaid-backend .
docker run -p 3001:3001 \
  -e SUPABASE_URL=https://supabase.sec-admn.com \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  budgetura-plaid-backend
```

### Option 3: Run with PM2 (on server)

```bash
cd plaid-backend
npm install -g pm2
pm2 start index.js --name plaid-backend
pm2 save
```

## Configure Main App

Update main app's `.env` to point to this backend:

```env
VITE_PLAID_BACKEND_URL=http://localhost:3001
```

Or for production:

```env
VITE_PLAID_BACKEND_URL=https://plaid-backend.your-domain.com
```

## API Endpoints

### Health Check
```
GET /health
```

### Create Link Token
```
POST /api/plaid/create-link-token
Content-Type: application/json

{
  "userId": "user-uuid-here"
}
```

### Exchange Token
```
POST /api/plaid/exchange-token
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "publicToken": "public-token-from-plaid-link"
}
```

## Security

- Service Role Key is never exposed to frontend
- Plaid credentials stored in Supabase Vault
- CORS enabled for frontend requests
- All API calls authenticated via userId

## Troubleshooting

### "Plaid credentials not found"
- Check Supabase Vault has: `client_id`, `secret`, `environment`
- Verify SERVICE_ROLE_KEY can access vault

### "Connection refused"
- Check backend is running: `curl http://localhost:3001/health`
- Verify PORT matches configuration
- Check firewall/network settings

### "Failed to store Plaid connection"
- Run database migration first (creates plaid_items/plaid_accounts tables)
- Check Supabase connection works
- Verify RLS policies allow inserts

## Development

```bash
# Install dependencies
npm install

# Run with auto-reload
npm run dev

# Test endpoints
curl -X POST http://localhost:3001/api/plaid/create-link-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id"}'
```
