#!/bin/bash

# CORS Testing Script for Edge Functions
# Tests OPTIONS preflight requests for both web app and extension origins

echo "🧪 Testing CORS Configuration for Edge Functions"
echo "================================================"
echo ""

# Configuration
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
WEB_ORIGIN="http://localhost:5173"
EXTENSION_ORIGIN="chrome-extension://abc123def456"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_cors() {
    local endpoint=$1
    local origin=$2
    local origin_type=$3
    local extra_headers=$4
    
    echo -e "${YELLOW}Testing: ${endpoint} (${origin_type})${NC}"
    
    # Make OPTIONS request
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS "${SUPABASE_URL}/functions/v1/${endpoint}" \
        -H "Origin: ${origin}" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: authorization, content-type, apikey, x-client-info${extra_headers}" \
        2>&1)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} - OPTIONS returned 200"
        
        # Get actual CORS headers
        headers=$(curl -s -I \
            -X OPTIONS "${SUPABASE_URL}/functions/v1/${endpoint}" \
            -H "Origin: ${origin}" \
            -H "Access-Control-Request-Method: GET" \
            -H "Access-Control-Request-Headers: authorization, content-type, apikey, x-client-info${extra_headers}")
        
        # Check for required headers
        if echo "$headers" | grep -i "access-control-allow-headers" | grep -q "apikey"; then
            echo -e "${GREEN}✅ PASS${NC} - apikey header allowed"
        else
            echo -e "${RED}❌ FAIL${NC} - apikey header NOT allowed"
        fi
        
        if echo "$headers" | grep -i "access-control-allow-headers" | grep -q "x-client-info"; then
            echo -e "${GREEN}✅ PASS${NC} - x-client-info header allowed"
        else
            echo -e "${RED}❌ FAIL${NC} - x-client-info header NOT allowed"
        fi
        
        if echo "$headers" | grep -i "access-control-allow-headers" | grep -q "authorization"; then
            echo -e "${GREEN}✅ PASS${NC} - authorization header allowed"
        else
            echo -e "${RED}❌ FAIL${NC} - authorization header NOT allowed"
        fi
    else
        echo -e "${RED}❌ FAIL${NC} - OPTIONS returned ${response}"
    fi
    
    echo ""
}

# Test Web App Origin
echo "📱 Testing Web App Origin"
echo "========================"
echo ""

test_cors "profile-get" "$WEB_ORIGIN" "Web"
test_cors "applications-get" "$WEB_ORIGIN" "Web"
test_cors "extension-session" "$WEB_ORIGIN" "Web"

# Test Extension Origin
echo ""
echo "🔌 Testing Chrome Extension Origin"
echo "==================================="
echo ""

test_cors "profile-get" "$EXTENSION_ORIGIN" "Extension" ", x-extension-token"
test_cors "applications-get" "$EXTENSION_ORIGIN" "Extension" ", x-extension-token"
test_cors "extension-session" "$EXTENSION_ORIGIN" "Extension" ", x-extension-token"

# Summary
echo ""
echo "================================================"
echo "✅ CORS testing complete!"
echo ""
echo "If all tests passed, your CORS configuration is correct."
echo "If any tests failed, check:"
echo "  1. supabase/functions/_shared/cors.ts has correct headers"
echo "  2. Edge Functions handle OPTIONS before authentication"
echo "  3. Supabase is running: supabase status"
echo ""

# Test with actual request (if token provided)
if [ -n "$SUPABASE_ANON_KEY" ]; then
    echo "🔐 Testing actual authenticated request"
    echo "======================================="
    echo ""
    
    response=$(curl -s -w "\n%{http_code}" \
        "${SUPABASE_URL}/functions/v1/profile-get" \
        -H "Origin: ${WEB_ORIGIN}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json")
    
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status" = "200" ] || [ "$status" = "401" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Request completed (status: ${status})"
        echo "Response: ${body}"
    else
        echo -e "${RED}❌ FAIL${NC} - Request failed (status: ${status})"
        echo "Response: ${body}"
    fi
else
    echo "💡 Set SUPABASE_ANON_KEY to test actual requests"
fi

echo ""
echo "Done! 🎉"
