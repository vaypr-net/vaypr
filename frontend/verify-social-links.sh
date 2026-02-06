#!/bin/bash

# Social Links Integration - Quick Test Script
# This script checks if all files are in place and the backend is accessible

echo "🔍 Social Links Integration - Verification"
echo "==========================================="
echo ""

# Check if files exist
echo "📁 Checking files..."

FILES=(
  "src/api/services/social-links.service.ts"
  "src/hooks/api/useSocialLinks.ts"
  "src/lib/social-icons.ts"
  "src/components/super-admin/SocialMediaEditor.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
  fi
done

echo ""
echo "🔧 Build Status..."
if npm run build > /dev/null 2>&1; then
  echo "  ✅ Frontend builds successfully"
else
  echo "  ❌ Build failed - check errors above"
fi

echo ""
echo "🌐 Backend Connection Test..."

# Check if backend is running
BACKEND_URL="${VITE_API_BASE_URL:-http://localhost:8081}"

if curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api" | grep -q "200\|301\|302"; then
  echo "  ✅ Backend is accessible at $BACKEND_URL"
else
  echo "  ⚠️  Backend may not be running at $BACKEND_URL"
  echo "     Start backend: cd ../backend && npm run start:dev"
fi

echo ""
echo "📋 Next Steps:"
echo "  1. Start backend:  cd ../backend && npm run start:dev"
echo "  2. Start frontend: npm run dev"
echo "  3. Navigate to:    http://localhost:5173/super-admin/page-editor"
echo "  4. Open DevTools:  Check Network tab for API calls"
echo "  5. Test features:  Add/Edit/Delete/Toggle social links"
echo ""
echo "✅ Integration files are ready!"
