# CollabCanvas Keyboard Shortcuts

## Quick Reference Guide

CollabCanvas supports extensive keyboard shortcuts for power users. Press **`?`** to toggle this help menu.

---

## Essential Commands

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + Z` | Undo | Undo last operation |
| `Cmd/Ctrl + Shift + Z` | Redo | Redo previously undone operation |
| `Delete` or `Backspace` | Delete | Delete selected shapes |
| `Cmd/Ctrl + D` | Duplicate | Duplicate selected shapes |
| `Cmd/Ctrl + A` | Select All | Select all shapes on canvas |
| `Escape` | Deselect | Clear all selections |

---

## Selection & Multi-Select

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Click` | Select | Select single shape |
| `Shift + Click` | Multi-Select | Add shape to selection (toggle) |
| `Drag` | Marquee Select | Drag on canvas to select multiple shapes |
| `Cmd/Ctrl + A` | Select All | Select every shape on canvas |
| `Escape` | Clear Selection | Deselect all shapes |

---

## Clipboard Operations

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + C` | Copy | Copy selected shapes to clipboard |
| `Cmd/Ctrl + X` | Cut | Cut selected shapes to clipboard |
| `Cmd/Ctrl + V` | Paste | Paste shapes from clipboard |

---

## Layer / Z-Index Control

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + Shift + ]` | Bring to Front | Move selected shapes to top layer |
| `Cmd/Ctrl + Shift + [` | Send to Back | Move selected shapes to bottom layer |
| `Cmd/Ctrl + ]` | Bring Forward | Move selected shapes up one layer |
| `Cmd/Ctrl + [` | Send Backward | Move selected shapes down one layer |

---

## Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `0` or `Home` | Center View | Center canvas in viewport |
| `Mouse Wheel` | Zoom | Zoom in/out at cursor position |
| `Space + Drag` | Pan | Pan/move canvas view |
| `Middle Mouse + Drag` | Pan | Alternative pan method |

---

## Shape Creation

| Action | Method | Description |
|--------|--------|-------------|
| Rectangle | Toolbar Button | Click rectangle icon in toolbar |
| Circle | Toolbar Button | Click circle icon in toolbar |
| Triangle | Toolbar Button | Click triangle icon in toolbar |
| Star | Toolbar Button | Click star icon in toolbar |
| Diamond | Toolbar Button | Click diamond icon in toolbar |
| Text | Toolbar Button | Click T icon to create text |
| Line | Toolbar Button | Click line icon in toolbar |

---

## Text Editing (When Text Selected)

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Double Click` | Edit Text | Enter text editing mode |
| `Cmd/Ctrl + B` | Bold | Toggle bold formatting |
| `Cmd/Ctrl + I` | Italic | Toggle italic formatting |
| `Cmd/Ctrl + U` | Underline | Toggle underline |
| `Enter` or `Escape` | Finish Editing | Exit text editing mode |

---

## Transform Operations

| Action | Method | Description |
|--------|--------|-------------|
| Move | Drag | Click and drag to move shape |
| Resize | Drag Corner Handle | Drag transformer corner to resize |
| Rotate | Drag Rotation Handle | Drag rotation handle (top-middle) |
| Proportional Resize | Shift + Drag Corner | Maintain aspect ratio while resizing |

---

## Advanced Features

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + /` | Performance Monitor | Toggle performance metrics overlay |
| `L` | Layers Panel | Toggle layers panel |
| `H` | History Timeline | Toggle undo/redo timeline |
| `?` | Help Menu | Toggle keyboard shortcuts help |

---

## Tips & Tricks

### Power User Workflow

**Fast Shape Creation:**
```
1. Click shape type in toolbar
2. Click canvas to place
3. Immediately drag to reposition
4. Release to finalize
```

**Multi-Select Techniques:**
```
Method 1: Shift-click each shape individually
Method 2: Drag marquee box around shapes
Method 3: Cmd/Ctrl+A to select all, then Shift-click to deselect unwanted
```

**Layer Management:**
```
Quick bring to front: Cmd/Ctrl+Shift+]
Quick send to back: Cmd/Ctrl+Shift+[
Fine-tune: Cmd/Ctrl+] or Cmd/Ctrl+[ to nudge one layer
```

**Efficient Editing:**
```
1. Select shape
2. Make changes (color, transform, etc.)
3. Cmd+D to duplicate with same styling
4. Drag to reposition duplicate
```

