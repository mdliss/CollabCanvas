/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Canvas Assistant - Production-Grade Intelligent Canvas Companion
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN SYSTEM IMPLEMENTATION:
 * - Matches ShapeToolbar aesthetic exactly (same gradients, shadows, spacing)
 * - Positioned in bottom-right corner next to center viewport button
 * - Professional, polished appearance consistent with app design language
 * 
 * FEATURES:
 * - Natural language shape creation and manipulation
 * - Real-time RTDB integration (shapes appear instantly for all users)
 * - Context awareness (understands selection, viewport, references)
 * - Conversation memory across sessions
 * - Layout templates for common UI patterns
 * - Full Undo/Redo support via Ctrl+Z/Ctrl+Y (atomic AI operation undo)
 * - History Timeline integration with purple AI styling
 * - Interruptible streaming (type during response to send immediately) (NEW)
 * - Faster streaming (60 chars/sec, 2.4× faster than before) (NEW)
 * 
 * ARCHITECTURE:
 * - Frontend: React component with chat interface
 * - Backend: Firebase Cloud Function with OpenAI integration
 * - Communication: HTTPS JSON API with auth token
 * - Persistence: RTDB for shapes and conversation history
 * - Undo Integration: AIOperationCommand pattern for atomic undo/redo
 * 
 * PERFORMANCE TARGETS:
 * - First response token: <500ms
 * - Complete response: <3 seconds
 * - Template creation: <2 seconds
 * - Shape creation: <200ms RTDB write
 * - AI operation registration: <250ms (fetch + register)
 * - Undo 500 AI shapes: <500ms (batched delete)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * UNDO/REDO INTEGRATION - HOW IT WORKS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Architecture Flow:
 * 1. User sends message to AI Assistant
 * 2. Cloud Function executes operations (bulk_create, template, etc.)
 * 3. Cloud Function tracks operation in /ai-operations/{userId}/operations/{operationId}
 * 4. Cloud Function returns operationId to frontend
 * 5. Frontend fetches operation data to get affected shape IDs
 * 6. Frontend fetches current shape data for redo capability
 * 7. Frontend creates AIOperationCommand with shape IDs and data
 * 8. Command registered with undo manager via registerAIOperation()
 * 9. User can now press Ctrl+Z to undo (removes all shapes atomically)
 * 10. User can press Ctrl+Y to redo (recreates all shapes)
 * 11. Operation appears in History Timeline with purple styling
 * 
 * Data Structures:
 * 
 * RTDB Operation Data (/ai-operations/{userId}/operations/{operationId}):
 * {
 *   operationId: "ai-op-1234567890_abc123",
 *   userId: "user_xyz",
 *   timestamp: 1234567890,
 *   toolCalls: [
 *     {
 *       functionName: "bulk_create",
 *       params: { shapes: [...] },
 *       affectedShapeIds: ["shape_123", "shape_456", ...]
 *     }
 *   ],
 *   reversible: true
 * }
 * 
 * AIOperationCommand Instance:
 * {
 *   canvasId: "global-canvas-v1",
 *   description: "AI: Created 50 rectangles in grid",
 *   affectedShapeIds: ["shape_123", "shape_456", ...],
 *   shapeData: [{ id: "shape_123", type: "rectangle", ... }, ...],
 *   user: { uid, displayName, ... },
 *   deleteShapeFn: deleteShape,
 *   createShapeFn: createShape,
 *   metadata: { timestamp, isAI: true }
 * }
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * TESTING COMMANDS - CONSOLE VERIFICATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Test 1: Verify AI Operation Registration
 * ─────────────────────────────────────────
 * 1. Open AI Assistant (✨ button in bottom-right)
 * 2. Type: "create 10 red circles"
 * 3. Wait for AI to create circles
 * 4. Open console and run:
 * 
 *    > window.undoManager.getFullHistory()
 * 
 * Expected Output:
 * Array with last entry showing:
 * {
 *   description: "AI: Created 10 circles",
 *   isAI: true,
 *   timestamp: <recent timestamp>,
 *   user: { uid, displayName },
 *   status: "done"
 * }
 * 
 * Test 2: Verify Atomic Undo (Ctrl+Z)
 * ────────────────────────────────────
 * 1. Create AI shapes: "create 50 blue rectangles"
 * 2. Count shapes on canvas (should be 50)
 * 3. Press Ctrl+Z (or Cmd+Z on Mac)
 * 4. All 50 shapes should disappear instantly (<500ms)
 * 5. Verify in console:
 * 
 *    > window.undoManager.getState()
 * 
 * Expected Output:
 * {
 *   undoStackSize: <decreased by 1>,
 *   redoStackSize: <increased by 1>,
 *   canUndo: true/false,
 *   canRedo: true
 * }
 * 
 * Test 3: Verify Atomic Redo (Ctrl+Y)
 * ────────────────────────────────────
 * 1. After undoing in Test 2, press Ctrl+Y (or Cmd+Y)
 * 2. All 50 shapes should reappear
 * 3. Verify shapes have correct properties (position, color, size)
 * 
 * Test 4: Verify History Timeline Display
 * ────────────────────────────────────────
 * 1. Open History Timeline (📜 dropdown in bottom-left)
 * 2. Create AI shapes: "create login form"
 * 3. AI operation should appear in timeline with:
 *    - Purple gradient background
 *    - ✨ sparkle icon on left
 *    - "AI:" prefix in description
 *    - Different hover state (purple tint)
 * 
 * Test 5: Verify Mixed Manual/AI Operations
 * ──────────────────────────────────────────
 * 1. Manually create a rectangle (R key)
 * 2. Ask AI: "create 10 circles"
 * 3. Manually create another rectangle
 * 4. Open History Timeline - should show:
 *    - Manual rectangle (normal styling)
 *    - AI circles (purple styling with ✨)
 *    - Manual rectangle (normal styling)
 * 5. Press Ctrl+Z three times:
 *    - First undo: removes second manual rectangle
 *    - Second undo: removes all 10 AI circles atomically
 *    - Third undo: removes first manual rectangle
 * 
 * Test 6: Verify Large Batch Performance
 * ───────────────────────────────────────
 * 1. Ask AI: "create 500 rectangles in random positions"
 * 2. Wait for shapes to appear
 * 3. Start timer and press Ctrl+Z
 * 4. Measure time until all shapes disappear
 * 
 * Expected: <500ms for 500 shapes (batched delete)
 * 
 * Console command:
 * > console.time('ai-undo'); // Press Ctrl+Z here
 * > console.timeEnd('ai-undo');
 * 
 * Test 7: Verify Shape Data Fetch
 * ────────────────────────────────
 * After AI creates shapes, check console logs for:
 * "[AI Canvas] Registering AI operation with N affected shapes"
 * "[AI Canvas] Fetched N shape data objects for redo"
 * "[AI Canvas] ✅ AI operation registered for undo/redo: AI: ..."
 * 
 * Test 8: Verify Operation ID Flow
 * ─────────────────────────────────
 * In console after AI operation:
 * > firebase.database().ref('ai-operations/<your-uid>/last-operation').once('value').then(s => console.log(s.val()))
 * 
 * Should return operationId like: "ai-op-1234567890_abc123"
 * 
 * Test 9: Verify Affected Shape IDs
 * ──────────────────────────────────
 * After AI creates 10 shapes:
 * > const history = window.undoManager.getFullHistory()
 * > const lastAI = history.filter(h => h.isAI).pop()
 * > console.log(lastAI)
 * 
 * Note: AIOperationCommand stores affectedShapeIds but it's internal to the command object.
 * To verify, check console logs during operation registration.
 * 
 * Test 10: Verify Error Handling
 * ───────────────────────────────
 * Simulate error by disconnecting network:
 * 1. Open DevTools → Network tab → Toggle offline
 * 2. Ask AI: "create 5 circles"
 * 3. Should show error message
 * 4. Reconnect network
 * 5. Retry - should work and register operation
 * 
 * Test 11: Verify Streaming Interruption (NEW)
 * ─────────────────────────────────────────────
 * 1. Ask AI a question that generates a long response
 * 2. Watch the response stream character-by-character
 * 3. While streaming is active (before it finishes):
 *    - Notice input placeholder says "Type to interrupt..."
 *    - Notice input has purple tint/glow
 *    - Start typing a new message
 *    - Press Enter
 * 4. Expected behavior:
 *    - Stream immediately stops
 *    - Previous message completes and is saved to history
 *    - New message is sent
 *    - No waiting for stream to finish
 * 
 * Test 12: Verify Faster Streaming Speed (NEW)
 * ──────────────────────────────────────────────
 * 1. Ask AI: "explain what you can do"
 * 2. Observe streaming speed (should be ~60 chars/sec)
 * 3. Compare to old speed (was ~25 chars/sec)
 * 4. Should feel noticeably snappier (2.4× faster)
 * 
 * Console verification:
 * > // Watch for this during stream:
 * [AI Streaming] 🎬 Starting stream animation: 150 chars
 * [AI Streaming] ✅ Stream animation complete
 * 
 * > // If interrupted:
 * [AI Streaming] ⚡ User interrupted stream - cancelling animation
 * [AI Streaming] ⏹️  Stream interrupted by user - completing message immediately
 * [AI Streaming] ✅ Message completed and stored
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * All functionality documented inline - no external documentation files.
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, onValue, push, set, query, limitToLast, get } from 'firebase/database';
import { rtdb } from '../../services/firebase';
import { useUndo } from '../../contexts/UndoContext';
import { AIOperationCommand } from '../../utils/commands';
import { deleteShape, createShape } from '../../services/canvasRTDB';

