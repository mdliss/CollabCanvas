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
    await this.createShapeFn(this.canvasId, this.shape, this.user);
  }

  async undo() {
    await this.deleteShapeFn(this.canvasId, this.shape.id, this.user);
  }

  getDescription() {
    return `Created ${this.shape.type}`;
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
    const props = Object.keys(this.newProps).join(', ');
    return `Updated ${props}`;
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
    return `Deleted ${this.shape.type}`;
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
    return `Moved shape`;
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
    return this.description;
  }
}

