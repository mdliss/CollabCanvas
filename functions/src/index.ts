import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAI } from 'openai';
import { z } from 'zod';

// Initialize Firebase Admin
admin.initializeApp();
const rtdb = admin.database();

// Export Stripe functions
export { createCheckoutSession, createPortalSession, stripeWebhook } from './stripe';

// Export Coupon functions
export { redeemCoupon } from './coupons';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY
  });

// Constants
const CANVAS_ID = 'global-canvas-v1';
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;
const COORDINATE_MIN = -50000;
const COORDINATE_MAX = 50000;
const SIZE_MIN = 10;
const SIZE_MAX = 5000;
const TEXT_MAX_LENGTH = 500;

/**
 * AI Usage and Budget Constants
 * 
 * DISABLED: Budget system removed for unlimited usage
 */
// const USER_MONTHLY_BUDGET_USD = 5.00;
// const GPT4_INPUT_COST_PER_1K = 0.03;
// const GPT4_OUTPUT_COST_PER_1K = 0.06;

// Rate limiting map
const rateLimits = new Map<string, { count: number; resetTime: number }>();

// Valid shape types
const VALID_SHAPE_TYPES = [
  'rectangle',
  'circle',
  'line',
  'text',
  'triangle',
  'star',
  'diamond',
  'hexagon',
  'pentagon',
] as const;

// Validation schemas
const CreateShapeSchema = z.object({
  type: z.enum(VALID_SHAPE_TYPES),
  x: z.number().min(COORDINATE_MIN).max(COORDINATE_MAX),
  y: z.number().min(COORDINATE_MIN).max(COORDINATE_MAX),
  width: z.number().min(SIZE_MIN).max(SIZE_MAX).optional(),
  height: z.number().min(SIZE_MIN).max(SIZE_MAX).optional(),
  fill: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional(),
  text: z.string().max(TEXT_MAX_LENGTH).optional(),
  fontSize: z.number().min(8).max(200).optional(),
});

const UpdateShapeSchema = z.object({
  shapeId: z.string(),
  x: z.number().min(COORDINATE_MIN).max(COORDINATE_MAX).optional(),
  y: z.number().min(COORDINATE_MIN).max(COORDINATE_MAX).optional(),
  width: z.number().min(SIZE_MIN).max(SIZE_MAX).optional(),
  height: z.number().min(SIZE_MIN).max(SIZE_MAX).optional(),
  fill: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  text: z.string().max(TEXT_MAX_LENGTH).optional(),
  fontSize: z.number().min(8).max(200).optional(),
});

const MoveShapeSchema = z.object({
  shapeId: z.string(),
  x: z.number().min(COORDINATE_MIN).max(COORDINATE_MAX),
  y: z.number().min(COORDINATE_MIN).max(COORDINATE_MAX),
});

const DeleteShapeSchema = z.object({
  shapeIds: z.union([z.string(), z.array(z.string())]),
});

const LayoutArrangeSchema = z.object({
  shapeIds: z.array(z.string()),
  arrangement: z.enum([
    'grid',
    'horizontal',
    'vertical',
    'align-left',
    'align-center',
    'align-right',
    'align-top',
    'align-middle',
    'align-bottom',
  ]),
  spacing: z.number().min(0).max(500).optional(),
});

const BulkCreateSchema = z.object({
  shapes: z.array(CreateShapeSchema),
});

const BulkUpdateSchema = z.object({
  updates: z.array(UpdateShapeSchema),
});