// Production Cloud Function endpoint
const AI_ENDPOINT = 'https://us-central1-collabcanvas-99a09.cloudfunctions.net/aiCanvasAgent';

/**
 * Generate or retrieve session ID for conversation persistence
 * 
 * Session ID is stored in sessionStorage to maintain conversation
 * across page reloads within the same browser session.
 * New tab/window = new conversation.
 * 
 * @returns {string} Unique session identifier
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('ai-session-id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ai-session-id', sessionId);
  }
  return sessionId;
};

/**
 * AI Canvas Assistant Component with Context Awareness
 * 
 * Provides intelligent canvas assistant with visual design matching toolbar.
 * Positioned in bottom-right corner for logical grouping with viewport controls.
 * 
 * Context Awareness:
 * - Knows which shapes are selected (understands "this shape")
 * - Knows viewport center (understands "here")
 * - Knows zoom level (scales operations appropriately)
 * - Knows all shapes on canvas (can query and reference)
 * 
 * Design Decisions:
 * - Button positioned left of center button (right: 78px vs center at right: 20px)
 * - Chat panel expands upward from button (bottom anchored)
 * - Same visual treatment as ShapeToolbar (gradients, shadows, blur)
 * - Professional polish matching existing design system
 * 
 * @param {Array} selectedShapeIds - IDs of currently selected shapes
 * @param {Array} shapes - All shapes on canvas
 * @param {Object} stagePos - Stage position {x, y}
 * @param {number} stageScale - Current zoom level (0.1 to 4.0)
 * @param {React.RefObject} stageRef - Reference to Konva Stage
 * 
 * @example
 * // Integrated into Canvas component with context
 * <AICanvas 
 *   selectedShapeIds={selectedIds}
 *   shapes={shapes}
 *   stagePos={stagePos}
 *   stageScale={stageScale}
 *   stageRef={stageRef}
 * />
 */
