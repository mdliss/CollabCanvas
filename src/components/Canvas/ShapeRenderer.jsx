import { Rect, Circle, Line, Text, Group, Transformer } from "react-konva";
import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

/**
 * ShapeRenderer - renders different shape types with transform support
 */
export default function ShapeRenderer({ 
  shape, 
  isSelected,
  currentUserId,
  onSelect, 
  onRequestLock,
  onDragStart,
  onDragEnd,
  onTransformEnd
}) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);

  // Attach transformer to selected shape
  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const dragBoundFunc = (pos) => {
    const width = shape.width || 50;
    const height = shape.height || 50;
    return {
      x: Math.max(0, Math.min(pos.x, CANVAS_WIDTH - width)),
      y: Math.max(0, Math.min(pos.y, CANVAS_HEIGHT - height))
    };
  };

  const handleDragStart = async (e) => {
    e.cancelBubble = true;
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      e.target.stopDrag();
      console.warn("[Shape] Drag cancelled - shape locked by another user");
      return;
    }
    onDragStart();
  };

  const handleDragEnd = (e) => {
    const node = e.target;
    onDragEnd(shape.id, {
      x: node.x(),
      y: node.y()
    });
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

  const isLockedByOther = shape.isLocked && shape.lockedBy !== currentUserId;
  const strokeColor = isLockedByOther ? "#ff0000" : (isSelected ? "#0066cc" : undefined);
  const strokeWidth = (isLockedByOther || isSelected) ? 2 : 0;

  const commonProps = {
    ref: shapeRef,
    draggable: !isLockedByOther,
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
            text={shape.text || 'Text'}
            fontSize={shape.fontSize || 24}
            fill={shape.fill || '#000000'}
            width={shape.width || 200}
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
            rotation={shape.rotation || 0}
            dragBoundFunc={dragBoundFunc}
          />
        );
    }
  };

  return (
    <>
      {renderShape()}
      {isSelected && !isLockedByOther && (
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

