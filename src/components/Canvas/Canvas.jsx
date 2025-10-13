import { Stage, Layer, Rect } from "react-konva";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { watchShapes, createRect, moveShape, lockShape, unlockShape } from "../../services/canvas";

const CANVAS_W = 5000, CANVAS_H = 5000;

export default function Canvas() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState([]);
  const scaleRef = useRef(1);
  const stageRef = useRef(null);

  useEffect(() => watchShapes(setShapes), []);

  const onWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = scaleRef.current;
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clamped = Math.max(0.2, Math.min(3, newScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    };
    scaleRef.current = clamped;
    stage.scale({ x: clamped, y: clamped });

    const newPos = {
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped
    };
    stage.position(newPos);
    stage.batchDraw();
  };

  const onStageDragMove = (e) => {
    // optional: clamp stage within bounds
    const s = e.target;
    const scale = scaleRef.current;
    const maxX = 0;
    const maxY = 0;
    const minX = -(CANVAS_W * scale - window.innerWidth);
    const minY = -(CANVAS_H * scale - window.innerHeight);
    const nx = Math.max(Math.min(s.x(), maxX), isFinite(minX) ? minX : s.x());
    const ny = Math.max(Math.min(s.y(), maxY), isFinite(minY) ? minY : s.y());
    s.position({ x: nx, y: ny });
  };

  return (
    <div style={{ padding: 8 }}>
      <button onClick={() => createRect({})}>Add Rectangle</button>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable
        onDragMove={onStageDragMove}
        onWheel={onWheel}
        scaleX={scaleRef.current}
        scaleY={scaleRef.current}
      >
        <Layer>
          {/* background bounds (optional visual) */}
          <Rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#f8f8f8" />
          {shapes.map(s => (
            <Rect
              key={s.id}
              x={s.x} y={s.y}
              width={s.w} height={s.h}
              rotation={s.rot || 0}
              fill={s.fill}
              stroke={s.lockedBy && s.lockedBy !== user?.uid ? "red" : undefined}
              strokeWidth={s.lockedBy && s.lockedBy !== user?.uid ? 2 : 0}
              draggable={s.lockedBy === null || s.lockedBy === user?.uid}
              onDragStart={() => lockShape(s.id, user?.uid || "anon")}
              onDragMove={(e) => moveShape(s.id, e.target.x(), e.target.y())}
              onDragEnd={() => unlockShape(s.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
