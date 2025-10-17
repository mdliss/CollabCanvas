import { Rect, Circle, Line, Text, Group, Transformer, Star } from "react-konva";
import { useEffect, useRef } from "react";
import { streamDragPosition, stopDragStream } from "../../services/dragStream";
import { updateShape } from "../../services/canvasRTDB";

const CANVAS_ID = "global-canvas-v1";

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
  const isDraggingRef = useRef(false);
  const dragEndTimeoutRef = useRef(null);
  const checkpointIntervalRef = useRef(null);
  
  // CRITICAL FIX: Dedicated flag for transform operations
  // This prevents prop updates from interfering with active transforms
  const transformInProgressRef = useRef(false);

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

  // CRITICAL FIX: Complete prop synchronization with transform isolation
  // This effect synchronizes ALL shape properties from RTDB to Konva nodes
  // but BLOCKS updates during active LOCAL transforms to prevent interference
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;
    
    // PRIORITY 1: Block ALL prop updates during active transform
    // This is THE most critical fix - prevents checkpoint interference
    if (transformInProgressRef.current) {
      console.log('[PropSync] ⛔ BLOCKED - Transform in progress');
      return;
    }
    
    // PRIORITY 2: Block updates when being dragged by another user
    // Prevents flickering from RTDB position updates during remote drags
    if (isBeingDraggedByOther) {
      console.log('[PropSync] ⛔ BLOCKED - Being dragged by other user');
      return;
    }
    
    // PRIORITY 3: Block updates during local drag (position only)
    if (isDraggingRef.current) {
      console.log('[PropSync] ⛔ BLOCKED - Local drag in progress');
      return;
    }
    
    // Safe to apply prop updates - synchronize ALL properties
    console.log('[PropSync] ✅ Syncing props to node:', {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation
    });
    
    // Apply position
    node.x(shape.x);
    node.y(shape.y);
    node.rotation(shape.rotation || 0);
    
    // Apply dimensions based on shape type
    if (shape.type === 'circle') {
      const radius = (shape.width || 100) / 2;
      node.radius(radius);
    } else if (shape.type === 'star') {
      const size = shape.width || 80;
      node.innerRadius(size * 0.25);
      node.outerRadius(size * 0.5);
    } else if (shape.type !== 'line') {
      // For rect, text, diamond, triangle
      node.width(shape.width || 100);
      node.height(shape.height || 100);
    }
    
    // CRITICAL: Ensure scale is always 1.0
    // This prevents compound scaling from previous transforms
    node.scaleX(1);
    node.scaleY(1);
    
    // Request re-render
    node.getLayer()?.batchDraw();
    
  }, [
    shape.x, 
    shape.y, 
    shape.width,      // CRITICAL: Added to dependencies
    shape.height,     // CRITICAL: Added to dependencies
    shape.rotation,
    shape.id,
    shape.type,
    isBeingDraggedByOther
  ]);

  // Clean up all intervals and timeouts when shape is deselected or unmounted
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
      
      if (checkpointIntervalRef.current) {
        clearInterval(checkpointIntervalRef.current);
        checkpointIntervalRef.current = null;
      }
      
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
        dragEndTimeoutRef.current = null;
      }
    };
  }, [isSelected, shape.id]);

  // No drag bounds - infinite canvas allows shapes to be placed anywhere
  const dragBoundFunc = (pos) => {
    return pos;
  };

  const handleDragStart = async (e) => {
    e.cancelBubble = true;
    
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      e.target.stopDrag();
      console.warn("[ShapeRenderer] Drag cancelled - shape locked by another user");
      return;
    }
    
    isDraggingRef.current = true;
    onDragStart(shape.id);
    
    // Start streaming drag position at ~100Hz (10ms)
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
    
    // Start checkpoint system - POSITION ONLY during drag
    checkpointIntervalRef.current = setInterval(() => {
      const node = shapeRef.current;
      if (node && currentUser) {
        const checkpointData = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation()
          // NOTE: No width/height during drag - only position!
        };
        updateShape(CANVAS_ID, shape.id, checkpointData, currentUser).catch(err => {
          console.warn('[Checkpoint] Failed to save position:', err.message);
        });
      }
    }, 500);
  };

  const handleDragEnd = (e) => {
    // Stop streaming
    if (dragStreamInterval.current) {
      clearInterval(dragStreamInterval.current);
      dragStreamInterval.current = null;
    }
    stopDragStream(shape.id);
    
    // Stop checkpoint interval
    if (checkpointIntervalRef.current) {
      clearInterval(checkpointIntervalRef.current);
      checkpointIntervalRef.current = null;
    }
    
    const node = e.target;
    const finalPos = {
      x: node.x(),
      y: node.y()
    };
    
    // Write final position to RTDB
    onDragEnd(shape.id, finalPos);
    
    // Delay flag reset to prevent position flash
    dragEndTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
      dragEndTimeoutRef.current = null;
    }, 100);
  };

  // CRITICAL FIX: Completely rewritten transform end handler
  const handleTransformEnd = async () => {
    console.log('🎯 [Transform] Transform ending for shape:', shape.id);
    
    // Stop streaming
    if (transformStreamInterval.current) {
      clearInterval(transformStreamInterval.current);
      transformStreamInterval.current = null;
    }
    await stopDragStream(shape.id);
    
    // CRITICAL FIX: Stop checkpoint interval
    // This prevents any more dimension writes during finalization
    if (checkpointIntervalRef.current) {
      console.log('✅ [Transform] Stopping checkpoint interval');
      clearInterval(checkpointIntervalRef.current);
      checkpointIntervalRef.current = null;
    }
    
    const node = shapeRef.current;
    if (!node) {
      console.error('❌ [Transform] No node reference');
      transformInProgressRef.current = false;
      return;
    }

    let newAttrs;
    
    try {
      // Handle circles specially - they use radius, not width/height
      if (shape.type === 'circle') {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const avgScale = (scaleX + scaleY) / 2;
        
        const baseRadius = (shape.width || 100) / 2;
        const newRadius = baseRadius * avgScale;
        const newDiameter = newRadius * 2;
        
        if (!isFinite(newRadius) || newRadius <= 0 || !isFinite(newDiameter) || newDiameter <= 0) {
          console.error('[Circle] Invalid radius calculated:', {
            baseRadius, avgScale, newRadius, newDiameter
          });
          transformInProgressRef.current = false;
          return;
        }
        
        console.log('[Circle] Transform complete:', {
          baseRadius,
          scale: avgScale,
          newRadius,
          newDiameter
        });
        
        // CRITICAL: Reset scale BEFORE applying new radius
        node.scaleX(1);
        node.scaleY(1);
        node.radius(newRadius);
        
        newAttrs = {
          x: node.x(),
          y: node.y(),
          width: newDiameter,
          height: newDiameter,
          rotation: node.rotation()
        };
      } else {
        // For rectangles, text, lines, triangles, stars, etc.
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        console.log('[Transform] Calculating dimensions:', {
          type: shape.type,
          baseWidth: node.width(),
          baseHeight: node.height(),
          scaleX,
          scaleY
        });
        
        // Calculate new dimensions from scale factors
        const newWidth = Math.max(10, node.width() * scaleX);
        const newHeight = Math.max(10, node.height() * scaleY);
        
        console.log('[Transform] New dimensions:', {
          newWidth,
          newHeight
        });
        
        // CRITICAL: Reset scale BEFORE applying new dimensions
        // This prevents compound scaling on next transform
        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        node.height(newHeight);

        newAttrs = {
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
          rotation: node.rotation()
        };
      }

      console.log('✅ [Transform] Final attributes:', newAttrs);
      
      // Write to RTDB and AWAIT completion
      await onTransformEnd(shape.id, newAttrs);
      
      console.log('✅ [Transform] Database write complete');
      
    } catch (error) {
      console.error('❌ [Transform] Error during transform end:', error);
    } finally {
      // CRITICAL: Delay clearing the transform flag
      // This ensures the RTDB write has time to propagate before
      // we allow prop sync to resume
      setTimeout(() => {
        transformInProgressRef.current = false;
        console.log('✅ [Transform] Transform flag cleared');
      }, 150);
    }
  };

  // CRITICAL FIX: Enhanced transform start handler
  const handleTransformStart = async () => {
    console.log('🎯 [Transform] Transform starting for shape:', shape.id);
    
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      console.warn("[Transform] Cancelled - shape locked by another user");
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return false;
    }
    
    // CRITICAL: Set transform flag IMMEDIATELY
    // This blocks all prop updates during the transform
    transformInProgressRef.current = true;
    console.log('✅ [Transform] Transform flag set - prop sync BLOCKED');
    
    // Notify parent
    if (onTransformStart) {
      onTransformStart(shape.id);
    }
    
    // Start streaming transform updates at ~100Hz
    transformStreamInterval.current = setInterval(() => {
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
    
    // CRITICAL FIX: NO checkpoint interval during transform
    // The checkpoint system was writing dimensions to RTDB every 500ms,
    // which caused prop updates that interfered with the active transform
    console.log('✅ [Transform] Transform started - checkpoints DISABLED');
    
    return true;
  };

  const handleClick = (e) => {
    e.cancelBubble = true;
    const isShiftKey = e.evt?.shiftKey || false;
    onSelect(shape.id, isShiftKey);
  };

  const isLockedByOther = shape.isLocked && shape.lockedBy !== currentUserId;
  
  const strokeColor = isBeingDraggedByOther 
    ? "#ff6600"
    : isLockedByOther 
      ? "#ff0000"
      : (isSelected ? "#0066cc" : undefined);
  
  const strokeWidth = (isBeingDraggedByOther || isLockedByOther || isSelected) ? 3 : 0;
  
  const baseOpacity = shape.opacity !== undefined ? shape.opacity : 1.0;
  const shapeOpacity = isBeingDraggedByOther ? 0.6 : baseOpacity;

  const commonProps = {
    ref: shapeRef,
    draggable: !isLockedByOther && !isBeingDraggedByOther,
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
    opacity: shapeOpacity
  };

  const renderShape = () => {
    switch (shape.type) {
      case 'circle':
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