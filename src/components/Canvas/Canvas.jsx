import { Stage, Layer, Rect } from "react-konva";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { watchShapes, createRect, moveShape, lockShape, unlockShape } from "../../services/canvas";

const W = 5000, H = 5000;

export default function Canvas() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState([]);
  const scaleRef = useRef(1);
  const stageRef = useRef(null);

  useEffect(() => watchShapes(setShapes), []);

  const onWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const old = scaleRef.current;
    const by = 1.05;
    const next = e.evt.deltaY > 0 ? old/by : old*by;
    const s = Math.max(0.2, Math.min(3, next));
    const p = stage.getPointerPosition();
    const pt = { x:(p.x - stage.x())/old, y:(p.y - stage.y())/old };
    scaleRef.current = s;
    stage.scale({ x:s, y:s });
    stage.position({ x:p.x - pt.x*s, y:p.y - pt.y*s });
    stage.batchDraw();
  };

  const clampDrag = (e) => {
    const s = e.target, z = scaleRef.current;
    const max = { x:0, y:0 };
    const min = { x:-(W*z - window.innerWidth), y:-(H*z - window.innerHeight) };
    s.position({ x: Math.max(Math.min(s.x(), max.x), isFinite(min.x)?min.x:s.x()),
                 y: Math.max(Math.min(s.y(), max.y), isFinite(min.y)?min.y:s.y()) });
  };

  return (
    <div style={{ padding: 8 }}>
      <button onClick={() => createRect({})}>Add Rectangle</button>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable
        onDragMove={clampDrag}
        onWheel={onWheel}
        scaleX={scaleRef.current}
        scaleY={scaleRef.current}
      >
        <Layer>
          <Rect x={0} y={0} width={W} height={H} fill="#f8f8f8" />
          {shapes.map(s => (
            <Rect
              key={s.id}
              x={s.x} y={s.y} width={s.w} height={s.h}
              rotation={s.rot || 0} fill={s.fill}
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
