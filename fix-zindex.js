const fs = require('fs');

// Read the templates file
const templateFile = './src/utils/templates.js';
let content = fs.readFileSync(templateFile, 'utf8');

// Replace all zIndex: 0 with proper values based on shape type
// Text elements should have highest zIndex
content = content.replace(/type: 'text',\n([\s\S]*?)zIndex: 0/g, (match) => {
  return match.replace('zIndex: 0', 'zIndex: 10');
});

// Circles (usually decorative/icons) - medium zIndex
content = content.replace(/type: 'circle',\n([\s\S]*?)zIndex: 0/g, (match) => {
  return match.replace('zIndex: 0', 'zIndex: 5');
});

// Rectangles - check if it's a background or content
// We'll do this in multiple passes:
// 1. Large backgrounds (width > 8000 or height > 8000) - zIndex: 1
// 2. Medium containers - zIndex: 2  
// 3. Content boxes - zIndex: 3

// First pass: find rectangles
const lines = content.split('\n');
let inShape = false;
let shapeType = null;
let shapeWidth = 0;
let shapeHeight = 0;
let shapeZIndexLine = -1;
let result = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes("type: 'rectangle',") || line.includes('type: "rectangle",')) {
    inShape = true;
    shapeType = 'rectangle';
    shapeWidth = 0;
    shapeHeight = 0;
  } else if (line.includes("type: 'text',") || line.includes('type: "text",')) {
    inShape = true;
    shapeType = 'text';
  } else if (line.includes("type: 'circle',") || line.includes('type: "circle",')) {
    inShape = true;
    shapeType = 'circle';
  }
  
  if (inShape && shapeType === 'rectangle') {
    const widthMatch = line.match(/width:\s*(\d+)/);
    const heightMatch = line.match(/height:\s*(\d+)/);
    if (widthMatch) shapeWidth = parseInt(widthMatch[1]);
    if (heightMatch) shapeHeight = parseInt(heightMatch[1]);
    
    if (line.includes('zIndex:') && line.includes('0')) {
      // Determine zIndex based on size
      let newZIndex = 3; // Default for content
      if (shapeWidth >= 8000 || shapeHeight >= 8000) {
        newZIndex = 1; // Background
      } else if (shapeWidth >= 5000 || shapeHeight >= 5000) {
        newZIndex = 2; // Large container
      }
      lines[i] = line.replace(/zIndex:\s*0/, `zIndex: ${newZIndex}`);
      inShape = false;
    }
  } else if (inShape && shapeType === 'text') {
    if (line.includes('zIndex:') && line.includes('0')) {
      lines[i] = line.replace(/zIndex:\s*0/, 'zIndex: 10');
      inShape = false;
    }
  } else if (inShape && shapeType === 'circle') {
    if (line.includes('zIndex:') && line.includes('0')) {
      lines[i] = line.replace(/zIndex:\s*0/, 'zIndex: 5');
      inShape = false;
    }
  }
  
  if (line.includes('}') && line.trim() === '},' || line.trim() === '}') {
    inShape = false;
  }
}

content = lines.join('\n');

// Write back
fs.writeFileSync(templateFile, content, 'utf8');
console.log('Fixed zIndex values in templates.js');