### Navigation Pro Tips

**Quick Zoom:**
- Scroll up: Zoom in at cursor
- Scroll down: Zoom out at cursor
- Pro tip: Center cursor on area of interest before zooming

**Quick Pan:**
- Hold Space, drag canvas
- OR middle-mouse drag
- Pro tip: Use space+drag for precision, middle-mouse for speed

**Reset View:**
- Press `0` or `Home` to instantly center view
- Auto-centers on login and reconnection

---

## Context-Sensitive Shortcuts

### When Shape Selected

- `Delete/Backspace`: Delete shape
- `Cmd/Ctrl+D`: Duplicate
- `Cmd/Ctrl+C`: Copy
- `Cmd/Ctrl+X`: Cut
- Arrow keys: (Future) Nudge position

### When Text Shape Selected

- `Double-click`: Enter edit mode
- All text formatting shortcuts active
- Color picker affects text fill

### When Multiple Shapes Selected

- All operations apply to entire selection
- Layer operations affect all selected shapes
- Transform operations affect all shapes as group

---

## Accessibility

### Mouse-Free Navigation

While CollabCanvas is optimized for mouse/trackpad use, many operations can be performed keyboard-only:

1. `Tab`: Cycle through shapes (Future enhancement)
2. `Cmd/Ctrl+A`: Select all
3. `Cmd/Ctrl+Z`: Undo changes
4. `Cmd/Ctrl+D`: Duplicate
5. `Delete`: Remove shapes
6. `0`: Center view

### Screen Reader Support

Currently limited screen reader support. Future enhancements planned:
- ARIA labels on all interactive elements
- Keyboard-only shape creation
- Announced state changes

---

## Troubleshooting

### Shortcut Not Working?

**Check:**
1. Is canvas focused? (Click canvas first)
2. Is text edit mode active? (Press Escape to exit)
3. Is browser capturing shortcut? (Some browsers intercept Cmd+W, etc.)
4. Is shape selected? (Some shortcuts require selection)

### Keyboard Shortcuts Disabled?

Shortcuts are disabled when:
- Modal dialog is open
- Text edit mode is active (except text formatting shortcuts)
- Input field has focus
- Help menu is open (except Escape/? to close)

---

## Platform Differences

### macOS
- Use `Cmd` (⌘) key for all shortcuts
- Example: `Cmd+Z` for undo

### Windows / Linux
- Use `Ctrl` key for all shortcuts
- Example: `Ctrl+Z` for undo

### Browser Compatibility

**Fully Supported:**
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

**Known Issues:**
- Safari may intercept some Cmd shortcuts (use browser settings to disable)
- Firefox may show warning on Cmd+Q (quit browser)

---

## Customization

Currently, keyboard shortcuts are hardcoded and cannot be customized. Future enhancement planned:
- User-definable shortcuts
- Multiple preset layouts (Photoshop, Figma, etc.)
- Import/export shortcut configurations

---

## Quick Shortcuts Cheat Sheet

```
ESSENTIALS:
  Cmd/Ctrl + Z        Undo
  Cmd/Ctrl + Shift + Z    Redo
  Cmd/Ctrl + D        Duplicate
  Delete              Delete
  Cmd/Ctrl + A        Select All
  Escape              Deselect

CLIPBOARD:
  Cmd/Ctrl + C        Copy
  Cmd/Ctrl + X        Cut
  Cmd/Ctrl + V        Paste

LAYERS:
  Cmd/Ctrl + Shift + ]    Bring to Front
  Cmd/Ctrl + Shift + [    Send to Back
  Cmd/Ctrl + ]            Bring Forward
  Cmd/Ctrl + [            Send Backward

NAVIGATION:
  0 or Home           Center View
  Scroll Wheel        Zoom
  Space + Drag        Pan
  
TEXT:
  Double Click        Edit
  Cmd/Ctrl + B        Bold
  Cmd/Ctrl + I        Italic
  Cmd/Ctrl + U        Underline
```

---

## In-App Help

Access this documentation:
1. Press **`?`** to open Help Menu
2. Click **Help** in top menu bar
3. Access at: [Your deployed URL]/help

---

**Last Updated:** October 16, 2025  
**Version:** 1.0  
**Maintained By:** CollabCanvas Team

