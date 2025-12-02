# 🚀 Budgetura Deployment Guide

## ⚠️ IMPORTANT: Deployment Workflow

### GitHub is the Source of Truth

All changes MUST be committed to GitHub before deployment. The server code directory is managed by Dokploy and should be treated as read-only.

## Development Workflow

### 1. Local Development

```bash
# Clone repository
git clone git@github.com:oxfordpierpont/Budgetura.git
cd Budgetura

# Create feature branch (optional)
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Test locally (optional)
npm install
npm run dev

# Commit changes
git add .
git commit -m "feat: description of changes"

# Push to GitHub
git push origin main
# or: git push origin feature/your-feature-name
```

### 2. Deployment

After pushing to GitHub, deploy via Dokploy:

**Manual Deployment:**
1. Go to Dokploy dashboard
2. Navigate to Budgetura application
3. Click "Redeploy"
4. Wait for build to complete

**Automatic Deployment (Recommended):**
- Set up GitHub webhook
- Automatic deployment on push to `main`

### 3. Environment Variables

Environment variables are managed in Dokploy, NOT in the repository:

- `VITE_SUPABASE_URL` - Supabase instance URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `GEMINI_API_KEY` - Google Gemini API key

**To update environment variables:**
- Go to Dokploy dashboard → Budgetura → Settings → Environment

## Architecture

```
Local Machine          GitHub              Dokploy Server
    |                    |                       |
    | git push           |                       |
    |------------------>|                       |
    |                    | webhook/manual       |
    |                    | trigger              |
    |                    |--------------------->|
    |                    |                       |
    |                    |   git pull           |
    |                    |<---------------------|
    |                    |                       |
    |                    |   docker build       |
    |                    |   (uses Dockerfile)  |
    |                    |                       |
    |                    |   deploy container   |
    |                    |   (with env vars)    |
    |                    |                       |
```

## Build Process

Dokploy uses the `Dockerfile` in the repository root:

1. **Build Stage:** `node:20-alpine`
   - Copies package.json
   - Runs `npm install`
   - Copies source code
   - Runs `npm run build`

2. **Production Stage:** `nginx:alpine`
   - Copies built assets from build stage
   - Serves static files

## Persistent Storage

A persistent volume is mounted at `/app/data`:

- **Volume Name:** `budgetura-data`
- **Mount Point:** `/app/data`
- **Survives:** Container restarts and redeployments

Use this directory for:
- User uploads
- Generated reports
- Cache files
- Application logs

## Troubleshooting

### Changes Not Appearing After Deployment

1. **Verify GitHub has latest code:**
   ```bash
   git log -1
   # Check commit hash matches GitHub
   ```

2. **Check Dokploy build logs:**
   - Go to Dokploy dashboard
   - View deployment logs
   - Look for build errors

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux)
   - Or: `Cmd+Shift+R` (Mac)

### Build Failures

1. **Check Dockerfile syntax:**
   - Ensure Dockerfile is in repo root
   - Verify all COPY paths are correct

2. **Check environment variables:**
   - Verify all required vars are set in Dokploy
   - Check for typos in variable names

3. **Check dependencies:**
   - Ensure package.json is committed
   - Verify no missing dependencies

## Security Notes

- Never commit `.env.local` or secrets to GitHub
- Environment variables are stored securely in Dokploy
- Supabase keys have Row Level Security (RLS)
- All API keys should be rotated regularly

## Support

For deployment issues:
1. Check Dokploy logs
2. Verify GitHub repository status
3. Review Docker service status: `docker service ps budgetura-6r9crc`
4. Check persistent volume: `docker volume inspect budgetura-data`

---

**Repository:** https://github.com/oxfordpierpont/Budgetura
**Version:** 2.4
**Last Updated:** 2025-12-02
