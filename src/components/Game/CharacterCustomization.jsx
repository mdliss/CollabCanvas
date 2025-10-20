/**
 * Character Customization Modal
 * 
 * Allows players to select their hat/accessory before entering the Battle Arena.
 * Matches the app's modern theme styling with smooth animations.
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const HAIR_STYLES = [
  { id: 'none', name: 'Bald' },
  { id: 'spiky', name: 'Spiky Hair' },
  { id: 'afro', name: 'Afro' },
  { id: 'long', name: 'Long Hair' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'curly', name: 'Curly Hair' },
  { id: 'buzz', name: 'Buzz Cut' },
  { id: 'mohawk', name: 'Mohawk' },
  { id: 'wavy', name: 'Wavy Hair' }
];

// Simple SVG preview of each hair style
const HairPreview = ({ style, color }) => {
  const size = 50;
  const headRadius = 8;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const renderHair = () => {
    switch (style) {
      case 'none':
        return null;
      
      case 'spiky':
        return (
          <g>
            <line x1={centerX - 6} y1={centerY - headRadius} x2={centerX - 6} y2={centerY - headRadius - 8} stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1={centerX} y1={centerY - headRadius} x2={centerX} y2={centerY - headRadius - 10} stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1={centerX + 6} y1={centerY - headRadius} x2={centerX + 6} y2={centerY - headRadius - 8} stroke={color} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      
      case 'afro':
        return <circle cx={centerX} cy={centerY - 1} r={headRadius * 1.8} stroke={color} strokeWidth="2" fill="none" />;
      
      case 'long':
        return (
          <g>
            <line x1={centerX - headRadius} y1={centerY} x2={centerX - headRadius - 2} y2={centerY + 12} stroke={color} strokeWidth="2" />
            <line x1={centerX + headRadius} y1={centerY} x2={centerX + headRadius + 2} y2={centerY + 12} stroke={color} strokeWidth="2" />
          </g>
        );
      
      case 'ponytail':
        return <line x1={centerX + headRadius} y1={centerY} x2={centerX + headRadius + 8} y2={centerY + 4} stroke={color} strokeWidth="2" strokeLinecap="round" />;
      
      case 'curly':
        return (
          <g>
            <circle cx={centerX - 5} cy={centerY - headRadius - 1} r="2" stroke={color} strokeWidth="1.5" fill="none" />
            <circle cx={centerX} cy={centerY - headRadius - 2} r="2" stroke={color} strokeWidth="1.5" fill="none" />
            <circle cx={centerX + 5} cy={centerY - headRadius - 1} r="2" stroke={color} strokeWidth="1.5" fill="none" />
          </g>
        );
      
      case 'buzz':
        return <line x1={centerX - headRadius} y1={centerY - headRadius} x2={centerX + headRadius} y2={centerY - headRadius} stroke={color} strokeWidth="3" strokeLinecap="round" />;
      
      case 'mohawk':
        return <line x1={centerX} y1={centerY - headRadius} x2={centerX} y2={centerY - headRadius - 12} stroke={color} strokeWidth="3" strokeLinecap="round" />;
      
      case 'wavy':
        return (
          <g>
            <path d={`M ${centerX - 6} ${centerY - headRadius} Q ${centerX - 4} ${centerY - headRadius - 5} ${centerX - 6} ${centerY - headRadius - 8}`} stroke={color} strokeWidth="1.5" fill="none" />
            <path d={`M ${centerX + 6} ${centerY - headRadius} Q ${centerX + 4} ${centerY - headRadius - 5} ${centerX + 6} ${centerY - headRadius - 8}`} stroke={color} strokeWidth="1.5" fill="none" />
          </g>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {renderHair()}
      <circle cx={centerX} cy={centerY} r={headRadius} stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
};

export default function CharacterCustomization({ isOpen, onSelect, selectedHat = 'none' }) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [hoveredStyle, setHoveredStyle] = useState(null);
  
  // Animation trigger
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 50);
    } else {
      setVisible(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const handleSelect = (styleId) => {
    setVisible(false);
    setTimeout(() => onSelect(styleId), 300);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20000,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        background: theme.background.card,
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '600px',
        width: '90%',
        boxShadow: theme.shadow.xl,
        border: `1px solid ${theme.border.normal}`,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Title */}
        <div style={{
          fontSize: '24px',
          fontWeight: '700',
          color: theme.text.primary,
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Choose Your Style
        </div>
        
        <div style={{
          fontSize: '14px',
          color: theme.text.secondary,
          marginBottom: '28px',
          textAlign: 'center'
        }}>
          Select a hair style to customize your character
        </div>
        
        {/* Hair Style Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {HAIR_STYLES.map(style => {
            const isSelected = selectedHat === style.id;
            const isHovered = hoveredStyle === style.id;
            
            return (
              <button
                key={style.id}
                onClick={() => handleSelect(style.id)}
                onMouseEnter={() => setHoveredStyle(style.id)}
                onMouseLeave={() => setHoveredStyle(null)}
                style={{
                  background: isSelected 
                    ? theme.gradient.button 
                    : isHovered 
                      ? theme.background.elevated 
                      : theme.background.card,
                  border: `2px solid ${isSelected ? theme.button.primary : theme.border.normal}`,
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)',
                  boxShadow: isHovered ? theme.shadow.lg : theme.shadow.sm,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <HairPreview 
                  style={style.id} 
                  color={isSelected ? theme.text.inverse : theme.text.primary}
                />
                <div style={{
                  fontSize: '12px',
                  fontWeight: isSelected ? '600' : '500',
                  color: isSelected ? theme.text.inverse : theme.text.primary,
                  marginTop: '4px'
                }}>
                  {style.name}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Info Text */}
        <div style={{
          background: theme.background.elevated,
          border: `1px solid ${theme.border.normal}`,
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '12px',
          color: theme.text.secondary,
          textAlign: 'center'
        }}>
          Your hair style will be visible to all players in the arena
        </div>
      </div>
    </div>
  );
}

