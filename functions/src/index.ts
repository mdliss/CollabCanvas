import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAI } from 'openai';
import { z } from 'zod';

// Initialize Firebase Admin
admin.initializeApp();
const rtdb = admin.database();

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

async function getShapes(): Promise<any[]> {
  const snapshot = await rtdb.ref(`canvas/${CANVAS_ID}/shapes`).once('value');
  const shapesMap = snapshot.val() || {};
  return Object.values(shapesMap).sort(
    (a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0)
  );
}

async function getMaxZIndex(): Promise<number> {
  const shapes = await getShapes();
  return shapes.reduce((max, s: any) => Math.max(max, s.zIndex || 0), 0);
}

// Tool implementations
async function createShapeTool(params: any, userId: string): Promise<string> {
  const validated = CreateShapeSchema.parse(params);
  const shapeId = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const maxZ = await getMaxZIndex();

  const shape: any = {
    id: shapeId,
    type: validated.type,
    x: validated.x,
    y: validated.y,
    width: validated.width || (validated.type === 'text' ? 200 : 100),
    height: validated.height || (validated.type === 'text' ? 30 : 100),
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

  if (validated.type === 'text') {
    shape.text = sanitizeText(validated.text || 'Text');
    shape.fontSize = validated.fontSize || 24;
  }

  await rtdb.ref(`canvas/${CANVAS_ID}/shapes/${shapeId}`).set(shape);
  await rtdb.ref(`canvas/${CANVAS_ID}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Created ${validated.type} shape: ${shapeId}`);
  return `Successfully created ${validated.type} at (${validated.x}, ${validated.y})`;
}

async function updateShapeTool(params: any, userId: string): Promise<string> {
  const validated = UpdateShapeSchema.parse(params);
  const { shapeId, ...updates } = validated;

  const shapeRef = rtdb.ref(`canvas/${CANVAS_ID}/shapes/${shapeId}`);
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
  await rtdb.ref(`canvas/${CANVAS_ID}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Updated shape: ${shapeId}`);
  return `Successfully updated shape`;
}

async function moveShapeTool(params: any, userId: string): Promise<string> {
  const validated = MoveShapeSchema.parse(params);
  const { shapeId, x, y } = validated;

  const shapeRef = rtdb.ref(`canvas/${CANVAS_ID}/shapes/${shapeId}`);
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

  await rtdb.ref(`canvas/${CANVAS_ID}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Moved shape ${shapeId} to (${x}, ${y})`);
  return `Successfully moved shape to (${x}, ${y})`;
}

async function deleteShapeTool(params: any, userId: string): Promise<string> {
  const validated = DeleteShapeSchema.parse(params);
  const shapeIds = Array.isArray(validated.shapeIds)
    ? validated.shapeIds
    : [validated.shapeIds];

  for (const shapeId of shapeIds) {
    await rtdb.ref(`canvas/${CANVAS_ID}/shapes/${shapeId}`).remove();
  }

  await rtdb.ref(`canvas/${CANVAS_ID}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Deleted ${shapeIds.length} shape(s)`);
  return `Successfully deleted ${shapeIds.length} shape(s)`;
}

async function layoutArrangeTool(params: any, userId: string): Promise<string> {
  const validated = LayoutArrangeSchema.parse(params);
  const { shapeIds, arrangement, spacing = 50 } = validated;

  const shapes = await getShapes();
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
    await rtdb.ref(`canvas/${CANVAS_ID}/shapes/${update.shapeId}`).update({
      x: update.x,
      y: update.y,
      lastModifiedBy: userId,
      lastModifiedAt: Date.now(),
    });
  }

  await rtdb.ref(`canvas/${CANVAS_ID}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Arranged ${updates.length} shapes in ${arrangement} layout`);
  return `Successfully arranged ${updates.length} shapes in ${arrangement} layout`;
}

