import { Rect, Circle, Line, Text, Group, Transformer, Star } from "react-konva";
import { useEffect, useRef } from "react";
import { streamDragPosition, stopDragStream } from "../../services/dragStream";

/**
 * ShapeRenderer - renders different shape types with transform support
 */
export default function ShapeRenderer({ 
  shape, 
  isSelected,
  currentUserId,
  currentUserName,
  currentUser,
  onSelect, 
  onRequestLock,
  onDragStart,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onTextUpdate,
  isBeingDraggedByOther = false
}) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  const dragStreamInterval = useRef(null);
  const transformStreamInterval = useRef(null);
  const isDraggingRef = useRef(false); // Track if THIS user is currently dragging this shape

  // Don't render hidden shapes
  if (shape.hidden) {
    return null;
  }

  // Attach transformer to selected shape
  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Synchronize position from props ONLY when not dragging
  // This prevents RTDB updates from interfering with active drags
  // CRITICAL FIX: Also block when being dragged by another user to prevent flickering
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;
    
    const currentPos = { x: node.x(), y: node.y() };
    const newPos = { x: shape.x, y: shape.y };
    const deltaX = Math.abs(currentPos.x - newPos.x);
    const deltaY = Math.abs(currentPos.y - newPos.y);
    const posChanged = deltaX > 0.01 || deltaY > 0.01; // Account for floating point precision
    
    // Block updates when THIS user is dragging
    if (isDraggingRef.current) {
      return;
    }
    
    // CRITICAL FIX: Block updates when ANOTHER user is dragging
    // This prevents flickering because position flows naturally through props
    // React-konva automatically syncs x/y props to the Konva node
    // Manual position updates here would conflict with that, causing stuttering
    if (isBeingDraggedByOther) {
      return;
    }
    
    // Sync position from props to Konva node for all other cases
    // (e.g., undo/redo, programmatic moves, drag end sync)
    if (posChanged) {
      node.position(newPos);
      node.getLayer()?.batchDraw();
    }
  }, [shape.x, shape.y, shape.id, isBeingDraggedByOther]);

  // Clean up drag/transform streams when shape is deselected or unmounted
  useEffect(() => {
    return () => {
      if (dragStreamInterval.current) {
        clearInterval(dragStreamInterval.current);
        dragStreamInterval.current = null;
        stopDragStream(shape.id);
      }
      
      if (transformStreamInterval.current) {
        clearInterval(transformStreamInterval.current);
        transformStreamInterval.current = null;
        stopDragStream(shape.id);
      }
    };
  }, [isSelected, shape.id]);

  // No drag bounds - infinite canvas allows shapes to be placed anywhere
  const dragBoundFunc = (pos) => {
    return pos; // No clamping
  };

  const handleDragStart = async (e) => {
    e.cancelBubble = true;
    
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      e.target.stopDrag();
      console.warn("[ShapeRenderer] Drag cancelled - shape locked by another user");
      return;
    }
    
    // Mark as dragging to prevent position updates from props
    isDraggingRef.current = true;
    onDragStart(shape.id);
    
    // Start streaming drag position at ~100Hz (10ms) for smoother updates
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
    }, 10);
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
    
    // Call parent first (this writes to RTDB)
    onDragEnd(shape.id, finalPos);
    
    // Clear isDragging flag immediately
    isDraggingRef.current = false;
  };

  const handleTransformEnd = async () => {
    if (transformStreamInterval.current) {
      clearInterval(transformStreamInterval.current);
      transformStreamInterval.current = null;
    }
    await stopDragStream(shape.id);
    
    const node = shapeRef.current;
    if (!node) return;

    let newAttrs;
    
    // Handle circles specially - they use radius, not width/height
    if (shape.type === 'circle') {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const avgScale = (scaleX + scaleY) / 2; // Uniform scaling for circles
      
      // IMPORTANT: Use the shape's base radius (from stored width), not the node's current radius
      // The node's radius might already be scaled by the transformer, causing exponential growth
      const baseRadius = (shape.width || 100) / 2;
      const newRadius = baseRadius * avgScale;
      const newDiameter = newRadius * 2;
      
      // Validate that we got valid numbers
      if (!isFinite(newRadius) || newRadius <= 0 || !isFinite(newDiameter) || newDiameter <= 0) {
        console.error('[Circle handleTransformEnd] Invalid radius/diameter calculated:', {
          baseRadius, avgScale, newRadius, newDiameter, shapeWidth: shape.width
        });
        // Fall back to current shape dimensions - don't save invalid transform
        return;
      }
      
      console.log('[Circle handleTransformEnd]', {
        shapeId: shape.id,
        baseRadius: baseRadius,
        scale: avgScale,
        newRadius: newRadius,
        newDiameter: newDiameter
      });
      
      // Reset scale and apply to radius
      node.scaleX(1);
      node.scaleY(1);
      node.radius(newRadius);
      
      // No bounds checking - allow shapes anywhere!
      newAttrs = {
        x: node.x(),
        y: node.y(),
        width: newDiameter,   // Store as diameter in Firestore
        height: newDiameter,  // Keep square for circles
        rotation: node.rotation()
      };
    } else {
      // For rectangles, text, lines, etc.
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      const newWidth = Math.max(10, node.width() * scaleX);
      const newHeight = Math.max(10, node.height() * scaleY);
      
      // Reset scale and apply to width/height
      node.scaleX(1);
      node.scaleY(1);
      node.width(newWidth);
      node.height(newHeight);

      // No bounds checking - allow shapes anywhere!
      newAttrs = {
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation()
      };
    }

    onTransformEnd(shape.id, newAttrs);
    
    // Clear isDragging flag immediately after transform completes
    isDraggingRef.current = false;
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
    
    // Mark as dragging to prevent position updates during transform
    isDraggingRef.current = true;
    
    // Notify parent (for performance tracking and undo state capture)
    if (onTransformStart) {
      onTransformStart(shape.id);
    }
    
    // Start streaming transform updates (rotation, scale, position) at ~100Hz (10ms)
    transformStreamInterval.current = setInterval(() => {
      const node = shapeRef.current;
      if (node && currentUserId) {
        streamDragPosition(
          shape.id,
          currentUserId,
          currentUserName || 'User',
          node.x(),
          node.y(),
          node.rotation()  // Stream live rotation during transform
        );
      }
    }, 10);
    
    return true;
  };

  const handleClick = (e) => {
    e.cancelBubble = true;
    const isShiftKey = e.evt?.shiftKey || false;
    onSelect(shape.id, isShiftKey);
  };

  const isLockedByOther = shape.isLocked && shape.lockedBy !== currentUserId;
  
  // Visual styling: orange stroke for shapes being dragged by others
  const strokeColor = isBeingDraggedByOther 
    ? "#ff6600"  // Orange stroke when being dragged by another user
    : isLockedByOther 
      ? "#ff0000"  // Red when locked
      : (isSelected ? "#0066cc" : undefined);  // Blue when selected by you
  
  const strokeWidth = (isBeingDraggedByOther || isLockedByOther || isSelected) ? 3 : 0;
  
  // Calculate opacity: use shape's opacity if set, otherwise 1.0
  // Reduce to 0.6 if being dragged by another user
  const baseOpacity = shape.opacity !== undefined ? shape.opacity : 1.0;
  const shapeOpacity = isBeingDraggedByOther ? 0.6 : baseOpacity;

  const commonProps = {
    ref: shapeRef,
    draggable: !isLockedByOther && !isBeingDraggedByOther,  // Can't drag if someone else is dragging
    // REMOVED: dragBoundFunc - no bounds checking, drag anywhere!
    onClick: handleClick,
    onTap: handleClick,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onTransformStart: handleTransformStart,
    perfectDrawEnabled: false,
    hitStrokeWidth: 8,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    opacity: shapeOpacity  // Combines shape's opacity with drag state
  };

  const renderShape = () => {
    switch (shape.type) {
      case 'circle':
        // Ensure we have a valid width for calculating radius
        const circleRadius = (typeof shape.width === 'number' && shape.width > 0) 
          ? shape.width / 2 
          : 50;
        
        return (
          <Circle
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radius={circleRadius}
            fill={shape.fill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
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
        // Check if text has a gradient - don't apply default fill if it does
        const hasGradient = shape.fillLinearGradientColorStops && 
                           shape.fillLinearGradientColorStops.length > 0;
        const textFill = hasGradient ? shape.fill : (shape.fill || '#000000');
        
        return (
          <Text
            {...commonProps}
            x={shape.x}
            y={shape.y}
            text={shape.text || 'Text'}
            fontSize={shape.fontSize || 24}
            fontFamily={shape.fontFamily || 'Inter'}
            fontStyle={shape.fontStyle || 'normal'}
            fontWeight={shape.fontWeight || 'normal'}
            textDecoration={shape.textDecoration || ''}
            align={shape.align || 'left'}
            lineHeight={shape.lineHeight || 1.2}
            fill={textFill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            width={shape.width || 200}
            rotation={shape.rotation || 0}
            onDblClick={async (e) => {
              e.cancelBubble = true;
              
              // Check authentication
              if (!currentUser) {
                console.error('[Text Edit] No authenticated user');
                alert('Please sign in to edit text');
                return;
              }
              
              const newText = window.prompt('Edit text:', shape.text || 'Text');
              if (newText !== null && newText.trim() !== '' && newText !== shape.text) {
                try {
                  await onTextUpdate(shape.id, newText);
                } catch (error) {
                  console.error('[Text Edit] Update failed:', error);
                  alert('Failed to update text: ' + (error.message || 'Unknown error'));
                }
              }
            }}
          />
        );
      
      case 'diamond':
        return (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width || 100}
            height={shape.height || 100}
            fill={shape.fill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            rotation={(shape.rotation || 0) + 45}
            offsetX={(shape.width || 100) / 2}
            offsetY={(shape.height || 100) / 2}
          />
        );
      
      case 'triangle': {
        const triWidth = shape.width || 100;
        const triHeight = shape.height || 100;
        return (
          <Line
            {...commonProps}
            x={shape.x}
            y={shape.y}
            points={[
              triWidth / 2, 0,
              triWidth, triHeight,
              0, triHeight,
              triWidth / 2, 0
            ]}
            fill={shape.fill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            closed={true}
            rotation={shape.rotation || 0}
          />
        );
      }
      
      case 'star':
        return (
          <Star
            {...commonProps}
            x={shape.x}
            y={shape.y}
            numPoints={5}
            innerRadius={(shape.width || 80) * 0.25}
            outerRadius={(shape.width || 80) * 0.5}
            fill={shape.fill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            rotation={shape.rotation || 0}
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
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            rotation={shape.rotation || 0}
          />
        );
    }
  };

  return (
    <>
      {renderShape()}
      {isSelected && !isLockedByOther && !isBeingDraggedByOther && (
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
    </>
  );
}