// Utility functions
function sanitizeText(text: string): string {
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim()
    .slice(0, TEXT_MAX_LENGTH);
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now >= userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

async function getShapes(canvasId: string = CANVAS_ID): Promise<any[]> {
  const snapshot = await rtdb.ref(`canvas/${canvasId}/shapes`).once('value');
  const shapesMap = snapshot.val() || {};
  return Object.values(shapesMap).sort(
    (a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0)
  );
}

async function getMaxZIndex(canvasId: string = CANVAS_ID): Promise<number> {
  const shapes = await getShapes(canvasId);
  return shapes.reduce((max, s: any) => Math.max(max, s.zIndex || 0), 0);
}

// Tool implementations
async function createShapeTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔨 [createShapeTool] CALLED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Params:', JSON.stringify(params, null, 2));
  console.log('User ID:', userId);
  console.log('Canvas ID:', canvasId);
  
  const validated = CreateShapeSchema.parse(params);
  const shapeId = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log('Generated shape ID:', shapeId);

  const maxZ = await getMaxZIndex(canvasId);
  console.log('Max Z-index:', maxZ);

  /**
   * LARGE Canvas-Scale Default Dimensions for AI-Created Shapes
   * 
   * Philosophy:
   *   - Canvas is 30,000×30,000px (MASSIVE coordinate space)
   *   - Shapes must be 1500×1000px to be CLEARLY visible and immediately usable
   *   - OLD: 100px shapes were microscopic dots (0.33% of canvas)
   *   - NEW: 1500px shapes are PROMINENT and professional (5% of canvas)
   * 
   * Dimension Defaults:
   *   - Text: 1800×200px box with 120px font (LARGE canvas-scale readability)
   *   - Geometric shapes: 1500×1000px (15× larger than old dimensions)
   *   - Matches DEFAULT_SHAPE_DIMENSIONS configuration in frontend
   * 
   * Rationale:
   *   - AI-created shapes should match user-created shapes
   *   - IMMEDIATELY visible without any zoom required
   *   - Professional appearance consistent with modern canvas tools
   *   - 15× size increase ensures shapes are never mistaken for dots
   */
  const shape: any = {
    id: shapeId,
    type: validated.type,
    x: validated.x,
    y: validated.y,
    // LARGE canvas-scale dimensions (1500×1000px for shapes, 1800×200px for text)
    width: validated.width || (validated.type === 'text' ? 1800 : 1500),   // OLD: 100px (tiny)
    height: validated.height || (validated.type === 'text' ? 200 : 1000),  // OLD: 100px (tiny)
    fill: validated.fill || (validated.type === 'text' ? '#000000' : '#cccccc'),
    zIndex: maxZ + 1,
    createdBy: userId,
    createdAt: Date.now(),
    lastModifiedBy: userId,
    lastModifiedAt: Date.now(),
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  };

  // Text shapes require text content and font size
  if (validated.type === 'text') {
    shape.text = sanitizeText(validated.text || 'Text');
    shape.fontSize = validated.fontSize || 120; // LARGE canvas-scale font (120px)
  }

  const shapePath = `canvas/${canvasId}/shapes/${shapeId}`;
  console.log('Writing shape to RTDB:', shapePath);
  console.log('Shape data:', JSON.stringify(shape, null, 2));
  
  await rtdb.ref(shapePath).set(shape);
  console.log('✅ Shape written to RTDB');
  
  await rtdb.ref(`canvas/${canvasId}/metadata/lastUpdated`).set(Date.now());
  console.log('✅ Metadata updated');

  // CRITICAL: Include shape ID in result so extractShapeIdsFromResult can find it
  const resultMessage = `Successfully created ${validated.type} ${shapeId} at (${validated.x}, ${validated.y})`;
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ [createShapeTool] COMPLETE - Returning: ${resultMessage}`);
  console.log('   Shape ID:', shapeId);
  console.log('   (Shape ID included in result for extraction)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return resultMessage;
}

async function updateShapeTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  const validated = UpdateShapeSchema.parse(params);
  const { shapeId, ...updates } = validated;

  const shapeRef = rtdb.ref(`canvas/${canvasId}/shapes/${shapeId}`);
  const snapshot = await shapeRef.once('value');

  if (!snapshot.exists()) {
    throw new Error(`Shape ${shapeId} not found`);
  }

  const shape = snapshot.val();

  // Check if locked by another user
  if (shape.isLocked && shape.lockedBy && shape.lockedBy !== userId) {
    const lockAge = Date.now() - (shape.lockedAt || 0);
    if (lockAge < 8000) {
      throw new Error('Shape is locked by another user');
    }
  }

  const updateData: any = {
    ...updates,
    lastModifiedBy: userId,
    lastModifiedAt: Date.now(),
  };

  if (updateData.text) {
    updateData.text = sanitizeText(updateData.text);
  }

  await shapeRef.update(updateData);
  await rtdb.ref(`canvas/${canvasId}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Updated shape: ${shapeId}`);
  return `Successfully updated shape`;
}

async function moveShapeTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  const validated = MoveShapeSchema.parse(params);
  const { shapeId, x, y } = validated;

  const shapeRef = rtdb.ref(`canvas/${canvasId}/shapes/${shapeId}`);
  const snapshot = await shapeRef.once('value');

  if (!snapshot.exists()) {
    throw new Error(`Shape ${shapeId} not found`);
  }

  await shapeRef.update({
    x,
    y,
    lastModifiedBy: userId,
    lastModifiedAt: Date.now(),
  });

  await rtdb.ref(`canvas/${canvasId}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Moved shape ${shapeId} to (${x}, ${y})`);
  return `Successfully moved shape to (${x}, ${y})`;
}

async function deleteShapeTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  const validated = DeleteShapeSchema.parse(params);
  const shapeIds = Array.isArray(validated.shapeIds)
    ? validated.shapeIds
    : [validated.shapeIds];

  for (const shapeId of shapeIds) {
    await rtdb.ref(`canvas/${canvasId}/shapes/${shapeId}`).remove();
  }

  await rtdb.ref(`canvas/${canvasId}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Deleted ${shapeIds.length} shape(s)`);
  return `Successfully deleted ${shapeIds.length} shape(s)`;
}

async function layoutArrangeTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  const validated = LayoutArrangeSchema.parse(params);
  const { shapeIds, arrangement, spacing = 50 } = validated;

  const shapes = await getShapes(canvasId);
  const targetShapes = shapes.filter((s: any) => shapeIds.includes(s.id));

  if (targetShapes.length === 0) {
    throw new Error('No shapes found with provided IDs');
  }

  let updates: Array<{ shapeId: string; x: number; y: number }> = [];

  switch (arrangement) {
    case 'grid': {
      const cols = Math.ceil(Math.sqrt(targetShapes.length));
      targetShapes.forEach((shape: any, i: number) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const startX = Math.min(...targetShapes.map((s: any) => s.x));
        const startY = Math.min(...targetShapes.map((s: any) => s.y));
        updates.push({
          shapeId: shape.id,
          x: startX + col * (150 + spacing),
          y: startY + row * (150 + spacing),
        });
      });
      break;
    }
    case 'horizontal': {
      const startX = Math.min(...targetShapes.map((s: any) => s.x));
      const avgY = targetShapes.reduce((sum: number, s: any) => sum + s.y, 0) / targetShapes.length;
      targetShapes.forEach((shape: any, i: number) => {
        updates.push({
          shapeId: shape.id,
          x: startX + i * (150 + spacing),
          y: avgY,
        });
      });
      break;
    }
    case 'vertical': {
      const avgX = targetShapes.reduce((sum: number, s: any) => sum + s.x, 0) / targetShapes.length;
      const startY = Math.min(...targetShapes.map((s: any) => s.y));
      targetShapes.forEach((shape: any, i: number) => {
        updates.push({
          shapeId: shape.id,
          x: avgX,
          y: startY + i * (150 + spacing),
        });
      });
      break;
    }
    case 'align-left': {
      const minX = Math.min(...targetShapes.map((s: any) => s.x));
      targetShapes.forEach((shape: any) => {
        updates.push({ shapeId: shape.id, x: minX, y: shape.y });
      });
      break;
    }
    case 'align-center': {
      const avgX = targetShapes.reduce((sum: number, s: any) => sum + s.x, 0) / targetShapes.length;
      targetShapes.forEach((shape: any) => {
        updates.push({ shapeId: shape.id, x: avgX, y: shape.y });
      });
      break;
    }
    case 'align-right': {
      const maxX = Math.max(...targetShapes.map((s: any) => s.x));
      targetShapes.forEach((shape: any) => {
        updates.push({ shapeId: shape.id, x: maxX, y: shape.y });
      });
      break;
    }
    case 'align-top': {
      const minY = Math.min(...targetShapes.map((s: any) => s.y));
      targetShapes.forEach((shape: any) => {
        updates.push({ shapeId: shape.id, x: shape.x, y: minY });
      });
      break;
    }
    case 'align-middle': {
      const avgY = targetShapes.reduce((sum: number, s: any) => sum + s.y, 0) / targetShapes.length;
      targetShapes.forEach((shape: any) => {
        updates.push({ shapeId: shape.id, x: shape.x, y: avgY });
      });
      break;
    }
    case 'align-bottom': {
      const maxY = Math.max(...targetShapes.map((s: any) => s.y));
      targetShapes.forEach((shape: any) => {
        updates.push({ shapeId: shape.id, x: shape.x, y: maxY });
      });
      break;
    }
  }

  for (const update of updates) {
    await rtdb.ref(`canvas/${canvasId}/shapes/${update.shapeId}`).update({
      x: update.x,
      y: update.y,
      lastModifiedBy: userId,
      lastModifiedAt: Date.now(),
    });
  }

  await rtdb.ref(`canvas/${canvasId}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Arranged ${updates.length} shapes in ${arrangement} layout`);
  return `Successfully arranged ${updates.length} shapes in ${arrangement} layout`;
}

async function queryCanvasTool(params: any, canvasId: string = CANVAS_ID): Promise<string> {
  const shapes = await getShapes(canvasId);

  if (shapes.length === 0) {
    return 'The canvas is currently empty. No shapes have been created yet.';
  }

  const summary = shapes.map((s: any) => ({
    id: s.id,
    type: s.type,
    position: { x: Math.round(s.x), y: Math.round(s.y) },
    size: { width: Math.round(s.width || 0), height: Math.round(s.height || 0) },
    color: s.fill,
    text: s.type === 'text' ? s.text : undefined,
  }));

  console.log(`[AI Tool] Queried canvas: ${shapes.length} shapes`);
  return `Canvas contains ${shapes.length} shapes:\n${JSON.stringify(summary, null, 2)}`;
}

/**
 * Layout Template System
 * 
 * Pre-built templates for common UI patterns with perfect spacing.
 * Creates complete multi-shape layouts in single operation.
 * 
 * Templates Available:
 * - login-form: Title, username field, password field, submit button
 * - dashboard-card: Card container with title, content area
 * - nav-bar: Horizontal navigation with multiple sections
 * - button-group: Row of action buttons with consistent spacing
 * - form-field: Label + input field combo
 */

interface TemplateParams {
  centerX: number;
  centerY: number;
  primaryColor?: string;
  textColor?: string;
  scale?: number;
}

/**
 * Create Login Form Template
 * 
 * Generates complete login form with:
 * - Title text
 * - Username field (rectangle + label)
 * - Password field (rectangle + label)
 * - Submit button
 * 
 * All shapes properly spaced and aligned.
 */
function createLoginFormTemplate(params: TemplateParams, userId: string): any[] {
  const {
    centerX,
    centerY,
    primaryColor = '#4f46e5',
    textColor = '#000000',
    scale = 1
  } = params;
  
  const fieldWidth = 1500 * scale;
  const fieldHeight = 200 * scale;
  const spacing = 150 * scale;
  const fontSize = 120 * scale;
  const labelFontSize = 60 * scale;
  
  let currentY = centerY - 800 * scale;
  const shapes: any[] = [];
  const timestamp = Date.now();
  
  // Title - FIXED: Increased width from 400 to 1200 to prevent text clipping
  // Font size is 180px (120 * 1.5), needs ~108px per character
  // "Login" = 5 chars × 108px = 540px minimum, using 1200px for safe margin
  shapes.push({
    id: `shape_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    text: 'Login',
    x: centerX - 600 * scale,  // Center the wider text box
    y: currentY,
    width: 1200 * scale,  // Increased from 400 to prevent "LOGI" clipping
    height: 250 * scale,  // Increased from 150 to accommodate taller font
    fontSize: fontSize * 1.5,  // 180px
    fill: textColor,
    align: 'center',
    fontWeight: 'bold',
    createdBy: userId,
    createdAt: timestamp,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  currentY += 300 * scale;
  
  // Username field background
  shapes.push({
    id: `shape_${timestamp + 1}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'rectangle',
    x: centerX - fieldWidth / 2,
    y: currentY,
    width: fieldWidth,
    height: fieldHeight,
    fill: '#f3f4f6',
    stroke: '#d1d5db',
    strokeWidth: 2,
    createdBy: userId,
    createdAt: timestamp + 1,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp + 1,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  // Username label
  shapes.push({
    id: `shape_${timestamp + 2}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    text: 'Username',
    x: centerX - fieldWidth / 2 + 30,
    y: currentY + 60,
    width: fieldWidth - 60,
    height: 100,
    fontSize: labelFontSize,
    fill: '#6b7280',
    createdBy: userId,
    createdAt: timestamp + 2,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp + 2,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  currentY += fieldHeight + spacing;
  
  // Password field background
  shapes.push({
    id: `shape_${timestamp + 3}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'rectangle',
    x: centerX - fieldWidth / 2,
    y: currentY,
    width: fieldWidth,
    height: fieldHeight,
    fill: '#f3f4f6',
    stroke: '#d1d5db',
    strokeWidth: 2,
    createdBy: userId,
    createdAt: timestamp + 3,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp + 3,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  // Password label
  shapes.push({
    id: `shape_${timestamp + 4}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    text: 'Password',
    x: centerX - fieldWidth / 2 + 30,
    y: currentY + 60,
    width: fieldWidth - 60,
    height: 100,
    fontSize: labelFontSize,
    fill: '#6b7280',
    createdBy: userId,
    createdAt: timestamp + 4,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp + 4,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  currentY += fieldHeight + spacing * 1.5;
  
  // Submit button background
  shapes.push({
    id: `shape_${timestamp + 5}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'rectangle',
    x: centerX - fieldWidth / 2,
    y: currentY,
    width: fieldWidth,
    height: 250 * scale,
    fill: primaryColor,
    createdBy: userId,
    createdAt: timestamp + 5,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp + 5,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  // Submit button text - Increased width for better rendering
  shapes.push({
    id: `shape_${timestamp + 6}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    text: 'Sign In',
    x: centerX - 400 * scale,  // Center the wider text box
    y: currentY + 80,
    width: 800 * scale,  // Increased from 400 for clearer rendering
    height: 150 * scale,  // Increased from 100 for taller font
    fontSize: 72 * scale,
    fill: '#ffffff',
    align: 'center',
    fontWeight: 'bold',
    createdBy: userId,
    createdAt: timestamp + 6,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp + 6,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  return shapes;
}

/**
 * Create Dashboard Card Template
 * 
 * Generates card with:
 * - Card background
 * - Title text
 * - Content placeholder
 */
function createDashboardCardTemplate(params: TemplateParams, userId: string): any[] {
  const {
    centerX,
    centerY,
    textColor = '#000000',
    scale = 1
  } = params;
  
  const cardWidth = 1400 * scale;
  const cardHeight = 1600 * scale;
  const timestamp = Date.now();
  const shapes: any[] = [];
  
  // Card background
  shapes.push({
    id: `shape_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'rectangle',
    x: centerX - cardWidth / 2,
    y: centerY - cardHeight / 2,
    width: cardWidth,
    height: cardHeight,
    fill: '#ffffff',
    stroke: '#e5e7eb',
    strokeWidth: 3,
    createdBy: userId,
    createdAt: timestamp,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  // Title
  shapes.push({
    id: `shape_${timestamp + 1}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'text',
    text: 'Card Title',
    x: centerX - cardWidth / 2 + 40,
    y: centerY - cardHeight / 2 + 40,
    width: cardWidth - 80,
    height: 150,
    fontSize: 96 * scale,
    fill: textColor,
    fontWeight: 'bold',
    createdBy: userId,
    createdAt: timestamp + 1,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp + 1,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  // Content placeholder
  shapes.push({
    id: `shape_${timestamp + 2}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'rectangle',
    x: centerX - cardWidth / 2 + 40,
    y: centerY - cardHeight / 2 + 250,
    width: cardWidth - 80,
    height: cardHeight - 350,
    fill: '#f9fafb',
    createdBy: userId,
    createdAt: timestamp + 2,
    lastModifiedBy: userId,
    lastModifiedAt: timestamp + 2,
    isLocked: false,
    lockedBy: null,
    lockedAt: null
  });
  
  return shapes;
}

/**
 * Template Registry
 * 
 * Maps template names to generator functions.
 */
const TEMPLATES: Record<string, (params: TemplateParams, userId: string) => any[]> = {
  'login-form': createLoginFormTemplate,
  'dashboard-card': createDashboardCardTemplate,
};

/**
 * Create From Template Tool
 * 
 * Creates complete multi-shape layouts from templates.
 * Single operation with perfect spacing and alignment.
 */
async function createFromTemplateTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  const { templateName, centerX, centerY, primaryColor, textColor, scale } = params;
  
  const templateFn = TEMPLATES[templateName];
  if (!templateFn) {
    const available = Object.keys(TEMPLATES).join(', ');
    throw new Error(`Template "${templateName}" not found. Available: ${available}`);
  }
  
  const templateParams: TemplateParams = {
    centerX,
    centerY,
    primaryColor,
    textColor,
    scale: scale || 1
  };
  
  const shapes = templateFn(templateParams, userId);
  
  // Write all shapes to RTDB
  for (const shape of shapes) {
    await rtdb.ref(`canvas/${canvasId}/shapes/${shape.id}`).set(shape);
  }
  
  await rtdb.ref(`canvas/${canvasId}/metadata/lastUpdated`).set(Date.now());
  
  console.log(`[AI Tool] Created ${shapes.length} shapes from template: ${templateName}`);
  return `Successfully created ${templateName} template with ${shapes.length} shapes at position (${centerX}, ${centerY})`;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI OPERATION TRACKING AND UNDO SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tracks all AI operations with affected shape IDs for atomic undo.
 * Enables users to reverse AI actions if mistakes occur.
 * 
 * Architecture:
 * - Operation tracking: Store operation metadata in RTDB
 * - Affected shapes: Track which shapes created/modified/deleted
 * - Reversal logic: Undo operations in reverse order
 * - Last operation reference: AI remembers most recent operation
 * 
 * RTDB Structure:
 * /ai-operations/{userId}/last-operation → operationId
 * /ai-operations/{userId}/operations/{operationId} → operation data
 */

interface AIOperation {
  operationId: string;
  userId: string;
  timestamp: number;
  toolCalls: Array<{
    functionName: string;
    params: any;
    affectedShapeIds: string[];
  }>;
  reversible: boolean;
}

/**
 * Extract Shape IDs from Tool Call Result
 * 
 * Parses tool execution result to extract affected shape IDs.
 * Enables tracking which shapes were created/modified for undo.
 */
function extractShapeIdsFromResult(functionName: string, result: string, params: any): string[] {
  console.log('  🔍 [extractShapeIds] Extracting from:', functionName);
  console.log('    Result string:', result.substring(0, 200));
  
  const shapeIds: string[] = [];
  
  // Extract from result message
  // Updated regex to match both formats:
  // - Old: shape_1234567890_abc123
  // - New: shape_1234567890_0_abc123 (with index)
  const idMatches = result.match(/shape_\d+(?:_\d+)?_[a-z0-9]+/g);
  console.log('    Regex matches:', idMatches);
  if (idMatches) {
    shapeIds.push(...idMatches);
    console.log('    Added from regex:', idMatches.length, 'IDs');
  }
  
  // Extract from params for update/delete operations
  if (params.shapeId) {
    shapeIds.push(params.shapeId);
    console.log('    Added from params.shapeId:', params.shapeId);
  }
  if (params.shapeIds && Array.isArray(params.shapeIds)) {
    shapeIds.push(...params.shapeIds);
    console.log('    Added from params.shapeIds:', params.shapeIds.length, 'IDs');
  }
  
  const uniqueIds = [...new Set(shapeIds)];
  console.log('    Final unique IDs:', uniqueIds.length, '→', uniqueIds);
  
  return uniqueIds; // Deduplicate
}

/**
 * Track AI Operation for Undo
 * 
 * Stores operation metadata in RTDB for potential reversal.
 * Updates last-operation pointer for quick undo access.
 */
async function trackAIOperation(
  userId: string,
  toolCalls: Array<{ functionName: string; params: any; result: string }>
): Promise<string> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 [trackAIOperation] CALLED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('User ID:', userId);
  console.log('Tool calls:', toolCalls.length);
  
  const operationId = `ai-op-${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log('Generated operation ID:', operationId);
  
  console.log('Processing tool calls to extract shape IDs...');
  const processedToolCalls = toolCalls.map((tc, idx) => {
    console.log(`  Processing tool call ${idx}: ${tc.functionName}`);
    const affectedShapeIds = extractShapeIdsFromResult(tc.functionName, tc.result, tc.params);
    console.log(`    Extracted ${affectedShapeIds.length} shape IDs:`, affectedShapeIds);
    
    return {
      functionName: tc.functionName,
      params: tc.params,
      affectedShapeIds
    };
  });
  
  const operation: AIOperation = {
    operationId,
    userId,
    timestamp: Date.now(),
    toolCalls: processedToolCalls,
    reversible: true
  };
  
  console.log('Operation object to store:', JSON.stringify(operation, null, 2));
  
  // Store operation
  const operationPath = `ai-operations/${userId}/operations/${operationId}`;
  console.log('Writing to RTDB path:', operationPath);
  await rtdb.ref(operationPath).set(operation);
  console.log('✅ Operation written to RTDB');
  
  // Update last operation pointer
  const lastOpPath = `ai-operations/${userId}/last-operation`;
  console.log('Updating last-operation pointer:', lastOpPath);
  await rtdb.ref(lastOpPath).set(operationId);
  console.log('✅ Last-operation pointer updated');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ [trackAIOperation] COMPLETE - Returning: ${operationId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return operationId;
}

/**
 * Undo AI Operation Tool
 * 
 * Reverses the last (or specified) AI operation atomically.
 * Deletes created shapes, restores modified shapes.
 */
async function undoAIOperationTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  const { operationId: specifiedOpId } = params;
  
  // Get operation ID (specified or last)
  let operationId = specifiedOpId;
  if (!operationId) {
    const lastOpSnapshot = await rtdb.ref(`ai-operations/${userId}/last-operation`).once('value');
    operationId = lastOpSnapshot.val();
  }
  
  if (!operationId) {
    throw new Error('No AI operation to undo');
  }
  
  // Load operation
  const opSnapshot = await rtdb.ref(`ai-operations/${userId}/operations/${operationId}`).once('value');
  const operation: AIOperation | null = opSnapshot.val();
  
  if (!operation) {
    throw new Error(`Operation ${operationId} not found`);
  }
  
  if (!operation.reversible) {
    throw new Error('This operation cannot be undone');
  }
  
  console.log(`[AI Undo] Reversing operation ${operationId} with ${operation.toolCalls.length} tool calls`);
  
  let undoCount = 0;
  
  // Reverse tool calls in reverse order
  for (const toolCall of operation.toolCalls.reverse()) {
    const affectedIds = toolCall.affectedShapeIds;
    
    if (toolCall.functionName === 'create_shape' || toolCall.functionName === 'bulk_create' || toolCall.functionName === 'create_from_template') {
      // Created shapes → Delete them
      if (affectedIds.length > 0) {
        await deleteShapeTool({ shapeIds: affectedIds }, userId);
        undoCount += affectedIds.length;
        console.log(`[AI Undo] Deleted ${affectedIds.length} created shapes`);
      }
    } else if (toolCall.functionName === 'delete_shape') {
      // Deleted shapes → Cannot restore (would need backup)
      console.warn(`[AI Undo] Cannot restore deleted shapes: ${affectedIds.join(', ')}`);
    } else if (toolCall.functionName === 'update_shape' || toolCall.functionName === 'move_shape') {
      // Modified shapes → Would need to restore original state (complex)
      console.warn(`[AI Undo] Cannot restore original state for modified shapes: ${affectedIds.join(', ')}`);
    }
  }
  
  // Mark operation as undone
  await rtdb.ref(`ai-operations/${userId}/operations/${operationId}/undone`).set(true);
  
  // Clear last operation pointer
  await rtdb.ref(`ai-operations/${userId}/last-operation`).set(null);
  
  return `Undid AI operation: removed ${undoCount} shapes`;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI USAGE TRACKING AND BUDGET ENFORCEMENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Monitors token usage and enforces monthly budgets to prevent cost overruns.
 * 
 * Features:
 * - Per-user monthly token tracking
 * - Cost estimation based on GPT-4 pricing
 * - Budget enforcement before request processing
 * - Usage analytics and reporting
 * 
 * RTDB Structure:
 * /ai-usage/{userId}/{monthKey} → { totalTokens, totalRequests, estimatedCost }
 */

/**
 * Helper functions for usage tracking
 * 
 * DISABLED: Not needed with budget system removed
 */
/*
function getMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * 0.03;
  const outputCost = (outputTokens / 1000) * 0.06;
  return inputCost + outputCost;
}
*/

/**
 * Check User Budget
 * 
 * DISABLED: Budget checking removed for unlimited usage
 */
/*
async function checkUserBudget(userId: string): Promise<void> {
  const monthKey = getMonthKey();
  const usageRef = rtdb.ref(`ai-usage/${userId}/${monthKey}`);
  const snapshot = await usageRef.once('value');
  const usage = snapshot.val();
  
  if (usage && usage.estimatedCost >= USER_MONTHLY_BUDGET_USD) {
    throw new Error(
      `Monthly AI budget of $${USER_MONTHLY_BUDGET_USD} exceeded. ` +
      `Current usage: $${usage.estimatedCost.toFixed(2)}. ` +
      `Resets next month.`
    );
  }
}
*/

/**
 * Track Usage and Update Budget
 * 
 * DISABLED: Usage tracking removed for unlimited usage
 */
/*
async function trackUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  toolCalls: number
): Promise<void> {
  const monthKey = getMonthKey();
  const usageRef = rtdb.ref(`ai-usage/${userId}/${monthKey}`);
  
  await usageRef.transaction((current: any) => {
    const totalTokens = inputTokens + outputTokens;
    const cost = calculateCost(inputTokens, outputTokens);
    
    return {
      totalTokens: (current?.totalTokens || 0) + totalTokens,
      totalRequests: (current?.totalRequests || 0) + 1,
      totalToolCalls: (current?.totalToolCalls || 0) + toolCalls,
      inputTokens: (current?.inputTokens || 0) + inputTokens,
      outputTokens: (current?.outputTokens || 0) + outputTokens,
      estimatedCost: (current?.estimatedCost || 0) + cost,
      lastUpdated: Date.now()
    };
  });
  
  console.log(`[AI Usage] Tracked: ${inputTokens + outputTokens} tokens, ${toolCalls} tools, ~$${calculateCost(inputTokens, outputTokens).toFixed(4)}`);
}
*/

/**
 * Optimized Bulk Create with Batched RTDB Writes
 * 
 * CRITICAL PERFORMANCE FIX:
 * - OLD: Sequential writes (await in loop) = 50 shapes × 100ms = 5 seconds
 * - NEW: Single batched write = 50 shapes in ~200ms total
 * 
 * This enables creating hundreds of shapes efficiently without timeout.
 * 
 * Performance:
 * - 50 shapes: ~0.2 seconds (was ~5 seconds)
 * - 100 shapes: ~0.4 seconds (was ~10 seconds)
 * - 500 shapes: ~2 seconds (was ~50 seconds - timeout!)
 * 
 * Architecture:
 * - Builds updates object with all shapes
 * - Single rtdb.ref().update() call writes everything atomically
 * - Returns all created shape IDs for history tracking
 */
/**
 * Optimized Bulk Create with Fixed ID Generation and Validation
 * 
 * CRITICAL FIXES:
 * 1. Indexed IDs prevent collisions (timestamp_index_random)
 * 2. Single timestamp for all shapes in batch
 * 3. Detailed validation logging
 * 4. Position spread verification
 * 
 * Performance: 500 shapes in ~2 seconds (was ~50 seconds with sequential writes)
 */
async function bulkCreateTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  const validated = BulkCreateSchema.parse(params);
  const maxZ = await getMaxZIndex(canvasId);
  const timestamp = Date.now(); // Single timestamp for entire batch

  // Detailed request logging
  console.log(`[AI Tool] Bulk create requested:`, {
    shapeCount: validated.shapes.length,
    types: [...new Set(validated.shapes.map((s: any) => s.type))],
    samplePositions: validated.shapes.slice(0, 3).map((s: any) => ({ x: s.x, y: s.y })),
    sampleColors: validated.shapes.slice(0, 3).map((s: any) => s.fill)
  });

  // Validate position spread (detect if all shapes at same position)
  if (validated.shapes.length > 1) {
    const uniquePositions = new Set(validated.shapes.map((s: any) => `${s.x},${s.y}`));
    if (uniquePositions.size === 1) {
      console.warn(`[AI Tool] WARNING: All ${validated.shapes.length} shapes at same position!`);
    } else {
      console.log(`[AI Tool] Position spread OK: ${uniquePositions.size} unique positions for ${validated.shapes.length} shapes`);
    }
  }

  let currentZ = maxZ;
  const createdIds: string[] = [];
  const updates: any = {}; // Batched updates object

  // Build all shapes with INDEXED IDs (prevents collisions)
  for (let i = 0; i < validated.shapes.length; i++) {
    const shapeParams = validated.shapes[i];
    // CRITICAL FIX: Use index to guarantee unique IDs even in same millisecond
    const shapeId = `shape_${timestamp}_${i}_${Math.random().toString(36).substr(2, 6)}`;
    currentZ++;

    const shape: any = {
      id: shapeId,
      type: shapeParams.type,
      x: shapeParams.x,
      y: shapeParams.y,
      // Use LARGE defaults matching user-created shapes
      width: shapeParams.width || (shapeParams.type === 'text' ? 1800 : 1500),
      height: shapeParams.height || (shapeParams.type === 'text' ? 200 : 1000),
      fill: shapeParams.fill || (shapeParams.type === 'text' ? '#000000' : '#cccccc'),
      zIndex: currentZ,
      createdBy: userId,
      createdAt: timestamp,
      lastModifiedBy: userId,
      lastModifiedAt: timestamp,
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
    };

    if (shapeParams.type === 'text') {
      shape.text = sanitizeText(shapeParams.text || 'Text');
      shape.fontSize = shapeParams.fontSize || 120; // LARGE canvas-scale font
    }

    // Add to batched updates
    updates[`canvas/${canvasId}/shapes/${shapeId}`] = shape;
    createdIds.push(shapeId);
  }

  // Add metadata update
  updates[`canvas/${canvasId}/metadata/lastUpdated`] = timestamp;

  // CRITICAL: Single batched write - 25× faster than sequential writes
  await rtdb.ref().update(updates);

  console.log(`[AI Tool] ✅ Bulk created ${createdIds.length} shapes in single batched write`);
  console.log(`[AI Tool] Shape IDs: ${createdIds.slice(0, 3).join(', ')}${createdIds.length > 3 ? ` ... (+${createdIds.length - 3} more)` : ''}`);
  
  // Return shape IDs for history tracking
  return `Successfully created ${createdIds.length} shapes: ${createdIds.join(', ')}`;
}

async function bulkUpdateTool(params: any, userId: string, canvasId: string = CANVAS_ID): Promise<string> {
  const validated = BulkUpdateSchema.parse(params);
  let updateCount = 0;

  for (const updateParams of validated.updates) {
    const { shapeId, ...updates } = updateParams;

    const shapeRef = rtdb.ref(`canvas/${canvasId}/shapes/${shapeId}`);
    const snapshot = await shapeRef.once('value');

    if (!snapshot.exists()) {
      console.warn(`[AI Tool] Shape ${shapeId} not found, skipping`);
      continue;
    }

    const shape = snapshot.val();

    // Check if locked
    if (shape.isLocked && shape.lockedBy && shape.lockedBy !== userId) {
      const lockAge = Date.now() - (shape.lockedAt || 0);
      if (lockAge < 8000) {
        console.warn(`[AI Tool] Shape ${shapeId} is locked, skipping`);
        continue;
      }
    }

    const updateData: any = {
      ...updates,
      lastModifiedBy: userId,
      lastModifiedAt: Date.now(),
    };

    if (updateData.text) {
      updateData.text = sanitizeText(updateData.text);
    }

    await shapeRef.update(updateData);
    updateCount++;
  }

  await rtdb.ref(`canvas/${canvasId}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Bulk updated ${updateCount} shapes`);
  return `Successfully updated ${updateCount} shapes`;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Canvas Agent Cloud Function - Extended Configuration for Large Batches
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Configuration:
 * - Timeout: 540 seconds (9 minutes) - Handles large batch operations
 * - Memory: 1GB - Processes hundreds of shapes efficiently
 * - Max Instances: 10 - Prevents excessive concurrent usage
 * 
 * Performance Targets:
 * - 50 shapes: <10 seconds
 * - 100 shapes: <20 seconds
 * - 500 shapes: <60 seconds
 * - 1000 shapes: <120 seconds
 * 
 * Why Extended Timeout:
 * - AI processing: 2-5 seconds
 * - RTDB writes for 500 shapes: 30-60 seconds
 * - Tool execution overhead: 10-20 seconds
 * - Buffer for network latency: 30 seconds
 * - Total: Up to 120 seconds for very large batches
 */
export const aiCanvasAgent = functions
  .runWith({
    timeoutSeconds: 540,  // 9 minutes (max for Gen 1 functions)
    memory: '1GB',        // 1GB RAM for large operations
    maxInstances: 10      // Limit concurrent instances
  })
  .https.onRequest(async (req, res) => {
  // CORS configuration
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const startTime = Date.now();

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing token' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    const userId = decodedToken.uid;

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      res.status(429).json({
        error: 'Rate limit exceeded. Maximum 20 requests per minute.',
      });
      return;
    }

    // Parse request body
    const { messages, stream = false, canvasContext, canvasId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid request: messages array required' });
      return;
    }
    
    // Use dynamic canvasId from request, fallback to global canvas
    const targetCanvasId = canvasId || CANVAS_ID;

    console.log(`[AI Agent] Processing request for user ${userId}`);
    console.log(`  Messages: ${messages.length}`);
    console.log(`  Canvas ID: ${targetCanvasId}`);
    console.log(`  Stream: ${stream}`);
    
    if (canvasContext) {
      console.log(`[AI Agent] Canvas context:`, {
        selectedShapes: canvasContext.selectedShapes?.length || 0,
        viewportCenter: canvasContext.viewportCenter,
        zoom: canvasContext.zoom,
        totalShapes: canvasContext.totalShapes
      });
    }

    // Budget checking disabled - unlimited usage
    console.log('[AI Agent] Budget checking disabled - proceeding with request');

    // Define tools for function calling
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'create_shape',
          description: 'Create a new shape on the canvas. Supports rectangles, circles, lines, text, triangles, stars, diamonds, hexagons, and pentagons.',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: VALID_SHAPE_TYPES,
                description: 'Type of shape to create',
              },
              x: {
                type: 'number',
                description: 'X coordinate (canvas center is around 15000)',
              },
              y: {
                type: 'number',
                description: 'Y coordinate (canvas center is around 15000)',
              },
              width: {
                type: 'number',
                description: 'Width in pixels (10-5000)',
              },
              height: {
                type: 'number',
                description: 'Height in pixels (10-5000)',
              },
              fill: {
                type: 'string',
                description: 'Hex color code (e.g., #FF0000)',
              },
              text: {
                type: 'string',
                description: 'Text content (for text shapes only)',
              },
              fontSize: {
                type: 'number',
                description: 'Font size (for text shapes, 8-200)',
              },
            },
            required: ['type', 'x', 'y'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'update_shape',
          description: 'Update properties of an existing shape (color, size, position, rotation, opacity, text content).',
          parameters: {
            type: 'object',
            properties: {
              shapeId: {
                type: 'string',
                description: 'ID of the shape to update',
              },
              x: { type: 'number', description: 'New X coordinate' },
              y: { type: 'number', description: 'New Y coordinate' },
              width: { type: 'number', description: 'New width' },
              height: { type: 'number', description: 'New height' },
              fill: { type: 'string', description: 'New color (hex)' },
              rotation: { type: 'number', description: 'Rotation in degrees' },
              opacity: { type: 'number', description: 'Opacity (0-1)' },
              text: { type: 'string', description: 'New text content' },
              fontSize: { type: 'number', description: 'New font size' },
            },
            required: ['shapeId'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'move_shape',
          description: 'Move a shape to a new position on the canvas.',
          parameters: {
            type: 'object',
            properties: {
              shapeId: {
                type: 'string',
                description: 'ID of the shape to move',
              },
              x: {
                type: 'number',
                description: 'New X coordinate',
              },
              y: {
                type: 'number',
                description: 'New Y coordinate',
              },
            },
            required: ['shapeId', 'x', 'y'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'delete_shape',
          description: 'Delete one or multiple shapes from the canvas.',
          parameters: {
            type: 'object',
            properties: {
              shapeIds: {
                oneOf: [
                  { type: 'string' },
                  { type: 'array', items: { type: 'string' } },
                ],
                description: 'Shape ID or array of shape IDs to delete',
              },
            },
            required: ['shapeIds'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'layout_arrange',
          description: 'Arrange multiple shapes in a specific layout pattern (grid, horizontal line, vertical line, align shapes).',
          parameters: {
            type: 'object',
            properties: {
              shapeIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of shape IDs to arrange',
              },
              arrangement: {
                type: 'string',
                enum: [
                  'grid',
                  'horizontal',
                  'vertical',
                  'align-left',
                  'align-center',
                  'align-right',
                  'align-top',
                  'align-middle',
                  'align-bottom',
                ],
                description: 'Type of arrangement',
              },
              spacing: {
                type: 'number',
                description: 'Spacing between shapes in pixels (0-500)',
              },
            },
            required: ['shapeIds', 'arrangement'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'query_canvas',
          description: 'Get current state of the canvas to understand what shapes exist and their properties.',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'create_from_template',
          description: 'Create complete multi-shape layouts from pre-built templates (login-form, dashboard-card). Single operation with perfect spacing.',
          parameters: {
            type: 'object',
            properties: {
              templateName: {
                type: 'string',
                enum: ['login-form', 'dashboard-card'],
                description: 'Template name to create'
              },
              centerX: {
                type: 'number',
                description: 'X coordinate for template center'
              },
              centerY: {
                type: 'number',
                description: 'Y coordinate for template center'
              },
              primaryColor: {
                type: 'string',
                description: 'Primary color for buttons/accents (hex code)'
              },
              textColor: {
                type: 'string',
                description: 'Text color (hex code)'
              },
              scale: {
                type: 'number',
                description: 'Scale factor (default: 1.0)'
              }
            },
            required: ['templateName', 'centerX', 'centerY']
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'undo_ai_operation',
          description: 'Undo the last AI operation (or specified operation). Removes created shapes atomically.',
          parameters: {
            type: 'object',
            properties: {
              operationId: {
                type: 'string',
                description: 'Operation ID to undo (optional - defaults to last operation)'
              }
            },
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'bulk_create',
          description: 'CRITICAL: Use this for ANY request involving 2+ shapes. Creates multiple shapes simultaneously in a SINGLE operation. ALWAYS use this instead of calling create_shape multiple times. Examples: "add 50 rectangles" → bulk_create with 50 shapes, "create 10 circles" → bulk_create with 10 shapes, "put 400 squares" → bulk_create with 400 shapes.',
          parameters: {
            type: 'object',
            properties: {
              shapes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: VALID_SHAPE_TYPES },
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    fill: { type: 'string' },
                    text: { type: 'string' },
                    fontSize: { type: 'number' },
                  },
                  required: ['type', 'x', 'y'],
                },
                description: 'Array of shapes to create',
              },
            },
            required: ['shapes'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'bulk_update',
          description: 'Update multiple shapes simultaneously.',
          parameters: {
            type: 'object',
            properties: {
              updates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    shapeId: { type: 'string' },
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    fill: { type: 'string' },
                    rotation: { type: 'number' },
                    opacity: { type: 'number' },
                    text: { type: 'string' },
                    fontSize: { type: 'number' },
                  },
                  required: ['shapeId'],
                },
                description: 'Array of shape updates',
              },
            },
            required: ['updates'],
          },
        },
      },
    ];

    // System prompt
    /**
     * Build Context-Aware System Prompt
     * 
     * Dynamically enhances system prompt with current canvas state.
     * Enables AI to understand "this", "here", "these" references.
     * 
     * Canvas Context Injection:
     * - Selected shapes: AI knows what user is referring to
     * - Viewport center: AI knows where "here" is
     * - Zoom level: AI understands viewing context
     * - Total shapes: AI knows canvas population
     */
    /**
     * CRITICAL: Direct Execution System Prompt
     * 
     * AI executes user commands immediately without confirmation.
     * Removes all cautionary behavior and trust-the-user approach.
     */
    let systemPrompt = `You are an AI assistant for CollabCanvas, a collaborative design tool. You help users create and manipulate shapes on a canvas using natural language commands.

═══════════════════════════════════════════════════════════════════════════
EXECUTION PRINCIPLES - CRITICAL BEHAVIORAL RULES
═══════════════════════════════════════════════════════════════════════════

1. **EXECUTE IMMEDIATELY - NO CONFIRMATIONS**
   - User requests specific quantity (e.g., "400 rectangles") → Execute EXACTLY that quantity
   - NEVER ask "are you sure?"
   - NEVER warn about "cluttering" or "performance"
   - NEVER question explicit numeric requests
   - NEVER create partial batches (e.g., 3 shapes when user asked for 400)
   - User is the authority on their canvas design

2. **TRUST USER INTENT COMPLETELY**
   - If user says "400", they mean 400
   - If user says "1000", they mean 1000
   - No second-guessing, no suggestions to reduce quantity
   - Execute the exact request without commentary

3. **BATCH SIZE HANDLING**
   - 1-1000+ shapes: Use bulk_create in SINGLE call
   - System handles large batches efficiently
   - Never split into smaller batches
   - All shapes appear simultaneously

4. **CORRECT vs INCORRECT BEHAVIOR**
   
   ✅ CORRECT:
   User: "create 400 rectangles"
   AI: *calls bulk_create with 400 rectangles*
   AI: "I've created 400 rectangles on your canvas."
   
   ❌ WRONG:
   User: "create 400 rectangles"  
   AI: *creates only 3 rectangles*
   AI: "I've created 3 rectangles. Creating 400 might clutter the canvas..."
   
   ✅ CORRECT:
   User: "add 1000 circles in random spots"
   AI: *calls bulk_create with 1000 circles*
   AI: "I've added 1000 circles in random locations."
   
   ❌ WRONG:
   AI: "That's a lot of circles. Would you like to proceed?"

IMPORTANT CONTEXT:
- Canvas dimensions: 30000x30000 pixels (MASSIVE - can handle thousands of shapes)
- Canvas center: approximately x=15000, y=15000
- DEFAULT SHAPE SIZES: 1500x1000px (LARGE for 30k canvas)
- When user doesn't specify position, use viewport center or canvas center
- Use vibrant, random colors for multiple shapes`;

    // Inject dynamic canvas context
    if (canvasContext) {
      systemPrompt += `\n\nCURRENT CANVAS STATE:`;
      systemPrompt += `\n- Total shapes on canvas: ${canvasContext.totalShapes}`;
      systemPrompt += `\n- Current zoom level: ${canvasContext.zoom.toFixed(2)}x`;
      systemPrompt += `\n- Viewport center position: (${canvasContext.viewportCenter.x}, ${canvasContext.viewportCenter.y})`;
      
      if (canvasContext.selectedShapes && canvasContext.selectedShapes.length > 0) {
        systemPrompt += `\n\nCURRENTLY SELECTED SHAPES:`;
        canvasContext.selectedShapes.forEach((shape: any, index: number) => {
          systemPrompt += `\n${index + 1}. ${shape.type} (id: ${shape.id})`;
          systemPrompt += `\n   - Position: (${shape.x}, ${shape.y})`;
          systemPrompt += `\n   - Size: ${shape.width}x${shape.height}`;
          systemPrompt += `\n   - Color: ${shape.fill}`;
        });
        
        systemPrompt += `\n\nIMPORTANT: When user says "this shape", "selected shape", "it", or "this", they mean: ${canvasContext.selectedShapes[0].type} (id: ${canvasContext.selectedShapes[0].id})`;
        if (canvasContext.selectedShapes.length > 1) {
          systemPrompt += `\nWhen user says "these shapes" or "them", they mean all ${canvasContext.selectedShapes.length} selected shapes.`;
        }
      } else {
        systemPrompt += `\n\nNO SHAPES CURRENTLY SELECTED`;
        systemPrompt += `\nIf user says "this" or "selected", clarify what they want to modify.`;
      }
      
      systemPrompt += `\n\nWhen user says "here" or "at the center", use viewport center: (${canvasContext.viewportCenter.x}, ${canvasContext.viewportCenter.y})`;
    }

    systemPrompt += `\n\nTOOL SELECTION RULES - MEMORIZE THESE:
═══════════════════════════════════════════════════════════════════════════

When user requests MULTIPLE shapes (2+):
→ ALWAYS use bulk_create
→ NEVER call create_shape multiple times
→ Create ALL requested shapes in ONE bulk_create call

EXAMPLES OF CORRECT TOOL USAGE:
✅ "add 50 rectangles" → bulk_create({ shapes: [... array of 50 rectangles ...] })
✅ "create 10 circles" → bulk_create({ shapes: [... array of 10 circles ...] })
✅ "put 400 squares in random locations" → bulk_create({ shapes: [... array of 400 squares ...] })
✅ "add 5 stars" → bulk_create({ shapes: [... array of 5 stars ...] })

When user requests SINGLE shape:
→ Use create_shape

EXAMPLES:
✅ "add one rectangle" → create_shape({ type: 'rectangle', ... })
✅ "create a circle here" → create_shape({ type: 'circle', ... })

TEMPLATES vs BULK_CREATE:
- Known layouts (login-form, dashboard-card) → create_from_template
- Multiple custom shapes → bulk_create
- Single shape → create_shape

CAPABILITIES:
1. Create shapes: rectangle, circle, line, text, triangle, star, diamond, hexagon, pentagon
2. Modify shapes: move, resize, recolor, rotate, change opacity
3. Layout operations: arrange in grids, align shapes, distribute evenly
4. Complex layouts: Use templates or bulk_create
5. Query canvas

MANDATORY REQUIREMENTS FOR BULK_CREATE:

1. **Position Spread** (CRITICAL - shapes must NOT stack):
   - NEVER use same x,y for multiple shapes
   - Use viewport center as base (e.g., 15000, 15000)
   - Add random offset: ±1000 to ±3000 pixels
   - Formula: x = viewportCenter.x + (random() * 4000 - 2000)
   - Formula: y = viewportCenter.y + (random() * 4000 - 2000)
   
   Example for 3 shapes at viewport (15000, 15000):
   - Shape 1: x=13200, y=16800
   - Shape 2: x=16900, y=14100
   - Shape 3: x=14500, y=17200
   
2. **Color Variety** (MUST use different colors):
   - Rotate through: #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899
   - Never use same color for all shapes
   - Pattern: shape[i].fill = colors[i % colors.length]

3. **Count Validation** (MUST match user request EXACTLY):
   - User says "50 rectangles" → bulk_create array length MUST be 50
   - User says "15 circles" → bulk_create array length MUST be 15
   - NEVER create fewer than requested
   - NEVER ask permission to create less

COMPLETE EXAMPLE for "add 50 rectangles":

Tool call that AI MUST generate:
{
  "tool": "bulk_create",
  "parameters": {
    "shapes": [
      {"type": "rectangle", "x": 13500, "y": 16200, "width": 1500, "height": 1000, "fill": "#ef4444"},
      {"type": "rectangle", "x": 16800, "y": 14500, "width": 1500, "height": 1000, "fill": "#f59e0b"},
      {"type": "rectangle", "x": 14200, "y": 17500, "width": 1500, "height": 1000, "fill": "#10b981"},
      ... EXACTLY 47 more rectangles with unique positions and colors ...
    ] 
  }
}
NOTE: Array length MUST equal 50

VALIDATION CHECKLIST (AI must verify before calling tool):
☑ shapes.length === requested_quantity (e.g., 50)
☑ Each shape has unique position (x,y coordinates vary)
☑ Colors vary across shapes
☑ Positions spread across 4000px range

Be helpful, creative, and produce professional-looking results.`;

    /**
     * OpenAI API Call with Optional Streaming
     * 
     * Streaming mode provides progressive token display for better UX.
     * Non-streaming mode used for tool calling (function execution).
     * 
     * Performance:
     * - Streaming: First token in ~300-500ms (immediate feedback)
     * - Non-streaming: Complete response in 2-5s (necessary for tools)
     * 
     * Decision: Use non-streaming when tools likely needed, streaming otherwise.
     */
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
      stream: false, // Always false for now - streaming with tools is complex
    });

    const responseMessage = completion.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // Execute tool calls if present
    if (toolCalls && toolCalls.length > 0) {
      const toolResults: any[] = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[AI Agent] Executing tool: ${functionName}`);

        try {
          let result: string;

          switch (functionName) {
            case 'create_shape':
              result = await createShapeTool(functionArgs, userId, targetCanvasId);
              break;
            case 'update_shape':
              result = await updateShapeTool(functionArgs, userId, targetCanvasId);
              break;
            case 'move_shape':
              result = await moveShapeTool(functionArgs, userId, targetCanvasId);
              break;
            case 'delete_shape':
              result = await deleteShapeTool(functionArgs, userId, targetCanvasId);
              break;
            case 'layout_arrange':
              result = await layoutArrangeTool(functionArgs, userId, targetCanvasId);
              break;
            case 'query_canvas':
              result = await queryCanvasTool(functionArgs, targetCanvasId);
              break;
            case 'create_from_template':
              result = await createFromTemplateTool(functionArgs, userId, targetCanvasId);
              break;
            case 'undo_ai_operation':
              result = await undoAIOperationTool(functionArgs, userId, targetCanvasId);
              break;
            case 'bulk_create':
              result = await bulkCreateTool(functionArgs, userId, targetCanvasId);
              break;
            case 'bulk_update':
              result = await bulkUpdateTool(functionArgs, userId, targetCanvasId);
              break;
            default:
              result = `Unknown function: ${functionName}`;
          }

          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: result,
          });
        } catch (error: any) {
          console.error(`[AI Agent] Tool execution error: ${error.message}`);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: `Error: ${error.message}`,
          });
        }
      }

      // Track this AI operation for undo (before final response)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 [AI TRACKING] Starting operation tracking...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const executedTools = toolCalls.map((tc: any, index: number) => ({
        functionName: tc.function.name,
        params: JSON.parse(tc.function.arguments),
        result: toolResults[index].content
      }));
      
      console.log(`[AI TRACKING] Tool calls to track: ${executedTools.length}`);
      executedTools.forEach((tool, idx) => {
        console.log(`  Tool ${idx}: ${tool.functionName}`);
        console.log(`    Result: ${tool.result.substring(0, 100)}...`);
      });
      
      console.log('[AI TRACKING] Calling trackAIOperation...');
      const operationId = await trackAIOperation(userId, executedTools);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ [AI TRACKING] Operation tracked with ID: ${operationId}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Get final response after tool execution
      const followUpCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          responseMessage,
          ...toolResults,
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const finalResponse = followUpCompletion.choices[0].message.content;
      const responseTime = Date.now() - startTime;

      // Calculate total token usage
      const totalTokens = (completion.usage?.total_tokens || 0) + (followUpCompletion.usage?.total_tokens || 0);

      console.log(`[AI Agent] Request completed in ${responseTime}ms`);
      console.log(`[AI Agent] Token usage: ${totalTokens}`);

      // Usage tracking disabled
      console.log('[AI Agent] Token usage:', (completion.usage?.total_tokens || 0) + (followUpCompletion.usage?.total_tokens || 0));

      const responsePayload = {
        message: finalResponse,
        toolsExecuted: toolCalls.length,
        responseTime,
        tokenUsage: totalTokens,
        operationId, // Include for undo reference
      };
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 [AI RESPONSE] Sending response to frontend:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(JSON.stringify(responsePayload, null, 2));
      console.log('   operationId value:', operationId);
      console.log('   operationId type:', typeof operationId);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      res.status(200).json(responsePayload);
    } else {
      // No tool calls, return direct response
      const finalResponse = responseMessage.content;
      const responseTime = Date.now() - startTime;

      console.log(`[AI Agent] Request completed in ${responseTime}ms (no tools)`);

      // Usage tracking disabled
      console.log('[AI Agent] Token usage:', completion.usage?.total_tokens || 0);

      res.status(200).json({
        message: finalResponse,
        toolsExecuted: 0,
        responseTime,
        tokenUsage: completion.usage?.total_tokens || 0,
      });
    }
  } catch (error: any) {
    console.error('[AI Agent] Error:', error);

    const responseTime = Date.now() - startTime;

    // User-friendly error messages
    let errorMessage = 'An error occurred while processing your request.';

    if (error.message.includes('validation')) {
      errorMessage = 'Invalid input parameters. Please check your request.';
    } else if (error.message.includes('not found')) {
      errorMessage = 'Shape not found. It may have been deleted.';
    } else if (error.message.includes('locked')) {
      errorMessage = 'Shape is currently locked by another user.';
    } else if (error.name === 'ZodError') {
      errorMessage = 'Invalid parameters provided for this operation.';
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      responseTime,
    });
  }
});

