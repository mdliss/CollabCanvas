import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CANVAS_ID = 'global-canvas-v1';

// You'll need to set this environment variable after deploying the cloud function
const AI_ENDPOINT = 'https://us-central1-collabcanvas-99a09.cloudfunctions.net/aiCanvasAgent';

export default function AICanvas() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);

    // Add user message to chat
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Get auth token
      const token = await user.getIdToken();

      // Call AI endpoint
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add AI response to chat
      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.message },
      ]);

      console.log(`[AI Canvas] Response time: ${data.responseTime}ms, Tools: ${data.toolsExecuted}, Tokens: ${data.tokenUsage}`);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  if (!user) {
    return null; // Don't show AI assistant if not authenticated
  }

  return (
    <>
      {/* Floating Activation Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            zIndex: 10000,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
          }}
          title="AI Assistant"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '420px',
            height: '640px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                AI Canvas Assistant
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                Create and modify shapes with natural language
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  title="Clear chat"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                title="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              background: '#f9fafb',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#6b7280',
                }}
              >
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginBottom: '16px', opacity: 0.3 }}
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                  AI Canvas Assistant
                </h4>
                <p style={{ margin: '0 0 20px 0', fontSize: '14px', lineHeight: '1.6' }}>
                  Create and manipulate shapes using natural language
                </p>
                <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.8' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151' }}>Try saying:</p>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                    <li>"Create a red circle at 15000, 15000"</li>
                    <li>"Add a blue rectangle with text 'Hello'"</li>
                    <li>"Make a login form with a title, username field, password field, and submit button"</li>
                    <li>"Arrange all shapes in a grid"</li>
                    <li>"What shapes are on the canvas?"</li>
                  </ul>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: message.role === 'user' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'white',
                    color: message.role === 'user' ? 'white' : '#374151',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    boxShadow: message.role === 'user' 
                      ? '0 2px 8px rgba(102, 126, 234, 0.2)'
                      : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'white',
                    color: '#6b7280',
                    fontSize: '14px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#667eea',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#667eea',
                        animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                      }}
                    />
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#667eea',
                        animation: 'pulse 1.5s ease-in-out infinite 0.4s',
                      }}
                    />
                  </div>
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  fontSize: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '16px',
              background: 'white',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                maxLength={500}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  padding: '12px 20px',
                  background: !inputValue.trim() || isLoading
                    ? '#e5e7eb'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim() && !isLoading) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Send
              </button>
            </div>
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'right',
              }}
            >
              {inputValue.length}/500 characters
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

