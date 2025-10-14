import { Group, Circle, Text, Rect } from "react-konva";
import { useState, useEffect } from "react";

/**
 * Cursor - Renders a remote user's cursor on the canvas with avatar
 */
export default function Cursor({ cursor }) {
  const [avatarImage, setAvatarImage] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Load avatar image if photoURL exists
  useEffect(() => {
    if (!cursor.photoURL || imageError) {
      setAvatarImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setAvatarImage(img);
    img.onerror = () => {
      setImageError(true);
      setAvatarImage(null);
    };
    img.src = cursor.photoURL;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [cursor.photoURL, imageError]);

  // Generate initials fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const labelWidth = cursor.name.length * 7;
  const initials = getInitials(cursor.name);
  const showAvatar = avatarImage && !imageError;
  
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
      
      {/* Avatar (24px at cursor position) */}
      <Group x={8} y={-24}>
        {/* Avatar background circle */}
        {!showAvatar && (
          <Circle
            x={12}
            y={12}
            radius={12}
            fill={cursor.color}
            stroke="#fff"
            strokeWidth={1.5}
          />
        )}
        
        {/* Avatar image or initials */}
        {showAvatar ? (
          <Group>
            <Circle
              x={12}
              y={12}
              radius={12}
              stroke="#fff"
              strokeWidth={1.5}
              fillPatternImage={avatarImage}
              fillPatternScale={{ x: 24 / avatarImage.width, y: 24 / avatarImage.height }}
              fillPatternOffset={{ x: -12, y: -12 }}
            />
          </Group>
        ) : (
          <Text
            x={12}
            y={12}
            text={initials}
            fontSize={10}
            fill="#fff"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            offsetX={initials.length * 3}
            offsetY={5}
          />
        )}
      </Group>
      
      {/* Label background */}
      <Rect
        x={36}
        y={-24}
        width={labelWidth + 8}
        height={20}
        fill={cursor.color}
        cornerRadius={3}
        opacity={0.9}
      />
      
      {/* User name label */}
      <Text
        x={40}
        y={-20}
        text={cursor.name}
        fontSize={12}
        fill="#fff"
        fontStyle="bold"
      />
    </Group>
  );
}

