#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  echo "🔧 Loading environment variables from .env..."
  export $(grep -v '^#' .env | xargs)
else
  echo "❌ .env file not found. Please create one."
  exit 1
fi

if [[ -z "$RENDER_API_KEY" || -z "$RENDER_SERVICE_ID" ]]; then
  echo "❌ Missing RENDER_API_KEY or RENDER_SERVICE_ID. Please check your .env file."
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "🚧 You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Build the TypeScript project
echo "🏗️ Building backend services..."
npm run build

# Commit the build
# echo "📦 Committing the build..."
# git add .
# git commit -m "Automated deploy commit"

# Push to the main branch
echo "🚀 Pushing to main branch..."
git push origin main

# Trigger manual deploy on Render
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')

# Check for successful response
if [[ "$response" == "201" ]]; then
  echo "✅ Deployment triggered successfully!"
else
  echo "❌ Deployment failed. HTTP Status: $response"
  exit 1
fi
