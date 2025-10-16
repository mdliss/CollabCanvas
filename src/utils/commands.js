/**
 * Command Pattern for Undo/Redo System
 * Each command encapsulates an action and its inverse
 */

// Base Command class
export class Command {
  execute() {
    throw new Error('execute() must be implemented');
  }

  undo() {
    throw new Error('undo() must be implemented');
  }

  redo() {
    return this.execute();
  }

  getDescription() {
    return 'Unknown command';
  }

  getUserName() {
    return this.metadata?.user?.displayName || 'Unknown';
  }
}

// Create Shape Command
export class CreateShapeCommand extends Command {
  constructor(canvasId, shape, user, createShapeFn, deleteShapeFn) {
    super();
    this.canvasId = canvasId;
    this.shape = shape;
    this.user = user;
    this.createShapeFn = createShapeFn;
    this.deleteShapeFn = deleteShapeFn;
  }

  async execute() {
    console.log('[CreateShapeCommand] EXECUTE: Creating shape', this.shape.id, this.shape.type);
    await this.createShapeFn(this.canvasId, this.shape, this.user);
    console.log('[CreateShapeCommand] EXECUTE: Shape created successfully');
  }

  async undo() {
    console.log('[CreateShapeCommand] UNDO: Deleting shape', this.shape.id, this.shape.type);
    await this.deleteShapeFn(this.canvasId, this.shape.id);
    console.log('[CreateShapeCommand] UNDO: Shape deleted successfully');
  }

