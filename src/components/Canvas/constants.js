// Canvas dimensions (30000x30000px space - balanced size with infinite freedom)
export const CANVAS_WIDTH = 30000;
export const CANVAS_HEIGHT = 30000;

// Lock timeout for collaborative editing (8 seconds)
export const LOCK_TTL_MS = 8000;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEFAULT SHAPE DIMENSIONS CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SIZING PHILOSOPHY:
 * 
 * Canvas Context:
 *   - Canvas is 30,000 × 30,000 pixels (massive coordinate space)
 *   - Users typically view 4,000-8,000px of canvas at comfortable zoom levels
 *   - Shapes must be substantial enough to be visible and immediately usable
 * 
 * Target Sizing:
 *   - Shapes should occupy ~400-600px (1.3-2% of canvas width)
 *   - At typical viewing zoom (showing ~6000px width), 500px shape = 8% of viewport
 *   - This provides immediate visibility without dominating the canvas
 *   - Shapes are usable without requiring immediate resize
 * 
 * Comparison to Previous Dimensions:
 *   - OLD: 100px shapes = 0.33% of canvas = tiny dots when zoomed out
 *   - NEW: 500px shapes = 1.67% of canvas = clearly visible and professional
 * 
 * Shape Type Considerations:
 *   - Geometric shapes (rectangle, circle, etc): 400-600px primary dimension
 *   - Text: 72px font size (canvas-scale, not web-scale)
 *   - Lines: 600px length for visibility
 *   - All shapes designed for equivalent visual prominence
 * 
 * Professional Tools Benchmark:
 *   - Figma: Defaults to ~200-300px on smaller canvases
 *   - Miro: Defaults to ~250-400px sticky notes
 *   - Excalidraw: Defaults to ~200px elements
 *   - Our 30k canvas requires proportionally larger defaults
 * 
 * Performance Notes:
 *   - Larger shapes do NOT impact render performance (Konva efficiently handles any size)
 *   - Dimension calculations are negligible (<0.1ms)
 *   - User experience dramatically improved with appropriate sizing
 * 
 * All dimensions in pixels (canvas coordinate space)
 */

export const DEFAULT_SHAPE_DIMENSIONS = {
  /**
   * Rectangle: PRIMARY SHAPE - DRAMATICALLY LARGER FOR VISIBILITY
   * 
   * Size: 1500×1000px (30x20 grid cells if grid is 50px)
   * This is 15× larger than old 100×100px dimensions
   * On 30,000px canvas: 5% of canvas width (clearly visible)
   */
  rectangle: {
    width: 1500,
    height: 1000
  },

  /**
   * Circle: LARGE DIAMETER for immediate visibility
   * Radius of 750px creates 1500px diameter
   */
  circle: {
    width: 1500,   // Diameter - used for storage
    height: 1500   // Diameter - used for storage
    // Note: Radius is calculated as width/2 in rendering
  },

  /**
   * Ellipse: Large horizontal oval
   */
  ellipse: {
    width: 1500,
    height: 1000
  },

  /**
   * Triangle: Large equilateral proportions
   */
  triangle: {
    width: 1400,
    height: 1200  // ~0.866 ratio for equilateral appearance
  },

  /**
   * Star: Large five-pointed star
   */
  star: {
    width: 1500,
    height: 1500
    // Note: Outer radius is calculated as width/2 in rendering
  },

  /**
   * Line: EXTRA LONG line with VERY THICK stroke
   * Stroke width increased dramatically for visibility
   */
  line: {
    width: 1800,   // Horizontal length
    height: 0,     // Zero height = horizontal line
    strokeWidth: 20 // VERY THICK stroke for excellent visibility
  },

  /**
   * Diamond: Large square rotated 45°
   */
  diamond: {
    width: 1400,
    height: 1400
  },

  /**
   * Hexagon: Large regular hexagon
   */
  hexagon: {
    width: 1400,
    height: 1400
  },

  /**
   * Pentagon: Large regular pentagon
   */
  pentagon: {
    width: 1400,
    height: 1400
  },

  /**
   * Text: LARGE CANVAS-SCALE TYPOGRAPHY
   * 
   * Font Size: 120px (5× larger than old 24px)
   * Box: 1800×200px (9× larger than old 200×30px)
   * 
   * This ensures text is IMMEDIATELY readable at any reasonable zoom level
   */
  text: {
    fontSize: 120,
    width: 1800,
    height: 200,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.2,
    align: 'left'
  }
};

/**
 * LEGACY: Kept for backward compatibility
 * @deprecated Use DEFAULT_SHAPE_DIMENSIONS instead
 */
export const DEFAULT_RECT = {
  type: "rectangle",
  width: DEFAULT_SHAPE_DIMENSIONS.rectangle.width,
  height: DEFAULT_SHAPE_DIMENSIONS.rectangle.height,
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

