# Budgetura Dokploy Deployment Guide

## Prerequisites

- Dokploy instance configured and accessible
- Self-hosted Supabase at `supabase.sec-admn.com`
- GitHub repository: `oxfordpierpont/Budgetura`

---

## Step 1: Configure Environment Variables

Create `.env.production` file (or configure in Dokploy UI):

```env
# Supabase Configuration (Self-hosted)
VITE_SUPABASE_URL=https://supabase.sec-admn.com
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase

# Optional: App Configuration
VITE_APP_TITLE=Budgetura
```

**Get Supabase Credentials:**
1. Access your Supabase instance at `https://supabase.sec-admn.com`
2. Navigate to Project Settings → API
3. Copy **Project URL** and **anon public** key

---

## Step 2: Dokploy Project Setup

### Via Dokploy Dashboard:

1. **Login to Dokploy**
   - Access your Dokploy instance

2. **Create New Project**
   - Click "New Project" or "Add Application"
   - Select **"Git Repository"**

3. **Configure Repository**
   - Repository URL: `https://github.com/oxfordpierpont/Budgetura`
   - Branch: `main`
   - Auto-deploy: Enable (optional - deploys on git push)

4. **Build Settings**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   Node Version: 20.x
   ```

5. **Environment Variables**
   Add in Dokploy UI:
   - `VITE_SUPABASE_URL` → `https://supabase.sec-admn.com`
   - `VITE_SUPABASE_ANON_KEY` → (your anon key)

6. **Deploy**
   - Click "Deploy" to start first deployment
   - Monitor build logs for any errors

---

## Step 3: Supabase Database Setup

If not already created, run the database schema:

1. Access Supabase dashboard at `https://supabase.sec-admn.com`
2. Navigate to **SQL Editor**
3. Create new query
4. Copy contents from [`supabase/schema.sql`](file:///Users/MrBobHunter-MacPro/Budgetura/supabase/schema.sql)
5. Execute query
6. Verify tables created in **Database** → **Tables**

---

## Step 4: Configure Supabase Authentication

1. In Supabase dashboard → **Authentication** → **URL Configuration**

2. Set **Site URL**:
   ```
   https://your-dokploy-domain.com
   ```

3. Add **Redirect URLs**:
   ```
   https://your-dokploy-domain.com/**
   http://localhost:5173/**  (for local development)
   ```

4. **Email Templates** (optional):
   - Configure confirm signup, password reset templates
   - Use your domain in email links

---

## Step 5: Domain Configuration (Optional)

If using custom domain:

1. **In Dokploy:**
   - Add custom domain in project settings
   - Note the provided IP/CNAME

2. **In DNS Provider:**
   - Add A record or CNAME pointing to Dokploy server
   - Wait for DNS propagation (5-60 minutes)

3. **SSL Certificate:**
   - Dokploy should auto-provision via Let's Encrypt
   - Verify HTTPS works

---

## Step 6: Deploy & Verify

### First Deployment:

```bash
# Dokploy will automatically:
1. Clone repository from GitHub
2. Install dependencies (npm install)
3. Build application (npm run build)
4. Serve static files from dist/
```

### Test Deployment:

1. Visit your Dokploy URL
2. Should redirect to `/login`
3. Create test account
4. Check email verification works
5. Test login flow

---

## Continuous Deployment

### Auto-Deploy on Git Push:

With auto-deploy enabled in Dokploy:

```bash
# Make changes locally
git add .
git commit -m "feat: your changes"
git push origin main

# Dokploy automatically:
# - Detects push to main
# - Pulls latest code
# - Rebuilds application
# - Deploys new version
```

### Manual Deploy:

In Dokploy dashboard:
- Click "Redeploy" or "Trigger Build"
- Monitor build logs

---

## Build Configuration

### Dockerfile (if needed for Dokploy):

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caching for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Dokploy CLI Deployment (Alternative)

If Dokploy provides CLI:

```bash
# Install Dokploy CLI (if available)
npm install -g dokploy-cli

# Login
dokploy login

# Deploy
dokploy deploy --project budgetura --branch main

# View logs
dokploy logs --project budgetura
```

---

## Environment Management

### Development (.env.local):
```env
VITE_SUPABASE_URL=https://supabase.sec-admn.com
VITE_SUPABASE_ANON_KEY=your_dev_key
```

### Production (Dokploy):
Configure in Dokploy dashboard environment variables

### Testing Locally:
```bash
# Use production env
npm run build
npm run preview

# Should connect to supabase.sec-admn.com
```

---

## Monitoring & Logs

### Access Logs:
- Dokploy dashboard → Project → Logs
- Real-time build and runtime logs

### Application Monitoring:
- Check browser console for errors
- Monitor Supabase logs for auth issues
- Use Sentry (if configured) for error tracking

---

## Troubleshooting

### Build Fails

**Check logs in Dokploy:**
```
npm ERR! → Check package.json dependencies
VITE build error → Check tsconfig.json and imports
```

**Common fixes:**
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Authentication Issues

**Supabase not connecting:**
- Verify `VITE_SUPABASE_URL` is correct
- Check anon key is valid
- Verify self-hosted Supabase is accessible
- Check CORS settings in Supabase

**Email verification not working:**
- Verify redirect URLs in Supabase
- Check email templates
- Verify SMTP configuration in self-hosted Supabase

### Routing Issues

**404 on page refresh:**
- Verify nginx.conf has `try_files` fallback
- Or configure Dokploy to handle SPA routing

---

## Quick Deployment Checklist

- [ ] Database schema created in Supabase
- [ ] Environment variables set in Dokploy
- [ ] Repository connected to Dokploy
- [ ] Build settings configured (npm run build)
- [ ] First deployment successful
- [ ] Domain configured (if using custom)
- [ ] SSL certificate active
- [ ] Supabase redirect URLs updated
- [ ] Test signup/login flow
- [ ] Auto-deploy enabled for main branch

---

## Next Steps After Deployment

1. **Test all authentication flows**
   - Sign up → Email verification → Login
   - Password reset flow
   - Session persistence

2. **Monitor first users**
   - Check Supabase auth logs
   - Monitor application errors

3. **Performance optimization**
   - Enable asset caching
   - Configure CDN if needed
   - Optimize images and bundles

4. **Setup monitoring**
   - Application performance monitoring
   - Error tracking (Sentry recommended)
   - Uptime monitoring

---

Your app will be live at your Dokploy domain! 🚀