export default function AICanvas({ 
  canvasId = 'global-canvas-v1',
  selectedShapeIds = [], 
  shapes = [], 
  stagePos = { x: 0, y: 0 },
  stageScale = 1,
  stageRef = null,
  isOpen: externalIsOpen = null,
  onOpenChange = null,
  isLayersPanelVisible = false,
  isVisible = true
}) {
  const { user } = useAuth();
  const { registerAIOperation } = useUndo();
  
  // Listen for Design Suggestions open/close
  const [isDesignSuggestionsOpen, setIsDesignSuggestionsOpen] = useState(false);
  
  useEffect(() => {
    const handleDesignToggle = (e) => {
      const designIsOpen = e.detail?.isOpen || false;
      console.log('[AICanvas] Design Suggestions toggled:', designIsOpen ? 'OPEN' : 'CLOSED');
      setIsDesignSuggestionsOpen(designIsOpen);
    };
    
    window.addEventListener('designSuggestionsToggle', handleDesignToggle);
    return () => window.removeEventListener('designSuggestionsToggle', handleDesignToggle);
  }, []);
  
  // Use controlled state if provided, otherwise local state
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== null ? externalIsOpen : localIsOpen;
  
  const setIsOpen = (newValue) => {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[🎯 AI ASSISTANT POSITIONING] State change triggered');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[🎯 AI ASSISTANT] Previous state:', isOpen ? 'OPEN' : 'CLOSED');
    console.log('[🎯 AI ASSISTANT] New state:', newValue ? 'OPEN' : 'CLOSED');
    console.log('[🎯 AI ASSISTANT] Controlled by parent:', !!onOpenChange);
    console.log('[🎯 AI ASSISTANT] Timestamp:', new Date().toISOString());
    
    if (onOpenChange) {
      console.log('[🎯 AI ASSISTANT] Notifying parent component of state change');
      onOpenChange(newValue);
    } else {
      console.log('[🎯 AI ASSISTANT] Updating local state directly');
      setLocalIsOpen(newValue);
    }
    
    // Emit event for Design Suggestions to listen
    console.log('[🎯 AI ASSISTANT] 📡 Emitting aiAssistantToggle event:', newValue ? 'OPEN' : 'CLOSED');
    console.log('[🎯 AI ASSISTANT] Event detail:', { isOpen: newValue });
    window.dispatchEvent(new CustomEvent('aiAssistantToggle', { 
      detail: { isOpen: newValue } 
    }));
    console.log('[🎯 AI ASSISTANT] ✅ Event dispatched successfully');
    console.log('[🎯 AI ASSISTANT] Position: ALWAYS FAR RIGHT (20px)');
    console.log('═══════════════════════════════════════════════════════════════');
  };
  
  // Calculate dynamic positioning - AI stays on far right always
  const BASE_RIGHT = 20; // Far right edge
  const buttonRight = 78; // Fixed position for button
  
  // FIXED LOGIC: AI panel ALWAYS stays at far right (never slides)
  // This ensures when both panels are open, AI is on right, Design is on left
  const panelRight = BASE_RIGHT; // Always far right
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  
  // Streaming state for progressive display
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingAnimationRef = useRef(null); // Store animation frame ID for cancellation
  const fullStreamingMessageRef = useRef(''); // Store full message for interruption completion
  const streamingContextRef = useRef(null); // Store message context for completion
  
  // Conversation persistence
  const sessionIdRef = useRef(getSessionId());
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * Load Conversation History from RTDB
   * 
   * Retrieves last 20 messages from current session on component mount.
   * Enables conversation continuity across page reloads.
   * 
   * RTDB Path: /ai-conversations/{userId}/{sessionId}/messages
   * 
   * Architecture:
   * - Sliding window: Keep last 20 messages (prevents unbounded growth)
   * - Session-based: Each browser tab has separate conversation
   * - User-scoped: Conversations private to each user
   * 
   * Performance:
   * - Query uses limitToLast(20) for efficient retrieval
   * - Loads on mount only, then real-time sync inactive
   * - <200ms load time typical
   */
  useEffect(() => {
    if (!user?.uid) return;

    const conversationRef = ref(
      rtdb,
      `ai-conversations/${user.uid}/${sessionIdRef.current}/messages`
    );

    // Query last 20 messages
    const messagesQuery = query(conversationRef, limitToLast(20));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const loadedMessages = [];
      snapshot.forEach((child) => {
        loadedMessages.push(child.val());
      });
      
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Cleanup: Cancel streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingAnimationRef.current) {
        cancelAnimationFrame(streamingAnimationRef.current);
      }
    };
  }, []);

  /**
   * Aggressive Input Focus Strategy
   * 
   * Multiple mechanisms to ensure input stays focused for seamless typing:
   * 1. useEffect triggers on state changes
   * 2. RequestAnimationFrame ensures focus after browser paint
   * 3. Multiple focus attempts with increasing delays
   * 4. Console logging to debug focus issues
   */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Immediate focus attempt
      inputRef.current.focus();
      
      // Focus after next frame (ensures DOM painted)
      requestAnimationFrame(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
        }
      });
      
      // Backup focus after delay
      const timer1 = setTimeout(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
        }
      }, 100);
      
      const timer2 = setTimeout(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
        }
      }, 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen, messages.length]); // Re-focus whenever panel opens or messages change

  /**
   * Send Message with Persistent Input Focus
   * 
   * After sending, keeps input focused so user can immediately type next message.
   * This creates a natural conversational flow without requiring repeated clicks.
   * 
   * UX Improvement:
   * - Old: User types → Send → Click input → Type again (annoying)
   * - New: User types → Send → Type again immediately (seamless)
   * 
   * @example
   * // User types "create circle" → Enter → Immediately types "make it bigger"
   * // No mouse interaction required between messages
   */
  /**
   * Store Message in RTDB for Conversation Persistence
   * 
   * Stores each message (user and assistant) in RTDB for:
   * - Multi-turn conversation context
   * - Persistence across page reloads  
   * - Conversation history retrieval
   * 
   * RTDB Path: /ai-conversations/{userId}/{sessionId}/messages
   * 
   * @param {Object} message - Message object with role and content
   */
  const storeMessage = async (message) => {
    if (!user?.uid) return;
    
    const conversationRef = ref(
      rtdb,
      `ai-conversations/${user.uid}/${sessionIdRef.current}/messages`
    );
    
    const messageWithTimestamp = {
      ...message,
      timestamp: Date.now()
    };
    
    await push(conversationRef, messageWithTimestamp);
  };

  /**
   * Cancel Active Streaming and Complete Message
   * 
   * Interrupts streaming animation and immediately completes the message.
   * Called when user sends new message while previous response is still streaming.
   * 
   * This enables rapid-fire interaction without waiting for slow streaming to complete.
   * 
   * Implementation:
   * 1. Cancel animation frame loop
   * 2. Add full message to conversation immediately
   * 3. Clear streaming state
   * 4. Ready for next message
   * 
   * The interrupted message still gets saved to history with its full content.
   */
  const cancelStreaming = () => {
    if (!isStreaming) return;

    // Cancel animation frame
    if (streamingAnimationRef.current) {
      cancelAnimationFrame(streamingAnimationRef.current);
      streamingAnimationRef.current = null;
    }

    // Complete the message immediately with full content
    const fullMessage = fullStreamingMessageRef.current;
    const context = streamingContextRef.current;

    if (fullMessage && context) {
      // Clear streaming state
      setStreamingMessage('');
      setIsStreaming(false);

      // Add complete message to conversation
      const assistantMessageObj = { role: 'assistant', content: fullMessage };
      storeMessage(assistantMessageObj);
      setMessages([
        ...context.newMessages,
        assistantMessageObj,
      ]);
    }

    // Clear refs
    fullStreamingMessageRef.current = '';
    streamingContextRef.current = null;
  };
  
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // CRITICAL: If user types during streaming, interrupt the stream
    // This allows rapid-fire interaction without waiting for slow streaming
    if (isStreaming) {
      cancelStreaming();
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);

    // Create user message object
    const userMessageObj = { role: 'user', content: userMessage };
    
    // Store user message in RTDB for persistence
    await storeMessage(userMessageObj);

    // Add user message to local state (RTDB listener will also add it, but this is immediate)
    const newMessages = [
      ...messages,
      userMessageObj,
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Get auth token
      const token = await user.getIdToken();

      /**
       * Calculate Viewport Center in Canvas Coordinates
       * 
       * Converts viewport center to canvas coordinates accounting for zoom/pan.
       * Used when AI needs to place shapes "here" or "at center".
       */
      const viewportCenterX = (-stagePos.x + window.innerWidth / 2) / stageScale;
      const viewportCenterY = (-stagePos.y + (window.innerHeight - 50) / 2) / stageScale;
      
      /**
       * Extract Canvas Context for AI
       * 
       * Provides AI with awareness of current canvas state:
       * - Selected shapes (for "this"/"these" references)
       * - Viewport center (for "here"/"center" placement)
       * - Zoom level (for scale-appropriate operations)
       * - All shapes (for querying and referencing)
       */
      const canvasContext = {
        selectedShapeIds,
        selectedShapes: shapes.filter(s => selectedShapeIds.includes(s.id)).map(s => ({
          id: s.id,
          type: s.type,
          x: Math.round(s.x),
          y: Math.round(s.y),
          width: Math.round(s.width || 0),
          height: Math.round(s.height || 0),
          fill: s.fill
        })),
        viewportCenter: {
          x: Math.round(viewportCenterX),
          y: Math.round(viewportCenterY)
        },
        zoom: stageScale,
        totalShapes: shapes.length
      };

      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          canvasId: canvasId, // Dynamic canvas ID from props
          canvasContext, // Pass canvas context to AI
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      /**
       * Progressive Display Simulation - Faster Streaming
       * 
       * Displays AI response token-by-token at accelerated speed for snappier UX.
       * Full response received from backend, but animated on frontend.
       * 
       * Performance:
       * - Displays ~60 characters per second (2.4× faster than before)
       * - Uses requestAnimationFrame for smooth 60fps animation
       * - ~1 character per frame at 60fps = 60 chars/second
       * - Feels responsive while still being readable
       * 
       * Interruption Support:
       * - User can send new message during streaming
       * - Animation cancels immediately via cancelStreaming()
       * - Enables rapid-fire interaction without waiting
       * 
       * Architecture Decision:
       * - Simpler than true Server-Sent Events
       * - Works with tool calling (no SSE complexity)
       * - Interruptible for better UX
       */
      const fullMessage = data.message;
      
      // Store full message and context for interruption handling
      fullStreamingMessageRef.current = fullMessage;
      streamingContextRef.current = { newMessages };
      
      setIsStreaming(true);
      setStreamingMessage('');

      // Animate message display character by character
      let currentIndex = 0;
      let lastFrameTime = performance.now();
      const charsPerSecond = 60; // Faster streaming (was 25) - 2.4× speed increase
      const msPerChar = 1000 / charsPerSecond; // ~16.67ms per character

      const animateMessage = (currentTime) => {
        // Calculate how many characters to display based on elapsed time
        const elapsed = currentTime - lastFrameTime;
        const charsToAdd = Math.floor(elapsed / msPerChar);

        if (charsToAdd > 0 && currentIndex < fullMessage.length) {
          lastFrameTime = currentTime;
          currentIndex = Math.min(currentIndex + charsToAdd, fullMessage.length);
          setStreamingMessage(fullMessage.substring(0, currentIndex));
        }

        if (currentIndex < fullMessage.length) {
          // Store animation frame ID for cancellation
          streamingAnimationRef.current = requestAnimationFrame(animateMessage);
        } else {
          // Animation complete - add to permanent messages
          streamingAnimationRef.current = null;
          setStreamingMessage('');
          setIsStreaming(false);

          // Create assistant message object
          const assistantMessageObj = { role: 'assistant', content: fullMessage };

          // Store assistant message in RTDB for persistence
          storeMessage(assistantMessageObj);

          setMessages([
            ...newMessages,
            assistantMessageObj,
          ]);

          // Clear refs
          fullStreamingMessageRef.current = '';
          streamingContextRef.current = null;
        }
      };

      streamingAnimationRef.current = requestAnimationFrame(animateMessage);
      
      /**
       * Register AI Operation with Undo Manager
       *
       * After AI executes operations (create shapes, templates, etc.), we register
       * them with the undo manager for proper Ctrl+Z/Ctrl+Y support.
       */
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('[📝 AI HISTORY REGISTRATION] Starting registration process...');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('[📝 AI HISTORY] Tools executed:', data.toolsExecuted);
      console.log('[📝 AI HISTORY] Operation ID:', data.operationId);
      console.log('[📝 AI HISTORY] registerAIOperation function exists:', !!registerAIOperation);
      console.log('[📝 AI HISTORY] User message:', fullMessage);
      
      if (data.toolsExecuted > 0 && data.operationId && registerAIOperation) {
        try {
          const regStartTime = performance.now();
          console.log('[📝 AI HISTORY] ✓ All preconditions met - proceeding with registration');
          
          // Fetch AI operation data from RTDB to get affected shape IDs
          const operationPath = `ai-operations/${user.uid}/operations/${data.operationId}`;
          console.log('[📝 AI HISTORY] Fetching operation data from:', operationPath);
          
          const operationRef = ref(rtdb, operationPath);
          const fetchOpStart = performance.now();
          const operationSnapshot = await get(operationRef);
          console.log(`[📝 AI HISTORY] Operation data fetched in ${(performance.now() - fetchOpStart).toFixed(2)}ms`);
          
          const operationData = operationSnapshot.val();
          console.log('[📝 AI HISTORY] Operation data:', operationData);

          if (operationData && operationData.toolCalls) {
            console.log('[📝 AI HISTORY] Processing', operationData.toolCalls.length, 'tool calls');
            
            // Extract all affected shape IDs from tool calls
            const allShapeIds = [];
            for (const toolCall of operationData.toolCalls) {
              console.log('[📝 AI HISTORY] Tool call:', toolCall.functionName, 'Affected shapes:', toolCall.affectedShapeIds?.length || 0);
              if (toolCall.affectedShapeIds && Array.isArray(toolCall.affectedShapeIds)) {
                allShapeIds.push(...toolCall.affectedShapeIds);
              }
            }

            // Deduplicate shape IDs
            const uniqueShapeIds = [...new Set(allShapeIds)];
            console.log('[📝 AI HISTORY] Total affected shapes (after dedup):', uniqueShapeIds.length);
            console.log('[📝 AI HISTORY] Shape IDs:', uniqueShapeIds);

            if (uniqueShapeIds.length > 0) {
              // Fetch current shape data for redo capability
              const shapesPath = `canvas/${canvasId}/shapes`;
              console.log('[📝 AI HISTORY] Fetching shape data from:', shapesPath);
              
              const shapesRef = ref(rtdb, shapesPath);
              const fetchShapesStart = performance.now();
              const shapesSnapshot = await get(shapesRef);
              console.log(`[📝 AI HISTORY] Shape data fetched in ${(performance.now() - fetchShapesStart).toFixed(2)}ms`);
              
              const allShapes = shapesSnapshot.val() || {};
              console.log('[📝 AI HISTORY] Total shapes in canvas:', Object.keys(allShapes).length);

              // Get shape data for affected shapes only
              const shapeData = uniqueShapeIds
                .map(id => allShapes[id])
                .filter(Boolean); // Filter out null/undefined

              console.log('[📝 AI HISTORY] Shape data retrieved:', shapeData.length, 'shapes');
              
              if (shapeData.length !== uniqueShapeIds.length) {
                console.warn(`[📝 AI HISTORY] ⚠️ Warning: ${uniqueShapeIds.length - shapeData.length} shapes not found in canvas!`);
              }

              // Create AI operation command
              const historyDesc = `AI: ${fullMessage.substring(0, 50)}${fullMessage.length > 50 ? '...' : ''}`;
              console.log('[📝 AI HISTORY] Creating AIOperationCommand with description:', historyDesc);

              const aiCommand = new AIOperationCommand({
                canvasId: canvasId,
                description: historyDesc,
                affectedShapeIds: uniqueShapeIds,
                shapeData: shapeData,
                user: user,
                deleteShapeFn: deleteShape,
                createShapeFn: createShape
              });

              console.log('[📝 AI HISTORY] AIOperationCommand created:', {
                description: aiCommand.getDescription(),
                shapeCount: uniqueShapeIds.length,
                userName: user.displayName || user.email,
                timestamp: new Date().toISOString()
              });

              // Register with undo manager
              const regCallStart = performance.now();
              registerAIOperation(aiCommand);
              console.log(`[📝 AI HISTORY] ✅ registerAIOperation() called in ${(performance.now() - regCallStart).toFixed(2)}ms`);
              console.log(`[📝 AI HISTORY] ✅ REGISTRATION COMPLETE - Total time: ${(performance.now() - regStartTime).toFixed(2)}ms`);
              console.log('[📝 AI HISTORY] Operation should now appear in history timeline');
            } else {
              console.warn('[📝 AI HISTORY] ⚠️ No shape IDs to register - skipping');
            }
          } else {
            console.warn('[📝 AI HISTORY] ⚠️ No operation data or tool calls found');
            console.warn('[📝 AI HISTORY] Operation data:', operationData);
          }
        } catch (error) {
          console.error('[📝 AI HISTORY] ❌ REGISTRATION FAILED');
          console.error('[📝 AI HISTORY] Error:', error);
          console.error('[📝 AI HISTORY] Error stack:', error.stack);
          // Non-critical error - shapes were created successfully, just can't undo
        }
      } else {
        console.warn('[📝 AI HISTORY] ⚠️ Registration skipped - preconditions not met:');
        console.warn('[📝 AI HISTORY]   - toolsExecuted:', data.toolsExecuted, '(expected > 0)');
        console.warn('[📝 AI HISTORY]   - operationId:', data.operationId, '(expected truthy)');
        console.warn('[📝 AI HISTORY]   - registerAIOperation:', !!registerAIOperation, '(expected true)');
      }
      console.log('═══════════════════════════════════════════════════════════════');
      
      // CRITICAL: Re-focus input after response for seamless conversation flow
      // Longer timeout ensures React re-renders complete before focus
      setTimeout(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
        }
      }, 200);
      
    } catch (err) {
      let errorMessage = 'Failed to communicate with AI assistant.';

      if (err.message.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before sending another message.';
      } else if (err.message.includes('Unauthorized')) {
        errorMessage = 'Authentication error. Please try signing out and back in.';
      } else if (err.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);

      // Remove the user message if request failed
      setMessages(messages);

      // Re-focus input even on error for retry
      setTimeout(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
        }
      }, 200);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Keyboard Event Handler
   * 
   * Handles:
   * - Enter: Send message
   * - Escape: Close AI panel
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Global Escape Key Handler
   * 
   * Closes AI panel when Escape is pressed.
   * Only active when panel is open.
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  /**
   * Clear Conversation History
   * 
   * Clears messages from both local state and RTDB.
   * Generates new session ID for fresh conversation.
   * 
   * Actions:
   * - Clears local messages array
   * - Deletes RTDB conversation data
   * - Generates new session ID
   * - Stores new session ID in sessionStorage
   */
  const clearChat = async () => {
    setMessages([]);
    setError(null);
    
    // Delete conversation from RTDB
    if (user?.uid) {
      const conversationRef = ref(
        rtdb,
        `ai-conversations/${user.uid}/${sessionIdRef.current}`
      );
      await set(conversationRef, null); // Delete conversation
    }
    
    // Generate new session ID for fresh conversation
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ai-session-id', newSessionId);
    sessionIdRef.current = newSessionId;
  };

  if (!user) {
    return null; // Don't show AI assistant if not authenticated
  }

  /**
   * Button Style Generator - Matches Toolbar Design System Exactly
   * 
   * Replicates the exact same visual states as ShapeToolbar for consistency.
   * Uses identical gradients, shadows, transforms, and transitions.
   * 
   * States:
   * - Default: Clean white with subtle shadow
   * - Hover: Light gray with lift effect
   * - Active (open): Darker gray with inset shadow
   * 
   * Design Tokens (from ShapeToolbar):
   * - Border radius: 10px
   * - Button size: 48px × 48px
   * - Shadow: dual-layer (8px blur + 2px blur)
   * - Transitions: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
   */
  const getAIButtonStyle = () => {
    if (isOpen) {
      // Active state: panel is open
      return {
        background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
        color: '#111827',
        transform: 'scale(0.96)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1) inset'
      };
    }
    if (hoveredButton === 'ai') {
      // Hover state
      return {
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        color: '#111827',
        transform: 'translateY(-1px)',
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)'
      };
    }
    // Default state
    return {
      background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
      color: '#374151',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
    };
  };

  return (
    <>
      {/* AI Toggle Button - Dynamically positioned based on layer panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setHoveredButton('ai')}
        onMouseLeave={() => setHoveredButton(null)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: `${buttonRight}px`, // Fixed position - doesn't slide
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), all 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.25s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.25s',
          fontWeight: '600',
          zIndex: 1001,
          opacity: isVisible ? 1 : 0,
          ...getAIButtonStyle(),
          transform: !isVisible ? 'translateY(10px)' : getAIButtonStyle().transform || 'translateY(0)'
        }}
        title="AI Assistant (Shift+A)"
      >
        ✨
      </button>

      {/* Chat Panel - Dynamically positioned, slides left when Design opens */}
      <div
        style={{
          position: 'fixed',
          bottom: '78px', // Above the buttons
          right: `${panelRight}px`, // Slides left when Design Suggestions opens
          width: '380px',
          maxHeight: '600px',
          // EXACT TOOLBAR STYLING:
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          overflow: 'hidden',
          // SMOOTH TRANSITIONS:
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
          {/* Header - Compact toolbar-style header */}
          <div
            style={{
              padding: '14px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>✨</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  AI Assistant
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                  Natural language control
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)';
                }}
                style={{
                  padding: '6px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
                title="Clear conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            )}
          </div>

          {/* Messages Container - Clean background matching toolbar */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              background: 'transparent', // Transparent to show container background
            }}
          >
            {/* Empty state - Minimalist design */}
            {messages.length === 0 && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.2 }}>✨</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  AI Canvas Assistant
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', lineHeight: '1.5', color: '#6b7280' }}>
                  Create and modify shapes with natural language
                </p>
                <div style={{ textAlign: 'left', fontSize: '12px', lineHeight: '1.6', color: '#6b7280' }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: '#374151' }}>Examples:</p>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    <li>"Create a red circle"</li>
                    <li>"Make a login form"</li>
                    <li>"Arrange shapes in grid"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Message bubbles - Simplified toolbar-matching design */}
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: message.role === 'user' 
                      ? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
                      : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    color: '#111827',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {/* Streaming message - Progressive display animation */}
            {isStreaming && streamingMessage && (
              <div
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    color: '#111827',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {streamingMessage}
                  <span style={{ 
                    display: 'inline-block',
                    width: '2px',
                    height: '14px',
                    background: '#374151',
                    marginLeft: '2px',
                    animation: 'blink 1s step-end infinite',
                    verticalAlign: 'text-bottom'
                  }}>|</span>
                </div>
              </div>
            )}

            {/* Loading indicator - Minimal toolbar-style */}
            {isLoading && (
              <div
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    color: '#6b7280',
                    fontSize: '13px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ca3af', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ca3af', animation: 'pulse 1.5s ease-in-out infinite 0.2s' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ca3af', animation: 'pulse 1.5s ease-in-out infinite 0.4s' }} />
                  </div>
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {/* Error display - Toolbar-matching design */}
            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  color: '#991b1b',
                  fontSize: '12px',
                  marginBottom: '10px',
                  border: '1px solid rgba(153, 27, 27, 0.1)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  lineHeight: '1.4',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Toolbar-matching design */}
          <div
            style={{
              padding: '14px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isStreaming ? "Type to interrupt..." : "Ask AI..."}
                disabled={isLoading}
                maxLength={500}
                autoFocus={isOpen}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: isStreaming 
                    ? '1px solid rgba(139, 92, 246, 0.3)' 
                    : '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: isStreaming 
                    ? 'rgba(245, 243, 255, 0.5)' 
                    : '#ffffff',
                  boxShadow: isStreaming 
                    ? '0 0 0 3px rgba(139, 92, 246, 0.1)' 
                    : 'none',
                }}
                onFocus={(e) => {
                  if (!isStreaming) {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(156, 163, 175, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (!isStreaming) {
                    // Allow blur so user can interact with canvas
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                onMouseEnter={(e) => {
                  if (inputValue.trim() && !isLoading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                style={{
                  padding: '10px 14px',
                  background: !inputValue.trim() || isLoading
                    ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                  color: !inputValue.trim() || isLoading ? '#9ca3af' : '#374151',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '8px',
                  fontSize: '20px',
                  cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                  width: '44px',
                  height: '40px',
                }}
                title="Send message (Enter)"
              >
                ↗
              </button>
            </div>
          </div>
        </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

