import { Rect, Circle, Line, Text, Group, Transformer } from "react-konva";
import { useEffect, useRef, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import { streamDragPosition, stopDragStream } from "../../services/dragStream";

/**
 * ShapeRenderer - renders different shape types with transform support
 */
export default function ShapeRenderer({ 
  shape, 
  isSelected,
  currentUserId,
  currentUserName,
  onSelect, 
  onRequestLock,
  onDragStart,
  onDragEnd,
  onTransformEnd
}) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(shape.text || '');
  const dragStreamInterval = useRef(null);

  // Attach transformer to selected shape
  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Drag bounds for all shape types (canvas-space coordinates)
  const dragBoundFunc = (pos) => {
    let width = shape.width || 50;
    let height = shape.height || 50;
    
    // Adjust bounds based on shape type
    if (shape.type === 'circle') {
      const radius = width / 2;
      return {
        x: Math.max(radius, Math.min(pos.x, CANVAS_WIDTH - radius)),
        y: Math.max(radius, Math.min(pos.y, CANVAS_HEIGHT - radius))
      };
    }
    
    // For rectangles, text, and lines - use width/height
    return {
      x: Math.max(0, Math.min(pos.x, CANVAS_WIDTH - width)),
      y: Math.max(0, Math.min(pos.y, CANVAS_HEIGHT - height))
    };
  };

  const handleDragStart = async (e) => {
    e.cancelBubble = true;
    
    if (import.meta.env.VITE_DEBUG) {
      const node = e.target;
      console.debug('[Shape] dragStart', shape.id, 'at', node.x(), node.y());
    }
    
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      e.target.stopDrag();
      console.warn("[Shape] Drag cancelled - shape locked by another user");
      return;
    }
    
    onDragStart();
    
    // Start streaming drag position at ~60Hz (16ms)
    dragStreamInterval.current = setInterval(() => {
      const node = shapeRef.current;
      if (node && currentUserId) {
        streamDragPosition(
          shape.id,
          currentUserId,
          currentUserName || 'User',
          node.x(),
          node.y(),
          node.rotation()
        );
      }
    }, 16);
  };

  const handleDragEnd = (e) => {
    // Stop streaming
    if (dragStreamInterval.current) {
      clearInterval(dragStreamInterval.current);
      dragStreamInterval.current = null;
    }
    stopDragStream(shape.id);
    
    const node = e.target;
    const finalPos = {
      x: node.x(),
      y: node.y()
    };
    
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Shape] dragEnd', shape.id, 'at', finalPos.x, finalPos.y);
    }
    
    onDragEnd(shape.id, finalPos);
  };

  const handleTransformEnd = async (e) => {
    const node = shapeRef.current;
    if (!node) return;

    // Get transform values
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    const newAttrs = {
      x: node.x(),
      y: node.y(),
      width: Math.max(10, node.width() * scaleX),
      height: Math.max(10, node.height() * scaleY),
      rotation: node.rotation()
    };

    onTransformEnd(shape.id, newAttrs);
  };

  const handleTransformStart = async () => {
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      console.warn("[Shape] Transform cancelled - shape locked by another user");
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return false;
    }
    return true;
  };

  const handleClick = (e) => {
    e.cancelBubble = true;
    const isShiftKey = e.evt?.shiftKey || false;
    onSelect(shape.id, isShiftKey);
  };

  const handleDoubleClick = async (e) => {
    if (shape.type !== 'text') return;
    
    e.cancelBubble = true;
    
    // Try to acquire lock for editing
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      console.warn("[ShapeRenderer] Cannot edit text - locked by another user");
      return;
    }
    
    setIsEditing(true);
    setEditText(shape.text || '');
  };

  const handleTextChange = (e) => {
    setEditText(e.target.value);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    if (editText !== shape.text) {
      onTransformEnd(shape.id, { text: editText });
    }
  };

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(shape.text || '');
    }
  };

  const isLockedByOther = shape.isLocked && shape.lockedBy !== currentUserId;
  const strokeColor = isLockedByOther ? "#ff0000" : (isSelected ? "#0066cc" : undefined);
  const strokeWidth = (isLockedByOther || isSelected) ? 2 : 0;

  const commonProps = {
    ref: shapeRef,
    draggable: !isLockedByOther,
    dragBoundFunc: dragBoundFunc,
    onClick: handleClick,
    onTap: handleClick,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onTransformStart: handleTransformStart,
    perfectDrawEnabled: false,
    hitStrokeWidth: 8,
    stroke: strokeColor,
    strokeWidth: strokeWidth
  };

  const renderShape = () => {
    switch (shape.type) {
      case 'circle':
        return (
          <Circle
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radius={shape.width / 2 || 50}
            fill={shape.fill}
            rotation={shape.rotation || 0}
          />
        );
      
      case 'line':
        return (
          <Line
            {...commonProps}
            x={shape.x}
            y={shape.y}
            points={[0, 0, shape.width || 100, shape.height || 0]}
            stroke={shape.fill || '#cccccc'}
            strokeWidth={4}
            rotation={shape.rotation || 0}
            lineCap="round"
            lineJoin="round"
          />
        );
      
      case 'text':
        return (
          <Text
            {...commonProps}
            x={shape.x}
            y={shape.y}
            text={isEditing ? editText : (shape.text || 'Text')}
            fontSize={shape.fontSize || 24}
            fill={shape.fill || '#000000'}
            width={shape.width || 200}
            rotation={shape.rotation || 0}
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
          />
        );
      
      case 'rectangle':
      default:
        return (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            rotation={shape.rotation || 0}
          />
        );
    }
  };

  return (
    <>
      {renderShape()}
      {isSelected && !isLockedByOther && !isEditing && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
      {isEditing && shape.type === 'text' && (
        <div
          style={{
            position: 'absolute',
            top: shape.y + 'px',
            left: shape.x + 'px',
            zIndex: 10000,
          }}
        >
          <textarea
            value={editText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            autoFocus
            style={{
              width: shape.width + 'px',
              minHeight: '50px',
              fontSize: (shape.fontSize || 24) + 'px',
              fontFamily: 'Arial, sans-serif',
              color: shape.fill || '#000000',
              border: '2px solid #0066cc',
              borderRadius: '4px',
              padding: '4px',
              background: 'white',
              resize: 'none',
              overflow: 'hidden'
            }}
          />
        </div>
      )}
    </>
  );
}

