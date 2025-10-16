# AI Canvas Agent - Quick Start Guide

Get the AI Canvas Agent up and running in 5 minutes.

## Prerequisites

1. **OpenAI API Key**: Get one at https://platform.openai.com/api-keys
2. **Firebase CLI**: Install with `npm install -g firebase-tools`
3. **Logged into Firebase**: Run `firebase login` if needed

## 🚀 Deploy in 3 Steps

### Step 1: Set OpenAI API Key

Create `functions/.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

Or export environment variable:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### Step 2: Run Deployment Script

```bash
./deploy-ai.sh
```

This will:
- Install dependencies
- Build TypeScript
- Deploy cloud function
- Configure frontend environment variable

### Step 3: Restart Dev Server

```bash
npm run dev
```

## ✅ Verify It Works

1. Open `http://localhost:5173`
2. Sign in with your account
3. Click the **purple gradient circle button** (bottom-right corner)
4. Type: **"Create a red circle at 15000, 15000"**
5. Press Enter

You should see:
- AI responds with confirmation
- Red circle appears on canvas
- All connected clients see the shape in real-time

## 📝 Try These Commands

### Basic Creation
```
Create a blue rectangle at 14800, 14800
Add a text shape that says "Hello" at 15100, 15100
Draw a yellow star at the center
Make a green triangle at 15200, 14900
```

### Manipulation
```
Change the circle's color to purple
Move the rectangle to 15500, 15500
Rotate the star by 45 degrees
Set the triangle's opacity to 50%
```

### Layout
```
Arrange all shapes in a grid
Align the rectangles horizontally
Center all shapes on the canvas
```

### Complex Layouts
```
Create a login form with a title, username field, password field, and submit button
Build a navigation bar with Home, About, Services, and Contact
Make a product card with title, image placeholder, description, and price
Design a dashboard with header, sidebar, and content area
```

## 🐛 Troubleshooting

### "Unauthorized: Invalid token"
→ Sign out and back in (token expired)

### "Rate limit exceeded"
→ Wait 60 seconds (20 requests per minute limit)

### Shapes don't appear
→ They might be off-screen, try: "Center all shapes"

### High response times
→ Check OpenAI API status at status.openai.com

### Function not found
→ Verify deployment: `firebase functions:list`

## 📊 Monitor Performance

```bash
# View logs
firebase functions:log --only aiCanvasAgent

# Monitor in real-time
firebase functions:log --only aiCanvasAgent --follow

# Check for errors
firebase functions:log --only aiCanvasAgent | grep ERROR
```

## 📚 Full Documentation

- **Deployment Guide**: `DEPLOY_AI_AGENT.md`
- **Testing Checklist**: `AI_TESTING_CHECKLIST.md`
- **Implementation Summary**: `AI_AGENT_IMPLEMENTATION_COMPLETE.md`

## 🎯 Expected Performance

- **Response Time**: < 2 seconds (90%+ of requests)
- **Accuracy**: 90%+ command success rate
- **Token Usage**: ~650 tokens per request (< $0.03 each)
- **Multi-User**: Multiple users can use AI simultaneously

## 💰 Cost Estimate

For 1000 users making 10 requests each per month:
- **OpenAI API**: ~$250/month (GPT-4)
- **Firebase**: Within free tier for most apps
- **Total**: ~$250-300/month

## 🚀 Next Steps

1. Test all command types (see checklist)
2. Try multi-user scenarios
3. Verify undo/redo integration
4. Monitor performance metrics
5. Gather user feedback

**That's it! Your AI Canvas Agent is ready.** 🎉

Need help? Check the full documentation files or review logs with `firebase functions:log`.