  getDescription() {
    const typeName = this.shape.type.charAt(0).toUpperCase() + this.shape.type.slice(1);
    const colorInfo = this.shape.fill ? ` (${this.shape.fill})` : '';
    const position = ` at (${Math.round(this.shape.x)}, ${Math.round(this.shape.y)})`;
    return `Created ${typeName}${colorInfo}${position}`;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

// Update Shape Command
export class UpdateShapeCommand extends Command {
  constructor(canvasId, shapeId, newProps, oldProps, user, updateShapeFn) {
    super();
    this.canvasId = canvasId;
    this.shapeId = shapeId;
    this.newProps = newProps;
    this.oldProps = oldProps;
    this.user = user;
    this.updateShapeFn = updateShapeFn;
  }

  async execute() {
    await this.updateShapeFn(this.canvasId, this.shapeId, this.newProps, this.user);
  }

  async undo() {
    await this.updateShapeFn(this.canvasId, this.shapeId, this.oldProps, this.user);
  }

  getDescription() {
    const props = Object.keys(this.newProps);
    
    // Check for gradient changes
    if (props.includes('fillLinearGradientColorStops') || 
        props.includes('fillLinearGradientStartPoint') ||
        props.includes('fillLinearGradientEndPoint')) {
      return 'Applied gradient';
    }
    
    // Check for solid color changes
    if (props.includes('fill') && this.newProps.fill !== undefined) {
      const color = this.newProps.fill;
      const opacityText = (props.includes('opacity') && this.newProps.opacity < 1) 
        ? ` (${Math.round(this.newProps.opacity * 100)}% opacity)` 
        : '';
      return `Changed color to ${color}${opacityText}`;
    }
    
    // Check for rotation
    if (props.includes('rotation')) {
      const degrees = Math.round(this.newProps.rotation || 0);
      return `Rotated to ${degrees}°`;
    }
    
    // Check for resize (width, height, or scale changes)
    if (props.some(p => ['width', 'height', 'scaleX', 'scaleY', 'radiusX', 'radiusY', 'radius'].includes(p))) {
      const sizeInfo = [];
      if (this.newProps.width !== undefined) sizeInfo.push(`W: ${Math.round(this.newProps.width)}`);
      if (this.newProps.height !== undefined) sizeInfo.push(`H: ${Math.round(this.newProps.height)}`);
      if (this.newProps.radius !== undefined) sizeInfo.push(`R: ${Math.round(this.newProps.radius)}`);
      if (this.newProps.radiusX !== undefined) sizeInfo.push(`RX: ${Math.round(this.newProps.radiusX)}`);
      if (this.newProps.radiusY !== undefined) sizeInfo.push(`RY: ${Math.round(this.newProps.radiusY)}`);
      
      if (sizeInfo.length > 0) {
        return `Resized shape (${sizeInfo.join(', ')})`;
      }
      return 'Resized shape';
    }
    
    // Check for opacity only
    if (props.includes('opacity') && props.length === 1) {
      const opacityPercent = Math.round(this.newProps.opacity * 100);
      return `Changed opacity to ${opacityPercent}%`;
    }
    
    // Check for position changes (shouldn't happen often, MoveShapeCommand handles this)
    if (props.includes('x') || props.includes('y')) {
      return 'Moved shape';
    }
    
    // Check for text changes
    if (props.includes('text')) {
      return 'Changed text';
    }
    
    // Check for text formatting
    if (props.some(p => ['fontSize', 'fontFamily', 'fontStyle', 'align', 'verticalAlign'].includes(p))) {
      return 'Changed text formatting';
    }
    
    // Check for stroke changes
    if (props.some(p => ['stroke', 'strokeWidth'].includes(p))) {
      return 'Changed stroke';
    }
    
    // Default fallback
    return `Updated ${props.join(', ')}`;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

// Delete Shape Command
export class DeleteShapeCommand extends Command {
  constructor(canvasId, shape, user, createShapeFn, deleteShapeFn) {
    super();
    this.canvasId = canvasId;
    this.shape = shape;
    this.user = user;
    this.createShapeFn = createShapeFn;
    this.deleteShapeFn = deleteShapeFn;
  }

  async execute() {
    await this.deleteShapeFn(this.canvasId, this.shape.id, this.user);
  }

  async undo() {
    await this.createShapeFn(this.canvasId, this.shape, this.user);
  }

  getDescription() {
    const typeName = this.shape.type.charAt(0).toUpperCase() + this.shape.type.slice(1);
    const colorInfo = this.shape.fill ? ` (${this.shape.fill})` : '';
    return `Deleted ${typeName}${colorInfo}`;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

// Move Shape Command
export class MoveShapeCommand extends Command {
  constructor(canvasId, shapeId, newPosition, oldPosition, user, updateShapeFn) {
    super();
    this.canvasId = canvasId;
    this.shapeId = shapeId;
    this.newPosition = newPosition;
    this.oldPosition = oldPosition;
    this.user = user;
    this.updateShapeFn = updateShapeFn;
  }

  async execute() {
    await this.updateShapeFn(this.canvasId, this.shapeId, this.newPosition, this.user);
  }

  async undo() {
    await this.updateShapeFn(this.canvasId, this.shapeId, this.oldPosition, this.user);
  }

  getDescription() {
    const fromPos = `(${Math.round(this.oldPosition.x)}, ${Math.round(this.oldPosition.y)})`;
    const toPos = `(${Math.round(this.newPosition.x)}, ${Math.round(this.newPosition.y)})`;
    return `Moved shape from ${fromPos} to ${toPos}`;
  }

  getUserName() {
    return this.metadata?.user?.displayName || this.user?.displayName || 'Unknown';
  }
}

// Multi-Shape Command (for batch operations)
export class MultiShapeCommand extends Command {
  constructor(commands, description = 'Multi-shape operation') {
    super();
    this.commands = commands;
    this.description = description;
  }

  async execute() {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo() {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  getDescription() {
    if (this.commands.length > 0) {
      return `${this.description} (${this.commands.length} changes)`;
    }
    return this.description;
  }

  getUserName() {
    // Use the first command's user
    if (this.commands.length > 0) {
      const firstCmd = this.commands[0];
      return firstCmd.metadata?.user?.displayName || firstCmd.user?.displayName || 'Unknown';
    }
    return this.metadata?.user?.displayName || 'Unknown';
  }
}

