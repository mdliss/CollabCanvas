#!/bin/bash

# CollabCanvas AI Agent Deployment Script
# This script automates the deployment of the AI Canvas Agent feature

set -e  # Exit on error

echo "=================================================="
echo "CollabCanvas AI Agent Deployment"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed${NC}"
    echo "Install with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged into Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}Error: Not logged into Firebase${NC}"
    echo "Login with: firebase login"
    exit 1
fi

echo -e "${GREEN}✓${NC} Firebase CLI detected"
echo ""

# Phase 1: Backend Deployment
echo "=================================================="
echo "Phase 1: Backend Deployment"
echo "=================================================="
echo ""

# Check if functions directory exists
if [ ! -d "functions" ]; then
    echo -e "${RED}Error: functions directory not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

cd functions

# Check for OpenAI API key in environment
if [ -z "$OPENAI_API_KEY" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: No OpenAI API key found${NC}"
    echo "Please set OPENAI_API_KEY environment variable or create functions/.env file"
    echo ""
    read -p "Enter your OpenAI API key: " api_key
    echo "OPENAI_API_KEY=$api_key" > .env
    echo -e "${GREEN}✓${NC} Created .env file"
    echo ""
fi

# Install dependencies
echo "Installing function dependencies..."
npm install
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Build TypeScript
echo "Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: TypeScript build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} TypeScript build successful"
echo ""

# Configure Firebase environment
echo "Configuring Firebase environment..."
if [ -f ".env" ]; then
    source .env
    if [ -n "$OPENAI_API_KEY" ]; then
        firebase functions:config:set openai.api_key="$OPENAI_API_KEY"
        echo -e "${GREEN}✓${NC} Firebase environment configured"
    fi
fi
echo ""

# Deploy function
echo "Deploying cloud function..."
firebase deploy --only functions:aiCanvasAgent
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Function deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Cloud function deployed successfully"
echo ""

# Get function URL
echo "Retrieving function URL..."
FUNCTION_URL=$(firebase functions:config:get 2>/dev/null | grep -o 'https://[^"]*aiCanvasAgent' || echo "")

if [ -z "$FUNCTION_URL" ]; then
    # Try to construct URL from project info
    PROJECT_ID=$(firebase use | grep -o '\[.*\]' | tr -d '[]')
    FUNCTION_URL="https://us-central1-$PROJECT_ID.cloudfunctions.net/aiCanvasAgent"
fi

echo -e "${GREEN}Function URL:${NC} $FUNCTION_URL"
echo ""

cd ..

# Phase 2: Frontend Configuration
echo "=================================================="
echo "Phase 2: Frontend Configuration"
echo "=================================================="
echo ""

# Update or create .env file
if [ -f ".env" ]; then
    # Check if VITE_AI_ENDPOINT already exists
    if grep -q "VITE_AI_ENDPOINT" .env; then
        # Update existing entry
        sed -i.bak "s|VITE_AI_ENDPOINT=.*|VITE_AI_ENDPOINT=$FUNCTION_URL|" .env
        rm .env.bak 2>/dev/null || true
        echo -e "${GREEN}✓${NC} Updated VITE_AI_ENDPOINT in .env"
    else
        # Append new entry
        echo "" >> .env
        echo "# AI Canvas Agent Endpoint" >> .env
        echo "VITE_AI_ENDPOINT=$FUNCTION_URL" >> .env
        echo -e "${GREEN}✓${NC} Added VITE_AI_ENDPOINT to .env"
    fi
else
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Creating .env file..."
    echo "# AI Canvas Agent Endpoint" > .env
    echo "VITE_AI_ENDPOINT=$FUNCTION_URL" >> .env
    echo -e "${GREEN}✓${NC} Created .env with VITE_AI_ENDPOINT"
fi
echo ""

# Phase 3: Verification
echo "=================================================="
echo "Phase 3: Verification"
echo "=================================================="
echo ""

echo "Deployment Summary:"
echo "-------------------"
echo "✓ Cloud function deployed"
echo "✓ Function URL: $FUNCTION_URL"
echo "✓ Frontend environment configured"
echo ""

echo "Next Steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Open the app and sign in"
echo "3. Click the AI assistant button (purple circle, bottom-right)"
echo "4. Test with: 'Create a red circle at 15000, 15000'"
echo ""

echo "Testing:"
echo "- See AI_TESTING_CHECKLIST.md for comprehensive test scenarios"
echo "- Monitor logs with: firebase functions:log --only aiCanvasAgent"
echo ""

echo -e "${GREEN}Deployment Complete! 🎉${NC}"
echo ""

# Optional: Ask if user wants to view logs
read -p "Would you like to view function logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase functions:log --only aiCanvasAgent --limit 50
fi

