// Canvas dimensions (30000x30000px space - balanced size with infinite freedom)
export const CANVAS_WIDTH = 30000;
export const CANVAS_HEIGHT = 30000;

// Lock timeout for collaborative editing (8 seconds)
export const LOCK_TTL_MS = 8000;

// Default rectangle properties for new shapes
export const DEFAULT_RECT = {
  type: "rectangle",
  width: 100,
  height: 100,
  fill: "#ff3b30" // Temporary red fill for diagnostics visibility
};

// Color palette - 20 vibrant colors for shape fills
export const COLOR_PALETTE = [
  '#FF6B6B', // Red
  '#E74C3C', // Dark Red
  '#FF8C42', // Orange
  '#F39C12', // Dark Orange
  '#FFD93D', // Yellow
  '#F1C40F', // Gold
  '#6BCF7F', // Light Green
  '#2ECC71', // Green
  '#1ABC9C', // Teal
  '#4ECDC4', // Cyan
  '#3498DB', // Blue
  '#5DADE2', // Light Blue
  '#A29BFE', // Light Purple
  '#9B59B6', // Purple
  '#8E44AD', // Dark Purple
  '#FF80AB', // Pink
  '#E91E63', // Hot Pink
  '#95A5A6', // Light Gray
  '#7F8C8D', // Gray
  '#34495E', // Dark Gray
];

