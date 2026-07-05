#!/bin/bash

# Edge Functions Deployment Script
# Deploys all Supabase Edge Functions

echo "🚀 Deploying Edge Functions to Supabase"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  brew install supabase/tap/supabase"
    echo "  or"
    echo "  npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if logged in
echo "📋 Checking login status..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in${NC}"
    echo "Logging in..."
    supabase login
fi

echo -e "${GREEN}✅ Logged in${NC}"
echo ""

# Link project (if not already linked)
echo "🔗 Linking project..."
supabase link --project-ref dsbkjkwefszqqzukgdtk || echo "Already linked"
echo ""

# Set secrets
echo "🔐 Setting secrets..."
echo ""
echo "Do you want to set EXTENSION_TOKEN_SECRET? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    SECRET=$(openssl rand -base64 32)
    echo "Generated secret: $SECRET"
    supabase secrets set EXTENSION_TOKEN_SECRET="$SECRET"
    echo -e "${GREEN}✅ Secret set${NC}"
fi
echo ""

# Deploy all functions
echo "📦 Deploying all Edge Functions..."
echo ""

FUNCTIONS=(
    "extension-session"
    "extension-logout"
    "extension-refresh"
    "profile-get"
    "profile-patch"
    "settings-get"
    "settings-patch"
    "applications-get"
    "applications-post"
    "applications-patch"
    "resumes-get"
    "resumes-post"
    "answers-get"
    "answers-post"
)

SUCCESS=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    echo "📤 Deploying $func..."
    if supabase functions deploy "$func" --no-verify-jwt; then
        echo -e "${GREEN}✅ $func deployed${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ $func failed${NC}"
        ((FAILED++))
    fi
    echo ""
done

# Summary
echo "========================================"
echo "📊 Deployment Summary"
echo "========================================"
echo -e "${GREEN}✅ Success: $SUCCESS${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Failed: $FAILED${NC}"
fi
echo ""

# List deployed functions
echo "📋 Deployed Functions:"
supabase functions list
echo ""

# Test CORS
echo "🧪 Testing CORS..."
echo ""
curl -X OPTIONS \
  https://dsbkjkwefszqqzukgdtk.supabase.co/functions/v1/profile-get \
  -H "Origin: https://job-orbit-flax.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization, apikey" \
  -v 2>&1 | grep -i "access-control"

echo ""
echo "========================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All functions deployed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Some functions failed. Check logs above.${NC}"
fi
echo "========================================"
