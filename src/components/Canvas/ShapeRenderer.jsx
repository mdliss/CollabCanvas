import { Rect, Circle, Line, Text, Group, Transformer, Star } from "react-konva";
import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import { streamDragPosition, stopDragStream } from "../../services/dragStream";
import { updateShape } from "../../services/canvas";

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
  onContextMenu,
  onDragBoundUpdate,
  isBeingDraggedByOther = false
}) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  const dragStreamInterval = useRef(null);
  const transformStreamInterval = useRef(null);
  const firestoreCheckpointInterval = useRef(null);

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
      
      if (firestoreCheckpointInterval.current) {
        clearInterval(firestoreCheckpointInterval.current);
        firestoreCheckpointInterval.current = null;
      }
    };
  }, [isSelected, shape.id]);

  // DISABLED: Drag bounds - removed to allow dragging shapes anywhere without restrictions
  // eslint-disable-next-line no-unused-vars
  const dragBoundFunc = (pos) => {
    // Circles, stars, and triangles use center-based positioning
    if (shape.type === 'circle') {
      // Get the CURRENT radius from the actual Konva node, not from stale props
      // This ensures bounds are correct even after resizing
      const node = shapeRef.current;
      const nodeRadius = node?.radius?.();
      // Validate that we have a valid number for radius (must be positive and not NaN)
      const radius = (typeof nodeRadius === 'number' && !isNaN(nodeRadius) && nodeRadius > 0) 
        ? nodeRadius 
        : (shape.width || 100) / 2;
      
      const minX = radius;
      const maxX = CANVAS_WIDTH - radius;
      const minY = radius;
      const maxY = CANVAS_HEIGHT - radius;
      
      const boundedPos = {
        x: Math.max(minX, Math.min(pos.x, maxX)),
        y: Math.max(minY, Math.min(pos.y, maxY))
      };
      
      // Update debug HUD if callback provided
      if (onDragBoundUpdate) {
        onDragBoundUpdate({
          type: 'circle',
          shapeId: shape.id,
          radius: radius,
          minX: minX,
          maxX: maxX,
          minY: minY,
          maxY: maxY,
          requestedX: pos.x,
          requestedY: pos.y,
          boundedX: boundedPos.x,
          boundedY: boundedPos.y
        });
      }
      
      if (import.meta.env.VITE_DEBUG) {
        console.debug('[Circle dragBoundFunc]', {
          shapeId: shape.id,
          radius: radius,
          bounds: { minX, maxX, minY, maxY },
          requestedPos: pos,
          boundedPos: boundedPos
        });
      }
      
      return boundedPos;
    }
    
    if (shape.type === 'star' || shape.type === 'triangle') {
      // Stars and triangles also use center positioning
      const node = shapeRef.current;
      const nodeWidth = node?.width?.();
      const nodeHeight = node?.height?.();
      // Validate width and height are valid numbers
      const width = (typeof nodeWidth === 'number' && !isNaN(nodeWidth) && nodeWidth > 0) 
        ? nodeWidth 
        : shape.width || 50;
      const height = (typeof nodeHeight === 'number' && !isNaN(nodeHeight) && nodeHeight > 0) 
        ? nodeHeight 
        : shape.height || 50;
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      return {
        x: Math.max(halfWidth, Math.min(pos.x, CANVAS_WIDTH - halfWidth)),
        y: Math.max(halfHeight, Math.min(pos.y, CANVAS_HEIGHT - halfHeight))
      };
    }
    
    // Rectangles, diamonds, text, and lines use top-left positioning
    const node = shapeRef.current;
    const nodeWidth = node?.width?.();
    const nodeHeight = node?.height?.();
    // Validate width and height are valid numbers
    const width = (typeof nodeWidth === 'number' && !isNaN(nodeWidth) && nodeWidth > 0) 
      ? nodeWidth 
      : shape.width || 50;
    const height = (typeof nodeHeight === 'number' && !isNaN(nodeHeight) && nodeHeight > 0) 
      ? nodeHeight 
      : shape.height || 50;
    
    const minX = 0;
    const maxX = CANVAS_WIDTH - width;
    const minY = 0;
    const maxY = CANVAS_HEIGHT - height;
    
    const boundedPos = {
      x: Math.max(minX, Math.min(pos.x, maxX)),
      y: Math.max(minY, Math.min(pos.y, maxY))
    };
    
    // Update debug HUD if callback provided
    if (onDragBoundUpdate) {
      onDragBoundUpdate({
        type: shape.type,
        shapeId: shape.id,
        radius: null,
        width: width,
        height: height,
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY,
        requestedX: pos.x,
        requestedY: pos.y,
        boundedX: boundedPos.x,
        boundedY: boundedPos.y
      });
    }
    
    return boundedPos;
  };

  const handleDragStart = async (e) => {
    e.cancelBubble = true;
    
    const node = e.target;
    
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Shape] dragStart', shape.id, 'type:', shape.type, 'at', node.x(), node.y());
    }
    
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      e.target.stopDrag();
      console.warn("[Shape] Drag cancelled - shape locked by another user");
      return;
    }
    
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
    
    // Periodic Firestore checkpoint - DISABLED due to concurrency issues
    // TODO: Re-enable when shapes are stored as individual documents (not array)
    // firestoreCheckpointInterval.current = setInterval(() => {
    //   const node = shapeRef.current;
    //   if (node && currentUser) {
    //     const checkpointData = {
    //       x: node.x(),
    //       y: node.y(),
    //       rotation: node.rotation()
    //     };
    //     
    //     updateShape('global-canvas-v1', shape.id, checkpointData, currentUser)
    //       .catch(err => {
    //         console.debug('[Shape] Checkpoint save failed (non-critical):', err.message);
    //       });
    //   }
    // }, 500);
  };

  const handleDragEnd = (e) => {
    // Stop streaming
    if (dragStreamInterval.current) {
      clearInterval(dragStreamInterval.current);
      dragStreamInterval.current = null;
    }
    stopDragStream(shape.id);
    
    // Stop Firestore checkpoints
    if (firestoreCheckpointInterval.current) {
      clearInterval(firestoreCheckpointInterval.current);
      firestoreCheckpointInterval.current = null;
    }
    
    const node = e.target;
    const finalPos = {
      x: node.x(),
      y: node.y()
    };
    
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Shape] dragEnd', shape.id, 'type:', shape.type, 'at', finalPos.x, finalPos.y);
    }
    
    onDragEnd(shape.id, finalPos);
  };

  const handleTransformEnd = async () => {
    if (transformStreamInterval.current) {
      clearInterval(transformStreamInterval.current);
      transformStreamInterval.current = null;
    }
    await stopDragStream(shape.id);
    
    // Stop Firestore checkpoints
    if (firestoreCheckpointInterval.current) {
      clearInterval(firestoreCheckpointInterval.current);
      firestoreCheckpointInterval.current = null;
    }
    
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
    
    // Periodic Firestore checkpoint - DISABLED due to concurrency issues
    // TODO: Re-enable when shapes are stored as individual documents (not array)
    // firestoreCheckpointInterval.current = setInterval(() => {
    //   const node = shapeRef.current;
    //   if (node && currentUser) {
    //     const scaleX = node.scaleX();
    //     const scaleY = node.scaleY();
    //     const checkpointData = {
    //       x: node.x(),
    //       y: node.y(),
    //       width: Math.max(10, node.width() * scaleX),
    //       height: Math.max(10, node.height() * scaleY),
    //       rotation: node.rotation()
    //     };
    //     
    //     updateShape('global-canvas-v1', shape.id, checkpointData, currentUser)
    //       .catch(err => {
    //         console.debug('[Shape] Transform checkpoint save failed (non-critical):', err.message);
    //       });
    //   }
    // }, 500);
    
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
    onContextMenu: (e) => {
      if (onContextMenu) {
        onContextMenu(e, shape.id);
      }
    },
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

