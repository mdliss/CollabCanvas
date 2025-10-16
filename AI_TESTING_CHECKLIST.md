# AI Canvas Agent - Comprehensive Testing Checklist

## Command Breadth Testing (Target: 8+ distinct command types)

### Creation Commands (Minimum 2 required)

- [ ] **Test 1.1**: "Create a red circle at 15000, 15000"
  - Expected: Red circle appears at center of canvas
  - Verify: Shape has correct color (#FF0000 or similar red), position, and type

- [ ] **Test 1.2**: "Add a blue rectangle with dimensions 200x150 at coordinates 14800, 14800"
  - Expected: Blue rectangle with specific dimensions appears
  - Verify: Width=200, height=150, position accurate

- [ ] **Test 1.3**: "Make a text element that says 'Hello World' at position 15100, 15100"
  - Expected: Text shape with content "Hello World" appears
  - Verify: Text is readable, properly sized, positioned correctly

- [ ] **Test 1.4**: "Draw a yellow triangle at 15200, 14900"
  - Expected: Yellow triangle appears
  - Verify: Shape type is triangle, color is yellow

- [ ] **Test 1.5**: "Create a green star at the center of the canvas"
  - Expected: Green star appears near 15000, 15000
  - Verify: AI interprets "center" correctly as ~15000, 15000

### Manipulation Commands (Minimum 2 required)

- [ ] **Test 2.1**: "Move the blue rectangle to 15500, 15500"
  - Expected: Previously created rectangle moves to new position
  - Verify: Only position changes, other properties unchanged

- [ ] **Test 2.2**: "Change the circle's color to purple"
  - Expected: Red circle from Test 1.1 becomes purple
  - Verify: AI queries canvas to find the circle, updates color

- [ ] **Test 2.3**: "Rotate the triangle by 45 degrees"
  - Expected: Triangle rotates
  - Verify: Rotation property updated, shape visibly rotated

- [ ] **Test 2.4**: "Set the star's opacity to 50%"
  - Expected: Star becomes semi-transparent
  - Verify: Opacity property = 0.5, visually transparent

- [ ] **Test 2.5**: "Resize the rectangle to be 300 pixels wide and 200 pixels tall"
  - Expected: Rectangle dimensions change
  - Verify: Width=300, height=200

- [ ] **Test 2.6**: "Update the text to say 'Goodbye World'"
  - Expected: Text content changes
  - Verify: Text shape shows new content

### Layout Commands (Minimum 1 required)

- [ ] **Test 3.1**: "Arrange all shapes in a grid pattern with 100 pixel spacing"
  - Expected: All existing shapes reorganized into grid
  - Verify: Shapes evenly spaced, grid formation visible

- [ ] **Test 3.2**: "Align all rectangles horizontally with 50 pixel spacing"
  - Expected: Rectangles arranged in horizontal line
  - Verify: Y coordinates similar, X coordinates increase by ~(width + 50)

- [ ] **Test 3.3**: "Distribute the circles vertically"
  - Expected: Circles stacked vertically
  - Verify: X coordinates similar, Y coordinates increase

- [ ] **Test 3.4**: "Center all shapes on the canvas"
  - Expected: All shapes move toward canvas center
  - Verify: Average position is near 15000, 15000

### Complex Multi-Step Commands (Minimum 1 required)

- [ ] **Test 4.1**: "Create a login form with a title, username field, password field, and submit button"
  - Expected: 4+ elements created and arranged vertically
  - Verify components:
    - [ ] Title text at top (e.g., "Login")
    - [ ] Username field rectangle (labeled or appropriate size)
    - [ ] Password field rectangle (below username)
    - [ ] Submit button rectangle (at bottom)
    - [ ] All elements vertically aligned
    - [ ] Appropriate spacing between elements
    - [ ] Professional appearance

- [ ] **Test 4.2**: "Build a navigation bar with Home, About, Services, and Contact menu items"
  - Expected: Header rectangle + 4 text labels
  - Verify components:
    - [ ] Background rectangle (header bar)
    - [ ] 4 text elements with specified labels
    - [ ] Horizontally arranged
    - [ ] Proper spacing
    - [ ] Items aligned within header

- [ ] **Test 4.3**: "Make a product card with title, image placeholder, description, and price"
  - Expected: 4+ elements arranged as card layout
  - Verify components:
    - [ ] Card container (rectangle)
    - [ ] Image placeholder (rectangle at top)
    - [ ] Title text
    - [ ] Description text
    - [ ] Price text (at bottom)
    - [ ] Vertical layout with hierarchy
    - [ ] Appropriate sizes for each element

- [ ] **Test 4.4**: "Design a dashboard with a header, sidebar, and content area"
  - Expected: 3 large rectangles positioned as layout
  - Verify components:
    - [ ] Header rectangle (top, full width)
    - [ ] Sidebar rectangle (left side, below header)
    - [ ] Content area rectangle (right side, main area)
    - [ ] Proper alignment and sizing
    - [ ] Professional proportions

## Complex Command Execution Testing (Target: 7-8 points)

### Execution Quality

- [ ] **Test 5.1**: Complex commands produce 3+ properly arranged elements
  - Test with login form, nav bar, product card
  - Verify: All required elements present and positioned correctly

- [ ] **Test 5.2**: Multi-step plans execute in logical order
  - Test: "Create 5 circles and arrange them in a grid"
  - Verify: Circles created first, then arranged (logical sequence)

- [ ] **Test 5.3**: Smart positioning - elements arranged sensibly
  - Test any complex command
  - Verify: No overlapping (unless intended), logical spacing, aligned elements

- [ ] **Test 5.4**: Smart styling - appropriate sizes, colors, spacing
  - Test dashboard or card layout
  - Verify: Header is larger than body text, buttons are button-sized, colors are appropriate

- [ ] **Test 5.5**: Handle ambiguous requests intelligently
  - Test: "Make it bigger" (without specifying what)
  - Verify: AI asks for clarification or makes reasonable assumption based on context

- [ ] **Test 5.6**: Maintain visual hierarchy in complex layouts
  - Test: Product card or dashboard
  - Verify: Title is prominent, hierarchy is clear (size/position/color differences)

## AI Performance & Reliability Testing (Target: 6-7 points)

### Performance Targets

- [ ] **Test 6.1**: Response time < 2 seconds from user input to first response
  - Test with 10 different commands
  - Record response times
  - Calculate average and 90th percentile
  - Target: 90% of requests complete in < 2 seconds

- [ ] **Test 6.2**: Command accuracy: 90%+ success rate
  - Test 20 diverse commands
  - Record: Success (shape created/modified correctly) or Failure
  - Calculate: (Successes / Total) × 100
  - Target: ≥ 90%

- [ ] **Test 6.3**: Token efficiency: < 1000 tokens per request average
  - Check console logs or function logs for token usage
  - Test 10 varied commands (simple and complex)
  - Calculate average token usage
  - Target: < 1000 tokens/request

### User Experience

- [ ] **Test 7.1**: Natural conversational interface
  - Test various phrasings: "Create...", "Add...", "Make...", "Draw..."
  - Verify: All variations work correctly

- [ ] **Test 7.2**: Clear loading states during processing
  - Submit request and observe UI
  - Verify: Loading indicator appears, "AI is thinking..." message shown

- [ ] **Test 7.3**: Helpful error messages (user-friendly, not technical)
  - Test invalid input: "Create a shape at 999999, 999999"
  - Verify: Error message is clear, no technical jargon, suggests solution

- [ ] **Test 7.4**: Visual feedback when AI is working
  - Verify: Animated dots or spinner during processing
  - Input field disabled during processing

- [ ] **Test 7.5**: Graceful degradation if AI service fails
  - Simulate failure (disconnect from internet or use invalid API key)
  - Verify: User-friendly error, app doesn't crash, canvas still usable

### Multi-User Requirements

- [ ] **Test 8.1**: Multiple users can use AI simultaneously without conflicts
  - Open 2 browser windows with different accounts
  - Use AI in both simultaneously
  - Verify: Both operations succeed, no errors

- [ ] **Test 8.2**: AI operations sync to all connected clients in real-time
  - Window 1: Use AI to create shape
  - Window 2: Observe
  - Verify: Shape appears in Window 2 within 100ms

- [ ] **Test 8.3**: Shared state remains consistent across all users
  - User A: Create 5 shapes via AI
  - User B: Query canvas via AI ("What shapes are on the canvas?")
  - Verify: User B sees all 5 shapes in AI response

- [ ] **Test 8.4**: No race conditions or state corruption
  - User A: Create shape at 15000, 15000 via AI
  - User B: Create shape at 15000, 15000 via AI (same position)
  - Verify: Both shapes exist (may overlap), neither is lost

## Integration Testing

### Real-Time Synchronization

- [ ] **Test 9.1**: AI writes to database using same schema as manual operations
  - Create shape manually, create shape via AI
  - Compare database entries
  - Verify: Identical structure, all required fields present

- [ ] **Test 9.2**: All connected clients receive updates automatically
  - 3 browser windows open
  - Use AI in Window 1
  - Verify: Shape appears in all 3 windows simultaneously

- [ ] **Test 9.3**: Sub-100ms sync latency maintained
  - Use browser DevTools Performance tab
  - Create shape via AI
  - Measure time from API response to shape appearing
  - Target: < 100ms

- [ ] **Test 9.4**: No degradation of existing performance metrics
  - Record FPS before using AI
  - Use AI to create 10 shapes
  - Record FPS after
  - Verify: FPS remains at 60 (no significant drop)

### Undo/Redo Integration

- [ ] **Test 10.1**: AI operations are reversible through existing undo system
  - Use AI: "Create a red circle"
  - Press Cmd+Z (or Ctrl+Z)
  - Verify: Circle is removed

- [ ] **Test 10.2**: AI operations appear in history timeline
  - Open History Timeline panel
  - Use AI: "Create a blue rectangle"
  - Verify: Operation appears in timeline with description

- [ ] **Test 10.3**: Users can undo AI actions just like manual actions
  - Create shape manually (Cmd+click)
  - Create shape via AI
  - Press Cmd+Z twice
  - Verify: Both shapes removed in reverse order

- [ ] **Test 10.4**: Redo works for AI operations
  - Create shape via AI
  - Press Cmd+Z (undo)
  - Press Cmd+Shift+Z (redo)
  - Verify: Shape reappears

### Multi-User Compatibility

- [ ] **Test 11.1**: Respect shape locking mechanism
  - User A: Drag a shape (acquires lock)
  - User B: Use AI to modify same shape
  - Verify: AI operation fails with "locked" error

- [ ] **Test 11.2**: Multiple users can use AI simultaneously
  - 3 users in different browsers
  - All use AI at same time
  - Verify: All operations succeed, no conflicts

- [ ] **Test 11.3**: All operations include user identifier for tracking
  - Create shape via AI
  - Check database entry
  - Verify: createdBy field contains correct user UID

- [ ] **Test 11.4**: Concurrent AI usage by different users works flawlessly
  - User A: "Create 10 circles in a grid"
  - User B (simultaneously): "Create a red rectangle"
  - Verify: All 11 shapes created correctly

## Security Testing

- [ ] **Test 12.1**: Authentication required for all AI operations
  - Sign out
  - Try to access AI (button should not appear)
  - Verify: No unauthorized access

- [ ] **Test 12.2**: Rate limiting enforced (20 requests/minute/user)
  - Send 21 requests rapidly
  - Verify: 21st request fails with rate limit error

- [ ] **Test 12.3**: Input validation (coordinates within bounds)
  - Test: "Create a shape at 999999, 999999"
  - Verify: Error about invalid coordinates

- [ ] **Test 12.4**: Input validation (size limits)
  - Test: "Create a rectangle 10000 pixels wide"
  - Verify: Error about invalid size (max 5000px)

- [ ] **Test 12.5**: XSS prevention (text sanitization)
  - Test: "Create text that says '<script>alert(1)</script>'"
  - Verify: Script tags stripped, no alert appears

- [ ] **Test 12.6**: SQL injection prevention (not applicable but verify)
  - Test: "Create text that says 'Robert'); DROP TABLE shapes;--'"
  - Verify: Text appears as-is, no database corruption

- [ ] **Test 12.7**: Command injection prevention
  - Test malicious commands with special characters
  - Verify: All input treated as data, not executed as code

## Edge Cases Testing

- [ ] **Test 13.1**: Invalid coordinates (outside bounds)
  - Test: "Create circle at -100000, -100000"
  - Verify: Error or clamped to valid range

- [ ] **Test 13.2**: Invalid sizes (too small)
  - Test: "Create rectangle 1 pixel wide"
  - Verify: Error or adjusted to minimum (10px)

- [ ] **Test 13.3**: Invalid sizes (too large)
  - Test: "Create circle 10000 pixels diameter"
  - Verify: Error about size limit

- [ ] **Test 13.4**: Invalid colors (malformed hex)
  - Test: "Create red circle" but AI generates invalid color
  - Verify: Validation catches error or defaults to valid color

- [ ] **Test 13.5**: Text exceeding length limit
  - Test: "Create text with 1000 characters..."
  - Verify: Text truncated to 500 characters

- [ ] **Test 13.6**: Non-existent shape identifiers
  - Test: "Delete shape with ID 'fake-id-12345'"
  - Verify: Error about shape not found

- [ ] **Test 13.7**: Locked shapes (editing attempts)
  - User A locks shape by dragging
  - User B tries to modify via AI
  - Verify: Error about shape being locked

- [ ] **Test 13.8**: Malicious input (XSS attempts)
  - Already covered in Test 12.5
  - Test multiple XSS vectors

- [ ] **Test 13.9**: Empty canvas queries
  - Delete all shapes
  - Test: "What's on the canvas?"
  - Verify: AI responds "Canvas is empty"

- [ ] **Test 13.10**: Ambiguous commands
  - Test: "Make it red" (without context)
  - Verify: AI asks for clarification or uses most recent shape

## Performance Verification

- [ ] **Test 14.1**: Measure response times for 20 requests
  - Record all response times
  - Calculate: Average, Median, 90th percentile
  - Target: 90th percentile < 2 seconds

- [ ] **Test 14.2**: Command accuracy rate
  - Test 30 diverse commands
  - Record: Success or Failure for each
  - Calculate accuracy: (Successes / 30) × 100
  - Target: ≥ 90%

- [ ] **Test 14.3**: Verify no degradation to canvas FPS
  - Open Performance Monitor
  - Record FPS before AI use
  - Use AI for 10 operations
  - Record FPS after
  - Verify: FPS stays at ~60

- [ ] **Test 14.4**: Verify sync latency remains sub-100ms
  - Use Network tab in DevTools
  - Create shape via AI
  - Measure time from RTDB write to UI update
  - Target: < 100ms

- [ ] **Test 14.5**: Monitor token usage
  - Check function logs for token usage
  - Test 20 varied commands
  - Calculate average tokens/request
  - Target: < 1000 tokens average

## User Experience Testing

- [ ] **Test 15.1**: Chat panel is visually appealing
  - Verify: Matches app aesthetic (purple gradient header)
  - Verify: Clean, professional design
  - Verify: Readable fonts and appropriate sizes

- [ ] **Test 15.2**: Empty state is helpful
  - Open AI panel on fresh canvas
  - Verify: Example commands shown
  - Verify: Clear call-to-action

- [ ] **Test 15.3**: Message history is clear
  - Send several messages
  - Verify: User messages vs AI messages visually distinct
  - Verify: Proper alignment (user right, AI left)

- [ ] **Test 15.4**: Loading state is informative
  - Submit message and observe
  - Verify: Animated indicator, "AI is thinking..." text

- [ ] **Test 15.5**: Error messages are user-friendly
  - Trigger various errors
  - Verify: No technical jargon, helpful suggestions

- [ ] **Test 15.6**: Input field is intuitive
  - Verify: Placeholder text is helpful
  - Verify: Character counter visible
  - Verify: Enter key sends message

- [ ] **Test 15.7**: Panel can be easily closed and reopened
  - Close panel with X button
  - Verify: Activation button appears
  - Click activation button
  - Verify: Panel reopens, message history preserved

## Rubric Compliance Verification

### Command Breadth (10 points target)

- [ ] Implemented 8+ distinct command types: ___ types implemented
  - Count from tests 1.1-4.4
  - Target: ≥ 8 types

- [ ] At least 2 creation commands: Yes / No
- [ ] At least 2 manipulation commands: Yes / No
- [ ] At least 1 layout command: Yes / No
- [ ] At least 1 complex multi-step command: Yes / No

### Complex Command Execution (8 points target)

- [ ] Complex commands produce 3+ properly arranged elements: Yes / No
- [ ] Multi-step plans execute correctly: Yes / No
- [ ] Smart positioning: Yes / No
- [ ] Smart styling: Yes / No
- [ ] Handle ambiguous requests: Yes / No
- [ ] Maintain visual hierarchy: Yes / No

### AI Performance & Reliability (7 points target)

- [ ] Response time < 2 seconds: Yes / No (___% of requests)
- [ ] Command accuracy ≥ 90%: Yes / No (___% accuracy)
- [ ] Token efficiency < 1000: Yes / No (___ average tokens)
- [ ] Natural conversational interface: Yes / No
- [ ] Clear loading states: Yes / No
- [ ] Helpful error messages: Yes / No
- [ ] Visual feedback: Yes / No
- [ ] Graceful degradation: Yes / No
- [ ] Multi-user simultaneous use: Yes / No
- [ ] Operations sync in real-time: Yes / No
- [ ] Shared state consistency: Yes / No
- [ ] No race conditions: Yes / No

## Final Verification

- [ ] All tests passed: ___ / ___ (target: 100%)
- [ ] Rubric score estimate: ___ / 25 (target: 23-25)
- [ ] No regressions to existing features
- [ ] Production-ready code quality
- [ ] Comprehensive error handling
- [ ] All security requirements met
- [ ] Documentation complete
- [ ] Deployment successful

**Testing Complete:** _____ (Date)  
**Tested By:** ___________  
**Overall Assessment:** _______________

Notes:

