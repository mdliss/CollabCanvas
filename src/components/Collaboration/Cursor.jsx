import { Group, Circle, Text, Rect } from "react-konva";

/**
 * Cursor - Renders a remote user's cursor on the canvas
 */
export default function Cursor({ cursor }) {
  const labelWidth = cursor.name.length * 7;
  
  return (
    <Group x={cursor.x} y={cursor.y} listening={false}>
      {/* Cursor dot */}
      <Circle
        x={0}
        y={0}
        radius={6}
        fill={cursor.color}
        stroke="#fff"
        strokeWidth={2}
      />
      
      {/* Label background */}
      <Rect
        x={12}
        y={-10}
        width={labelWidth + 8}
        height={20}
        fill={cursor.color}
        cornerRadius={3}
        opacity={0.9}
      />
      
      {/* User name label */}
      <Text
        x={16}
        y={-6}
        text={cursor.name}
        fontSize={12}
        fill="#fff"
        fontStyle="bold"
      />
    </Group>
  );
}

