import { Group, Rect, Text } from "react-konva";

/**
 * SelectionBadge - Shows user name above a selected shape
 */
export default function SelectionBadge({ x, y, name, color }) {
  const labelWidth = name.length * 7 + 8;
  
  return (
    <Group x={x} y={y - 12} listening={false}>
      {/* Badge background */}
      <Rect
        x={-labelWidth / 2}
        y={-10}
        width={labelWidth}
        height={18}
        fill={color}
        cornerRadius={4}
        opacity={0.95}
      />
      
      {/* User name */}
      <Text
        x={-labelWidth / 2 + 4}
        y={-7}
        text={name}
        fontSize={11}
        fill="#fff"
        fontStyle="bold"
      />
    </Group>
  );
}

