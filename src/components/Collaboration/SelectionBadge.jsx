import { Group, Rect, Text } from "react-konva";

/**
 * SelectionBadge - Shows user name above a selected shape
 * 
 * CANVAS-SCALE SIZING:
 *   - Font size: 36px (was 11px - 3.3× larger for canvas scale)
 *   - Badge height: 50px (was 18px - proportional increase)
 *   - Character width: 22px (was 7px - accounts for larger font)
 *   - Y offset: -60px (was -12px - positions above larger shapes)
 * 
 * This ensures lock holder names are clearly readable at normal zoom levels
 * on the 30,000×30,000px canvas, matching the larger shape dimensions.
 */
export default function SelectionBadge({ x, y, name, color }) {
  // Calculate badge width based on LARGE font size
  // 22px per character (was 7px) + 20px padding (was 8px)
  const labelWidth = name.length * 22 + 20;
  
  return (
    <Group x={x} y={y - 60} listening={false}>
      {/* Badge background - LARGE for visibility */}
      <Rect
        x={-labelWidth / 2}
        y={-28}
        width={labelWidth}
        height={50}
        fill={color}
        cornerRadius={8}
        opacity={0.95}
      />
      
      {/* User name - LARGE FONT for canvas scale */}
      <Text
        x={-labelWidth / 2 + 10}
        y={-18}
        text={name}
        fontSize={36}
        fill="#fff"
        fontStyle="bold"
      />
    </Group>
  );
}

