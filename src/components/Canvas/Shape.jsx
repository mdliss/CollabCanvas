import { Rect } from "react-konva";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

/**
 * Shape component - renders a single rectangle with drag support
 */
export default function Shape({ 
  shape, 
  isSelected,
  currentUserId,
  onSelect, 
  onRequestLock,
  onDragStart,
  onDragEnd 
}) {
  // Drag bound function - clamps position during drag in real-time
  const dragBoundFunc = (pos) => {
    return {
      x: Math.max(0, Math.min(pos.x, CANVAS_WIDTH - shape.width)),
      y: Math.max(0, Math.min(pos.y, CANVAS_HEIGHT - shape.height))
    };
  };

  const handleDragStart = async (e) => {
    e.cancelBubble = true;
    
    // Try to acquire lock before allowing drag
    const lockAcquired = await onRequestLock(shape.id);
    
    if (!lockAcquired) {
      // Lock failed - cancel drag and provide visual feedback
      e.target.stopDrag();
      console.warn("[Shape] Drag cancelled - shape locked by another user");
      return;
    }
    
    onDragStart();
  };

  const handleDragEnd = (e) => {
    const newPos = {
      x: e.target.x(),
      y: e.target.y()
    };
    onDragEnd(shape.id, newPos);
  };

  const handleClick = (e) => {
    e.cancelBubble = true;
    onSelect(shape.id);
  };

  // Determine stroke color based on lock status
  const isLockedByOther = shape.isLocked && shape.lockedBy !== currentUserId;
  const strokeColor = isLockedByOther ? "#ff0000" : (isSelected ? "#0066cc" : undefined);
  const strokeWidth = (isLockedByOther || isSelected) ? 2 : 0;

  return (
    <Rect
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.fill}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      draggable={!isLockedByOther}
      dragBoundFunc={dragBoundFunc}
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      perfectDrawEnabled={false}
      hitStrokeWidth={8}
    />
  );
}

