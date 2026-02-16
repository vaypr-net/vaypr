#!/bin/bash

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Testing Subscription API ===${NC}\n"

# Get your access token (update this with actual token from your dashboard)
# Or set VAYPER_TOKEN environment variable
TOKEN="${VAYPER_TOKEN:-}"

if [ -z "$TOKEN" ]; then
    echo -e "${RED}ERROR: No token provided!${NC}"
    echo ""
    echo "How to get your token:"
    echo "1. Log in to your dashboard at http://localhost:5173"
    echo "2. Open DevTools (F12) → Application → LocalStorage"
    echo "3. Copy the value of 'accessToken'"
    echo "4. Run: export VAYPER_TOKEN='your-token-here'"
    echo "5. Then run this script again"
    exit 1
fi

echo -e "${YELLOW}Making API request to get subscription info...${NC}\n"

# Make the API request
RESPONSE=$(curl -s -X GET http://localhost:8081/billing/subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

# Check if response has an error
if echo "$RESPONSE" | grep -q "error\|Error\|unauthorized"; then
    echo -e "${RED}ERROR: ${NC}$(echo $RESPONSE | jq .message -r 2>/dev/null)"
    exit 1
fi

echo -e "${GREEN}✅ API Response:${NC}\n"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo -e "\n${YELLOW}Checking for features in response...${NC}\n"

# Check if features field exists
if echo "$RESPONSE" | jq -e '.plan.features' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Features field found!${NC}"
    echo -e "\nFeatures:"
    echo "$RESPONSE" | jq '.plan.features' -r
else
    echo -e "${RED}❌ Features field NOT found in response${NC}"
    echo ""
    echo "Make sure you:"
    echo "1. Restarted the backend server"
    echo "2. The fix has been deployed"
fi

echo ""
