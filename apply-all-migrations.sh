#!/bin/bash

echo "========================================="
echo "Apply All Database Migrations"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project details
PROJECT_REF="dsbkjkwefszqqzukgdtk"

echo -e "${BLUE}Project:${NC} $PROJECT_REF"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  brew install supabase/tap/supabase"
    echo "  # or"
    echo "  npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI installed"
echo ""

# Check if linked to project
echo "Checking project link..."
if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Not linked to project. Linking now..."
    supabase link --project-ref $PROJECT_REF
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to link project${NC}"
        echo ""
        echo "Please run manually:"
        echo "  supabase login"
        echo "  supabase link --project-ref $PROJECT_REF"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Project linked"
echo ""

# List migrations
echo "Found migrations:"
ls -1 supabase/migrations/*.sql | while read file; do
    basename "$file"
done
echo ""

# Confirm
echo -e "${YELLOW}This will apply ALL migrations to your remote Supabase database.${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Applying migrations..."
echo ""

# Push migrations
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migrations applied successfully!${NC}"
    echo ""
    echo "Verifying tables..."
    echo ""
    
    # Create verification SQL
    cat > /tmp/verify_tables.sql << 'EOF'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
EOF
    
    # Run verification (if psql is available)
    if command -v psql &> /dev/null; then
        echo "Tables created:"
        supabase db execute --file /tmp/verify_tables.sql 2>/dev/null || echo "  (Run check-database-tables.sql in Supabase Dashboard to verify)"
    else
        echo "  Run check-database-tables.sql in Supabase Dashboard to verify"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Done!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Go to Supabase Dashboard → Table Editor"
    echo "  2. Verify all tables exist"
    echo "  3. Test your application"
else
    echo ""
    echo -e "${RED}❌ Failed to apply migrations${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Check you're logged in: supabase login"
    echo "  2. Check project is active in Supabase Dashboard"
    echo "  3. Check internet connection"
    echo "  4. Try manual application (see FIX_MISSING_TABLES.md)"
    exit 1
fi
