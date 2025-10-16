# AI Canvas Agent Deployment Guide

Complete step-by-step guide to deploy and test the AI Canvas Agent feature.

## Prerequisites

- Node.js 18+
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project with Realtime Database enabled
- OpenAI API key

## Phase 1: Backend Deployment

### Step 1.1: Install Dependencies

```bash
cd functions
npm install
```

This installs:
- `firebase-admin` - Firebase Admin SDK for server-side operations
- `firebase-functions` - Cloud Functions SDK
- `ai` - Vercel AI SDK
- `openai` - OpenAI client library
- `zod` - Runtime type validation

### Step 1.2: Configure Environment Variables

Create `functions/.env` file:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Configure Firebase environment (production):

```bash
firebase functions:config:set openai.api_key="sk-your-openai-api-key-here"
```

### Step 1.3: Update Firebase Configuration

Verify `firebase.json` includes functions configuration:

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### Step 1.4: Build TypeScript

```bash
cd functions
npm run build
```

This compiles TypeScript to JavaScript in `functions/lib/` directory.

### Step 1.5: Deploy Cloud Function

```bash
# From project root
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:aiCanvasAgent
```

Expected output:
```
✔  functions[aiCanvasAgent(us-central1)] Successful update operation.
Function URL: https://us-central1-collabcanvas-99a09.cloudfunctions.net/aiCanvasAgent
```

**IMPORTANT**: Copy the Function URL for frontend configuration.

### Step 1.6: Verify Deployment

Test with curl (replace URL and TOKEN):

```bash
curl -X POST https://us-central1-collabcanvas-99a09.cloudfunctions.net/aiCanvasAgent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "Create a red circle at 15000, 15000"}
    ]
  }'
```

Expected response:
```json
{
  "message": "I've created a red circle at position (15000, 15000) on the canvas.",
  "toolsExecuted": 1,
  "responseTime": 1234,
  "tokenUsage": 456
}
```

## Phase 2: Frontend Configuration

### Step 2.1: Add Environment Variable

Add to `.env` file:

```bash
VITE_AI_ENDPOINT=https://us-central1-collabcanvas-99a09.cloudfunctions.net/aiCanvasAgent
```

**Replace with your actual Function URL from Step 1.5.**

### Step 2.2: Install Frontend Dependencies

Currently the app doesn't need additional dependencies (we're using fetch API directly).
If you were using AI SDK React hooks, you would:

```bash
npm install ai @ai-sdk/react
```

But our implementation uses plain fetch for maximum compatibility.

### Step 2.3: Restart Development Server

```bash
npm run dev
```

Frontend now connects to the deployed cloud function.

## Phase 3: Testing

### Test 1: Basic Shape Creation

1. Open CollabCanvas in browser (localhost:5173)
2. Sign in with your account
3. Click the AI assistant button (purple gradient circle, bottom-right)
4. Type: "Create a red circle at 15000, 15000"
5. Press Enter or click Send

**Expected Result:**
- AI responds with confirmation
- Red circle appears on canvas
- All connected clients see the new shape in real-time

### Test 2: Complex Multi-Shape Creation

Type: "Create a login form with a title, username field, password field, and submit button"

**Expected Result:**
- AI creates 4+ shapes arranged vertically
- Title text at top
- Two rectangles for input fields
- Button at bottom
- Professional spacing and alignment

### Test 3: Shape Manipulation

Type: "Change the circle's color to blue"

**Expected Result:**
- AI queries canvas to find the circle
- Updates color to blue
- Shape updates in real-time

### Test 4: Layout Arrangement

1. Create several shapes manually (rectangles)
2. Type: "Arrange all shapes in a grid"

**Expected Result:**
- AI moves all shapes into grid layout
- Proper spacing between shapes
- Clean, organized result

### Test 5: Multi-User Testing

1. Open CollabCanvas in two browser windows/tabs
2. Sign in with different accounts in each
3. Use AI in Window 1: "Create a green rectangle at 15000, 15000"
4. Observe Window 2

**Expected Result:**
- Shape appears in both windows simultaneously
- Sub-100ms sync latency maintained
- No conflicts or errors

### Test 6: Undo/Redo Integration

1. Use AI: "Create a purple star at 15000, 15000"
2. Press Cmd+Z (or Ctrl+Z)

**Expected Result:**
- Star is removed (undo works)
- Operation appears in history timeline
- Press Cmd+Shift+Z to redo

### Test 7: Rate Limiting

1. Send 21 requests rapidly (e.g., "Create a circle" 21 times)

**Expected Result:**
- First 20 requests succeed
- 21st request returns rate limit error
- User-friendly error message displayed
- Wait 1 minute, requests work again

### Test 8: Error Handling

Type: "Create a shape at position 999999, 999999" (out of bounds)

**Expected Result:**
- User-friendly error message
- No crash or console errors
- AI remains responsive

