#!/bin/bash

# ============================================================================
# Budgetura Settings Enhancement - Quick Deployment Script
# ============================================================================

set -e  # Exit on any error

echo "🚀 Budgetura Settings Enhancement Deployment"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Source environment variables
source .env.local

# Verify required variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Error: Missing Supabase credentials in .env.local${NC}"
    echo "Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Step 1: Display migration file
echo "📄 Migration File: supabase/migrations/003_settings_enhancement.sql"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 2: Instructions
echo -e "${YELLOW}⚠️  Manual Deployment Required${NC}"
echo ""
echo "Since Supabase CLI is not installed, please follow these steps:"
echo ""
echo "1. Log into Supabase Dashboard:"
echo "   → https://supabase.com/dashboard"
echo ""
echo "2. Select your project"
echo ""
echo "3. Go to SQL Editor (left sidebar)"
echo ""
echo "4. Copy the migration file:"
echo "   → File: /root/Budgetura/supabase/migrations/003_settings_enhancement.sql"
echo ""
echo "5. Paste into SQL Editor and click 'Run'"
echo ""
echo "6. Verify success message appears"
echo ""

# Step 3: Next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}📋 After Database Migration:${NC}"
echo ""
echo "Step A: Configure Encryption Key"
echo "  1. Go to Supabase Dashboard → Settings → Vault"
echo "  2. Click 'New secret'"
echo "  3. Name: encryption_key"
echo "  4. Secret: Generate with: openssl rand -base64 32"
echo "  5. Click 'Add secret'"
echo ""
echo "Step B: Enable Google OAuth (Optional)"
echo "  1. Go to Authentication → Providers → Google"
echo "  2. Toggle 'Enable Google provider'"
echo "  3. Add Client ID and Secret from Google Cloud Console"
echo "  4. Save changes"
echo ""
echo "Step C: Rebuild Frontend"
echo "  → In Dokploy: Click 'Redeploy' on your Budgetura app"
echo "  → Or manually: docker build -t budgetura-frontend ."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Option: Generate encryption key
read -p "Would you like to generate an encryption key now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}🔐 Generated Encryption Key:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    openssl rand -base64 32
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⬆️  Copy this key and add it to Supabase Vault as 'encryption_key'"
    echo ""
fi

# Display migration file location
echo ""
echo -e "${GREEN}📂 Files Ready for Deployment:${NC}"
echo "  ✅ Database Migration: supabase/migrations/003_settings_enhancement.sql"
echo "  ✅ Backend Operations: src/lib/supabase/operations.ts"
echo "  ✅ Type Definitions: types.ts"
echo "  ✅ Context Updates: context/DebtContext.tsx"
echo "  ✅ UI Components: components/SettingsView.tsx"
echo ""
echo -e "${GREEN}📖 Full Deployment Guide:${NC}"
echo "  → /root/Budgetura/DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ All code changes are complete and ready for deployment!${NC}"
echo ""
