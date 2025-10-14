import { Rect, Circle, Line, Text } from "react-konva";

/**
 * LiveDragOverlay - Renders a semi-transparent overlay showing
 * a shape being dragged by another user in real-time
 */
export default function LiveDragOverlay({ shape, dragData }) {
  if (!dragData) return null;

  // Semi-transparent overlay with border to indicate live drag
  const overlayProps = {
    x: dragData.x,
    y: dragData.y,
    rotation: dragData.rotation || 0,
    opacity: 0.6,
    stroke: "#FF6B35",
    strokeWidth: 3,
    dash: [10, 5],
    listening: false,
    perfectDrawEnabled: false
  };

  // Render based on shape type
  switch (shape.type) {
    case 'circle':
      return (
        <Circle
          {...overlayProps}
          radius={shape.width / 2 || 50}
          fill="transparent"
        />
      );
    
    case 'line':
      return (
        <Line
          {...overlayProps}
          points={[0, 0, shape.width || 100, shape.height || 0]}
          stroke="#FF6B35"
          strokeWidth={4}
          dash={[10, 5]}
        />
      );
    
    case 'text':
      return (
        <Text
          {...overlayProps}
          text={shape.text || 'Text'}
          fontSize={shape.fontSize || 24}
          fill="transparent"
          width={shape.width || 200}
        />
      );
    
    case 'rectangle':
    default:
      return (
        <Rect
          {...overlayProps}
          width={shape.width}
          height={shape.height}
          fill="transparent"
        />
      );
  }
}

