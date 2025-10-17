import { useState, useEffect, useRef } from 'react';

/**
 * CRITICAL FIX #6: Professional inline text editor for canvas
 * 
 * Replaces crude window.prompt() with a polished, Figma-quality inline text editor
 * that appears directly on the canvas at the text shape's position.
 * 
 * Features:
 * - Inline editing directly on canvas (no modal/popup)
 * - Smooth fade-in/fade-out transitions
 * - Precise positioning matching the text shape
 * - Auto-focus and select all on open
 * - Escape to cancel, Enter to save (with Shift+Enter for new lines)
 * - Professional styling with proper typography
 * - Accessible keyboard navigation
 * 
 * @param {Object} props
 * @param {Object} props.shape - Text shape being edited
 * @param {Object} props.position - Screen position {x, y, width, height} for editor placement
 * @param {Function} props.onSave - Callback with new text value
 * @param {Function} props.onCancel - Callback when editing is cancelled
 * @param {number} props.stageScale - Canvas zoom level for coordinate conversion
 * 
 * @example
 * <InlineTextEditor
 *   shape={textShape}
 *   position={{ x: 100, y: 200, width: 300, height: 100 }}
 *   onSave={(newText) => handleTextUpdate(shape.id, newText)}
 *   onCancel={() => setEditingId(null)}
 *   stageScale={0.5}
 * />
 */
export default function InlineTextEditor({ 
  shape, 
  position, 
  onSave, 
  onCancel,
  stageScale = 1
}) {
  const [text, setText] = useState(shape.text || '');
  const [isVisible, setIsVisible] = useState(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // Smooth fade-in animation on mount
  useEffect(() => {
    // Trigger fade-in after component mounts
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-focus and select all text when editor appears
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }
      
      // Enter to save (Shift+Enter for new line)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text]); // Include text in deps so we capture latest value

  /**
   * Save text changes with smooth fade-out transition
   */
  const handleSave = () => {
    const trimmedText = text.trim();
    if (trimmedText === '') {
      // Don't allow empty text - cancel instead
      handleCancel();
      return;
    }
    
    if (trimmedText !== shape.text) {
      // Fade out before saving
      setIsVisible(false);
      setTimeout(() => {
        onSave(trimmedText);
      }, 150); // Match transition duration
    } else {
      // No changes - just cancel
      handleCancel();
    }
  };

  /**
   * Cancel editing with smooth fade-out transition
   */
  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => {
      onCancel();
    }, 150); // Match transition duration
  };

  /**
   * Handle click outside editor to save changes
   */
  const handleClickOutside = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      handleSave();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [text]);

  // Calculate editor dimensions and position
  const fontSize = (shape.fontSize || 24) * stageScale;
  const minWidth = Math.max(200, (shape.width || 200) * stageScale);
  const minHeight = Math.max(40, fontSize * 1.5);

  const styles = {
    container: {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      minWidth: `${minWidth}px`,
      zIndex: 100000,
      pointerEvents: 'auto',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.95)',
      transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    textarea: {
      width: '100%',
      minHeight: `${minHeight}px`,
      maxHeight: '400px',
      padding: '12px 16px',
      fontSize: `${Math.max(14, fontSize)}px`,
      fontFamily: shape.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: shape.fontWeight || 'normal',
      fontStyle: shape.fontStyle || 'normal',
      textDecoration: shape.textDecoration || 'none',
      color: '#111827',
      backgroundColor: '#ffffff',
      border: '2px solid #4f46e5',
      borderRadius: '8px',
      outline: 'none',
      resize: 'vertical',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(79, 70, 229, 0.2)',
      lineHeight: shape.lineHeight || 1.5,
      textAlign: shape.align || 'left',
    },
    hint: {
      marginTop: '8px',
      padding: '8px 12px',
      fontSize: '12px',
      color: '#6b7280',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      userSelect: 'none'
    },
    hintItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    kbd: {
      padding: '2px 6px',
      backgroundColor: '#f3f4f6',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '11px',
      fontWeight: '600',
      color: '#374151'
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <textarea
        ref={textareaRef}
        style={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text..."
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="sentences"
      />
      <div style={styles.hint}>
        <div style={styles.hintItem}>
          <kbd style={styles.kbd}>Enter</kbd>
          <span>Save</span>
        </div>
        <div style={styles.hintItem}>
          <kbd style={styles.kbd}>Shift</kbd>+<kbd style={styles.kbd}>Enter</kbd>
          <span>New line</span>
        </div>
        <div style={styles.hintItem}>
          <kbd style={styles.kbd}>Esc</kbd>
          <span>Cancel</span>
        </div>
      </div>
    </div>
  );
}