async function queryCanvasTool(params: any): Promise<string> {
  const shapes = await getShapes();

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

async function bulkCreateTool(params: any, userId: string): Promise<string> {
  const validated = BulkCreateSchema.parse(params);
  const maxZ = await getMaxZIndex();

  let currentZ = maxZ;
  const createdIds: string[] = [];

  for (const shapeParams of validated.shapes) {
    const shapeId = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentZ++;

    const shape: any = {
      id: shapeId,
      type: shapeParams.type,
      x: shapeParams.x,
      y: shapeParams.y,
      width: shapeParams.width || (shapeParams.type === 'text' ? 200 : 100),
      height: shapeParams.height || (shapeParams.type === 'text' ? 30 : 100),
      fill: shapeParams.fill || (shapeParams.type === 'text' ? '#000000' : '#cccccc'),
      zIndex: currentZ,
      createdBy: userId,
      createdAt: Date.now(),
      lastModifiedBy: userId,
      lastModifiedAt: Date.now(),
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
    };

    if (shapeParams.type === 'text') {
      shape.text = sanitizeText(shapeParams.text || 'Text');
      shape.fontSize = shapeParams.fontSize || 24;
    }

    await rtdb.ref(`canvas/${CANVAS_ID}/shapes/${shapeId}`).set(shape);
    createdIds.push(shapeId);
  }

  await rtdb.ref(`canvas/${CANVAS_ID}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Bulk created ${createdIds.length} shapes`);
  return `Successfully created ${createdIds.length} shapes`;
}

async function bulkUpdateTool(params: any, userId: string): Promise<string> {
  const validated = BulkUpdateSchema.parse(params);
  let updateCount = 0;

  for (const updateParams of validated.updates) {
    const { shapeId, ...updates } = updateParams;

    const shapeRef = rtdb.ref(`canvas/${CANVAS_ID}/shapes/${shapeId}`);
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

  await rtdb.ref(`canvas/${CANVAS_ID}/metadata/lastUpdated`).set(Date.now());

  console.log(`[AI Tool] Bulk updated ${updateCount} shapes`);
  return `Successfully updated ${updateCount} shapes`;
}

// Main AI Canvas Agent Function
export const aiCanvasAgent = functions.https.onRequest(async (req, res) => {
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
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid request: messages array required' });
      return;
    }

    console.log(`[AI Agent] Processing request for user ${userId}, messages: ${messages.length}`);

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
          name: 'bulk_create',
          description: 'Create multiple shapes at once for complex layouts (e.g., login forms, navigation bars, dashboards).',
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
    const systemPrompt = `You are an AI assistant for CollabCanvas, a collaborative design tool. You help users create and manipulate shapes on a canvas using natural language commands.

IMPORTANT CONTEXT:
- Canvas dimensions: 30000x30000 pixels
- Canvas center (good default position): approximately x=15000, y=15000
- When user doesn't specify position, place shapes near canvas center (15000, 15000)
- Always use appropriate sizes: small shapes (50-100px), medium (100-200px), large (200-500px)
- Use vibrant, appropriate colors for elements

CAPABILITIES:
1. Create shapes: rectangle, circle, line, text, triangle, star, diamond, hexagon, pentagon
2. Modify shapes: move, resize, recolor, rotate, change opacity
3. Layout operations: arrange in grids, align shapes, distribute evenly
4. Complex multi-element layouts: forms, navigation bars, cards, dashboards
5. Query canvas to see what shapes exist

BEST PRACTICES:
- For complex layouts (forms, dashboards), use bulk_create for better performance
- Use appropriate colors and sizes based on element purpose
- Position elements with logical spacing and hierarchy
- For text elements, use readable font sizes (18-32px for headers, 14-18px for body)
- When creating UI components, follow standard design patterns

EXAMPLES OF COMPLEX COMMANDS:
- "Create a login form" → Title text, username field, password field, submit button
- "Make a navigation bar" → Header rectangle with multiple text labels
- "Build a product card" → Image placeholder, title, description, price, button

Be helpful, creative, and produce professional-looking results.`;

    // Make OpenAI API call with streaming
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
              result = await createShapeTool(functionArgs, userId);
              break;
            case 'update_shape':
              result = await updateShapeTool(functionArgs, userId);
              break;
            case 'move_shape':
              result = await moveShapeTool(functionArgs, userId);
              break;
            case 'delete_shape':
              result = await deleteShapeTool(functionArgs, userId);
              break;
            case 'layout_arrange':
              result = await layoutArrangeTool(functionArgs, userId);
              break;
            case 'query_canvas':
              result = await queryCanvasTool(functionArgs);
              break;
            case 'bulk_create':
              result = await bulkCreateTool(functionArgs, userId);
              break;
            case 'bulk_update':
              result = await bulkUpdateTool(functionArgs, userId);
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

      console.log(`[AI Agent] Request completed in ${responseTime}ms`);
      console.log(`[AI Agent] Token usage: ${completion.usage?.total_tokens || 0}`);

      res.status(200).json({
        message: finalResponse,
        toolsExecuted: toolCalls.length,
        responseTime,
        tokenUsage: completion.usage?.total_tokens || 0,
      });
    } else {
      // No tool calls, return direct response
      const finalResponse = responseMessage.content;
      const responseTime = Date.now() - startTime;

      console.log(`[AI Agent] Request completed in ${responseTime}ms (no tools)`);

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

