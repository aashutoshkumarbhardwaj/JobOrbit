#!/bin/bash

echo "========================================="
echo "Authentication Refactor Verification"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for deleted files
echo "1. Checking deleted files..."
DELETED_FILES=(
  "src/lib/auth.ts"
  "src/pages/auth/AuthCallback.tsx"
  "src/lib/auth/chrome-extension-auth.ts"
)

for file in "${DELETED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${RED}✗ FAIL: $file still exists${NC}"
  else
    echo -e "${GREEN}✓ PASS: $file deleted${NC}"
  fi
done

echo ""
echo "2. Checking AuthCallback imports apiClient..."
if grep -q "import.*apiClient.*from.*api/v1/client" src/pages/AuthCallback.tsx; then
  echo -e "${GREEN}✓ PASS: AuthCallback imports apiClient${NC}"
else
  echo -e "${RED}✗ FAIL: AuthCallback doesn't import apiClient${NC}"
fi

echo ""
echo "3. Checking AuthCallback uses apiClient.get()..."
if grep -q "apiClient\.get.*extension-session" src/pages/AuthCallback.tsx; then
  echo -e "${GREEN}✓ PASS: AuthCallback uses apiClient.get()${NC}"
else
  echo -e "${RED}✗ FAIL: AuthCallback doesn't use apiClient.get()${NC}"
fi

echo ""
echo "4. Checking AuthCallback doesn't use raw fetch()..."
if grep -q "await fetch.*extension-session" src/pages/AuthCallback.tsx; then
  echo -e "${RED}✗ FAIL: AuthCallback still uses raw fetch()${NC}"
else
  echo -e "${GREEN}✓ PASS: AuthCallback doesn't use raw fetch()${NC}"
fi

echo ""
echo "5. Checking API client imports AuthManager..."
if grep -q "import.*authManager.*from.*AuthManager" src/api/v1/client.ts; then
  echo -e "${GREEN}✓ PASS: API client imports AuthManager${NC}"
else
  echo -e "${RED}✗ FAIL: API client doesn't import AuthManager${NC}"
fi

echo ""
echo "6. Checking API client gets token from AuthManager..."
if grep -q "authManager\.getAccessToken" src/api/v1/client.ts; then
  echo -e "${GREEN}✓ PASS: API client uses authManager.getAccessToken()${NC}"
else
  echo -e "${RED}✗ FAIL: API client doesn't use authManager.getAccessToken()${NC}"
fi

echo ""
echo "7. Checking API client doesn't use localStorage auth_token..."
if grep -q "localStorage\.getItem.*auth_token" src/api/v1/client.ts; then
  echo -e "${RED}✗ FAIL: API client still uses localStorage['auth_token']${NC}"
else
  echo -e "${GREEN}✓ PASS: API client doesn't use localStorage['auth_token']${NC}"
fi

echo ""
echo "8. Checking .env has VITE_API_URL..."
if grep -q "^VITE_API_URL=.*functions/v1" .env; then
  echo -e "${GREEN}✓ PASS: VITE_API_URL includes /functions/v1/${NC}"
else
  echo -e "${YELLOW}⚠ WARN: VITE_API_URL might not include /functions/v1/${NC}"
fi

echo ""
echo "9. Checking for remaining imports of deleted files..."
REMAINING_IMPORTS=$(grep -r "from.*lib/auth['\"]" src/ 2>/dev/null | grep -v "auth-context\|AuthManager\|protected-route" | wc -l | tr -d ' ')
if [ "$REMAINING_IMPORTS" -eq "0" ]; then
  echo -e "${GREEN}✓ PASS: No imports of deleted auth.ts${NC}"
else
  echo -e "${RED}✗ FAIL: Found $REMAINING_IMPORTS imports of deleted files${NC}"
  grep -r "from.*lib/auth['\"]" src/ | grep -v "auth-context\|AuthManager\|protected-route"
fi

echo ""
echo "10. Running TypeScript build..."
if npm run build &>/dev/null; then
  echo -e "${GREEN}✓ PASS: Build successful${NC}"
else
  echo -e "${RED}✗ FAIL: Build failed${NC}"
  echo "Run: npm run build"
fi

echo ""
echo "========================================="
echo "Verification Complete"
echo "========================================="
