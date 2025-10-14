/**
 * Utility functions for geometric calculations
 */

/**
 * Check if a shape intersects with a selection box
 * @param {Object} shape - Shape with x, y, width, height
 * @param {Object} box - Selection box with x, y, width, height
 * @returns {boolean} True if they intersect
 */
export function shapeIntersectsBox(shape, box) {
  const boxLeft = Math.min(box.x, box.x + box.width);
  const boxRight = Math.max(box.x, box.x + box.width);
  const boxTop = Math.min(box.y, box.y + box.height);
  const boxBottom = Math.max(box.y, box.y + box.height);

  const shapeLeft = shape.x;
  const shapeRight = shape.x + (shape.width || 100);
  const shapeTop = shape.y;
  const shapeBottom = shape.y + (shape.height || 100);

  return !(
    shapeRight < boxLeft ||
    shapeLeft > boxRight ||
    shapeBottom < boxTop ||
    shapeTop > boxBottom
  );
}
