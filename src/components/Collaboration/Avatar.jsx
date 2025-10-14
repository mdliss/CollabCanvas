import { useState } from 'react';

/**
 * Avatar - Reusable avatar component with fallback to initials
 * @param {string} src - Photo URL (optional)
 * @param {string} name - Display name for fallback initials
 * @param {string} color - Background color for initials fallback
 * @param {string} size - Size variant: 'sm' (24px), 'md' (36px), 'lg' (48px)
 * @param {object} style - Additional inline styles
 */
export default function Avatar({ src, name = 'User', color = '#4285f4', size = 'md', style = {} }) {
  const [imageError, setImageError] = useState(false);

  // Size mappings
  const sizeMap = {
    sm: { width: 24, height: 24, fontSize: 10, borderWidth: 1.5 },
    md: { width: 36, height: 36, fontSize: 14, borderWidth: 2 },
    lg: { width: 48, height: 48, fontSize: 18, borderWidth: 2.5 }
  };

  const dimensions = sizeMap[size] || sizeMap.md;

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const showImage = src && !imageError;

  return (
    <div
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        borderRadius: '50%',
        background: showImage ? 'transparent' : color,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${dimensions.fontSize}px`,
        fontWeight: '600',
        overflow: 'hidden',
        border: `${dimensions.borderWidth}px solid #e0e0e0`,
        flexShrink: 0,
        ...style
      }}
      title={name}
    >
      {showImage ? (
        <img 
          src={src} 
          alt={name}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