### Test 9: Performance Verification

1. Monitor Network tab in browser DevTools
2. Use AI: "Create a blue triangle at 15000, 15000"
3. Check Response Time

**Expected Result:**
- Response time < 2 seconds
- Token usage < 1000 tokens
- Canvas maintains 60 FPS

### Test 10: XSS Prevention

Type: "Create a text shape with content: <script>alert('xss')</script>"

**Expected Result:**
- Script tags are stripped/sanitized
- No alert appears
- Safe text is displayed on canvas

## Phase 4: Monitoring

### Check Cloud Function Logs

```bash
firebase functions:log --only aiCanvasAgent
```

Look for:
- `[AI Agent] Processing request for user...`
- `[AI Tool] Created shape...`
- `[AI Agent] Request completed in XXXms`
- Token usage statistics

### Monitor Performance

In app, observe:
- Response times in console logs
- FPS counter (should stay at 60 FPS)
- Network latency for real-time sync

### Check Error Rates

```bash
firebase functions:log --only aiCanvasAgent --limit 100 | grep ERROR
```

Should see minimal errors (< 5% of requests).

## Troubleshooting

### Issue: "Unauthorized: Invalid token"

**Solution:**
- Verify user is signed in
- Check `Authorization` header is being sent
- Token might be expired - sign out and back in

### Issue: "Rate limit exceeded"

**Solution:**
- This is expected behavior (20 requests/minute/user)
- Wait 60 seconds before sending more requests
- For testing, temporarily increase limit in `functions/src/index.ts`

### Issue: "Network error"

**Solution:**
- Verify cloud function is deployed: `firebase functions:list`
- Check `VITE_AI_ENDPOINT` environment variable is set correctly
- Verify CORS is enabled in cloud function (already implemented)
- Check browser console for detailed error

### Issue: AI creates shapes but they don't appear

**Solution:**
- Check canvas position - shapes might be off-screen
- Verify RTDB write permissions
- Check browser console for RTDB errors
- Verify canvas ID matches: "global-canvas-v1"

### Issue: High response times (> 3 seconds)

**Solution:**
- OpenAI API might be slow - check status.openai.com
- Consider upgrading to GPT-4-turbo for faster responses
- Optimize prompts to reduce token usage
- Check cloud function region (should be close to users)

### Issue: Shapes created by AI can't be undone

**Solution:**
- Verify shapes are being created through existing RTDB functions
- Check undo system is tracking RTDB writes
- Ensure metadata fields (createdBy, timestamps) are set correctly

## Production Checklist

Before launching to production:

- [ ] OpenAI API key is stored securely (Firebase environment config, not in code)
- [ ] Rate limiting is appropriate for your user base
- [ ] Error messages are user-friendly (no technical details exposed)
- [ ] All input validation is working (tested with malicious input)
- [ ] CORS is properly configured (only allow your domain in production)
- [ ] Cloud function logs don't contain sensitive information
- [ ] Performance targets met (< 2s response, 90%+ accuracy)
- [ ] Multi-user scenarios tested extensively
- [ ] Undo/redo works for all AI operations
- [ ] Mobile responsiveness tested (chat panel works on mobile)
- [ ] Backup plan if OpenAI API is down (graceful degradation)

## Cost Monitoring

### OpenAI Costs

GPT-4 pricing (as of 2024):
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens

Average request: ~500 tokens = $0.03 per request

For 1000 users making 10 requests each:
- 10,000 requests × $0.03 = $300/month

### Firebase Costs

Cloud Functions:
- 2 million invocations free/month
- $0.40 per million after that

RTDB:
- 1 GB stored free
- $5/GB/month after that
- Bandwidth: mostly free for small apps

**Typical cost for small app: < $50/month**

## Support

If you encounter issues:

1. Check logs: `firebase functions:log`
2. Verify environment variables are set
3. Test with minimal example (single shape creation)
4. Check Firebase console for RTDB writes
5. Review network tab in browser DevTools

For OpenAI issues:
- Check API key is valid
- Verify billing is active on OpenAI account
- Review rate limits on OpenAI dashboard

## Next Steps

Once deployed and tested:

1. Gather user feedback on AI capabilities
2. Add more complex commands based on usage patterns
3. Optimize prompts to reduce token usage
4. Add analytics to track most-used commands
5. Consider caching common operations
6. Implement conversation history persistence
7. Add voice input support
8. Expand to handle more complex design patterns

## Success Metrics

Track these metrics to measure success:

- **Response Time**: Target < 2 seconds (90th percentile)
- **Accuracy**: Target 90%+ successful operations
- **Token Efficiency**: Target < 1000 tokens per request
- **User Adoption**: Track % of users who try AI feature
- **Retention**: Track if users return to AI feature
- **Error Rate**: Target < 5% of requests fail
- **Performance Impact**: Canvas should maintain 60 FPS

Deployment complete! 🎉

