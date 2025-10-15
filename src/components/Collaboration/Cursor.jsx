import { Group, Circle, Text, Rect, Image as KonvaImage } from "react-konva";
import { useState, useEffect } from "react";

/**
 * Cursor - Renders a remote user's cursor on the canvas with integrated avatar in label
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
    // DON'T set crossOrigin - Google images block it
    // img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('✅ Avatar loaded:', cursor.name);
      setAvatarImage(img);
    };
    
    img.onerror = (err) => {
      console.error('❌ Avatar failed:', cursor.name, err);
      setImageError(true);
      setAvatarImage(null);
    };
    
    img.src = cursor.photoURL;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [cursor.photoURL, imageError, cursor.name]);

  // Generate initials fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(cursor.name);
  const showAvatar = avatarImage && !imageError;
  
  // Calculate label dimensions
  const avatarSize = 16;
  const padding = 6;
  const textWidth = cursor.name.length * 7;
  const labelWidth = avatarSize + padding * 2 + textWidth;
  const labelHeight = 24;
  
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
      
      {/* Integrated label with avatar */}
      <Group x={12} y={-12}>
        {/* Label background */}
        <Rect
          x={0}
          y={0}
          width={labelWidth}
          height={labelHeight}
          fill={cursor.color}
          cornerRadius={12}
          opacity={0.95}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 2 }}
        />
        
        {/* Avatar inside label with circular clip */}
        <Group 
          x={padding} 
          y={(labelHeight - avatarSize) / 2}
          clipFunc={(ctx) => {
            // Create circular clipping path
            ctx.arc(avatarSize / 2, avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, false);
          }}
        >
          {showAvatar ? (
            <>
              {/* Avatar image - will be clipped to circle */}
              <KonvaImage
                x={0}
                y={0}
                image={avatarImage}
                width={avatarSize}
                height={avatarSize}
              />
              {/* White border circle */}
              <Circle
                x={avatarSize / 2}
                y={avatarSize / 2}
                radius={avatarSize / 2}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={1.5}
              />
            </>
          ) : (
            // Initials fallback
            <>
              <Circle
                x={avatarSize / 2}
                y={avatarSize / 2}
                radius={avatarSize / 2}
                fill="rgba(255,255,255,0.25)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={1.5}
              />
              <Text
                x={avatarSize / 2}
                y={avatarSize / 2}
                text={initials}
                fontSize={8}
                fill="#fff"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={initials.length * 2.5}
                offsetY={4}
              />
            </>
          )}
        </Group>
        
        {/* User name text */}
        <Text
          x={avatarSize + padding * 1.5}
          y={labelHeight / 2}
          text={cursor.name}
          fontSize={11}
          fill="#fff"
          fontStyle="500"
          verticalAlign="middle"
          offsetY={5.5}
        />
      </Group>
    </Group>
  );
}