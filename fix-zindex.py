#!/usr/bin/env python3
import re

# Read the file
with open('src/utils/templates.js', 'r') as f:
    content = f.read()

# Split into shapes
shapes = content.split('    {')
fixed_shapes = [shapes[0]]  # Keep the beginning

for shape in shapes[1:]:
    # Check if this is a text shape
    if "type: 'text'" in shape or 'type: "text"' in shape:
        # Replace zIndex: 0 with zIndex: 10 for text
        shape = re.sub(r'zIndex: 0', 'zIndex: 10', shape)
    
    # Check if this is a circle
    elif "type: 'circle'" in shape or 'type: "circle"' in shape:
        # Replace zIndex: 0 with zIndex: 5 for circles
        shape = re.sub(r'zIndex: 0', 'zIndex: 5', shape)
    
    # Check if this is a rectangle - need to be smarter
    elif "type: 'rectangle'" in shape or 'type: "rectangle"' in shape:
        # Extract width and height
        width_match = re.search(r'width: (\d+)', shape)
        height_match = re.search(r'height: (\d+)', shape)
        
        if width_match and height_match:
            width = int(width_match.group(1))
            height = int(height_match.group(1))
            
            # Determine zIndex based on size
            if width >= 10000 or height >= 10000:
                # Very large background
                shape = re.sub(r'zIndex: 0', 'zIndex: 1', shape)
            elif width >= 8000 or height >= 8000:
                # Large background
                shape = re.sub(r'zIndex: 0', 'zIndex: 1', shape)
            elif width >= 5000 or height >= 5000:
                # Medium container
                shape = re.sub(r'zIndex: 0', 'zIndex: 2', shape)
            else:
                # Content box
                shape = re.sub(r'zIndex: 0', 'zIndex: 3', shape)
    
    fixed_shapes.append(shape)

# Join back
content = '    {'.join(fixed_shapes)

# Write back
with open('src/utils/templates.js', 'w') as f:
    f.write(content)

print("Fixed zIndex values!")
print("Text shapes: zIndex 10")
print("Circle shapes: zIndex 5")
print("Rectangle backgrounds (>=8000): zIndex 1")
print("Rectangle containers (>=5000): zIndex 2")
print("Rectangle content: zIndex 3")

