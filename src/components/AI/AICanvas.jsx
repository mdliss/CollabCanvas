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
 * - Undo support for AI operations
 * - Usage tracking and budget enforcement
 * 
 * ARCHITECTURE:
 * - Frontend: React component with chat interface
 * - Backend: Firebase Cloud Function with OpenAI integration
 * - Communication: HTTPS JSON API with auth token
 * - Persistence: RTDB for shapes and conversation history
 * 
 * PERFORMANCE TARGETS:
 * - First response token: <500ms
 * - Complete response: <3 seconds
 * - Template creation: <2 seconds
 * - Shape creation: <200ms RTDB write
 * 
 * All functionality documented inline - no external documentation files.
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, onValue, push, set, query, limitToLast } from 'firebase/database';
import { rtdb } from '../../services/firebase';

const CANVAS_ID = 'global-canvas-v1';

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
  selectedShapeIds = [], 
  shapes = [], 
  stagePos = { x: 0, y: 0 },
  stageScale = 1,
  stageRef = null,
  isOpen: externalIsOpen = null,
  onOpenChange = null
}) {
  const { user } = useAuth();
  
  // Use controlled state if provided, otherwise local state
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== null ? externalIsOpen : localIsOpen;
  const setIsOpen = onOpenChange || setLocalIsOpen;
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  
  // Streaming state for progressive display
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
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
        console.log(`[AI Canvas] Loaded ${loadedMessages.length} messages from conversation history`);
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
      console.log('[AI Canvas] Focus attempt 1 (immediate)');
      
      // Focus after next frame (ensures DOM painted)
      requestAnimationFrame(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
          console.log('[AI Canvas] Focus attempt 2 (RAF)');
        }
      });
      
      // Backup focus after delay
      const timer1 = setTimeout(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
          console.log('[AI Canvas] Focus attempt 3 (100ms)');
        }
      }, 100);
      
      const timer2 = setTimeout(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
          console.log('[AI Canvas] Focus attempt 4 (300ms)');
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
    console.log(`[AI Canvas] Stored message in RTDB:`, message.role);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

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

      console.log('[AI Canvas] Sending request with canvas context:', canvasContext);

      // Call AI endpoint with canvas context
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
          canvasId: CANVAS_ID,
          canvasContext, // Pass canvas context to AI
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      /**
       * Progressive Display Simulation - OpenAI Streaming Pace
       * 
       * Displays AI response token-by-token at OpenAI's natural streaming speed.
       * Full response received from backend, but animated on frontend
       * for ChatGPT-like perceived responsiveness.
       * 
       * Performance:
       * - Displays ~25 characters per second (matches OpenAI streaming)
       * - Uses requestAnimationFrame for smooth 60fps animation
       * - ~0.4 characters per frame at 60fps = 24 chars/second
       * - Feels natural and allows comfortable reading
       * 
       * Architecture Decision:
       * - Simpler than true Server-Sent Events
       * - Works with tool calling (no SSE complexity)
       * - Same visual effect with less backend complexity
       */
      const fullMessage = data.message;
      setIsStreaming(true);
      setStreamingMessage('');
      
      // Animate message display character by character
      let currentIndex = 0;
      let lastFrameTime = performance.now();
      const charsPerSecond = 25; // Match OpenAI's streaming speed
      const msPerChar = 1000 / charsPerSecond; // ~40ms per character
      
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
          requestAnimationFrame(animateMessage);
        } else {
          // Animation complete - add to permanent messages
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
        }
      };
      
      requestAnimationFrame(animateMessage);

      console.log(`[AI Canvas] Response time: ${data.responseTime}ms, Tools: ${data.toolsExecuted}, Tokens: ${data.tokenUsage}`);
      
      // CRITICAL: Re-focus input after response for seamless conversation flow
      // Longer timeout ensures React re-renders complete before focus
      setTimeout(() => {
        if (inputRef.current && isOpen) {
          inputRef.current.focus();
          console.log('[AI Canvas] Input re-focused after response');
        }
      }, 200);
      
    } catch (err) {
      console.error('[AI Canvas] Error:', err);
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
          console.log('[AI Canvas] Input re-focused after error');
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
        console.log('[AI Canvas] Closed via Escape key');
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
      console.log('[AI Canvas] Conversation cleared from RTDB');
    }
    
    // Generate new session ID for fresh conversation
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ai-session-id', newSessionId);
    sessionIdRef.current = newSessionId;
    console.log('[AI Canvas] New session started:', newSessionId);
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
      {/* AI Toggle Button - Matches Toolbar Aesthetic Exactly
          Positioned left of center button in bottom-right corner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setHoveredButton('ai')}
        onMouseLeave={() => setHoveredButton(null)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '78px', // Center button at 20px + 48px width + 10px gap = 78px
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: '600',
          zIndex: 1000,
          ...getAIButtonStyle()
        }}
        title="AI Assistant"
      >
        ✨
      </button>

      {/* Chat Panel - Toolbar-Matching Design with Smooth Transitions
          Positioned in bottom-right, left of toolbar to avoid overlap */}
      <div
        style={{
          position: 'fixed',
          bottom: '78px', // Above the AI button with 10px gap
          right: '88px', // Bottom-right area, just left of toolbar
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
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
                placeholder="Ask AI..."
                disabled={isLoading}
                maxLength={500}
                autoFocus={isOpen}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  background: '#ffffff',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(156, 163, 175, 0.1)';
                  console.log('[AI Canvas] Input focused - cursor visible');
                }}
                onBlur={(e) => {
                  // Allow blur so user can interact with canvas
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
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

