import { db } from "./firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const col = collection(db, "canvases", "global-canvas-v1", "shapes");

export const watchShapes = (cb) =>
  onSnapshot(col, qs => cb(qs.docs.map(d => ({ id: d.id, ...d.data() }))));

export const createRect = (p = {}) =>
  addDoc(col, {
    type: "rect",
    x: 200, y: 200, w: 100, h: 100, rot: 0,
    fill: "#4A90E2",
    lockedBy: null,
    createdAt: serverTimestamp(),
    ...p
  });

export const moveShape   = (id, x, y)     => updateDoc(doc(col, id), { x, y });
export const resizeShape = (id, w, h)     => updateDoc(doc(col, id), { w, h });
export const rotateShape = (id, rot)      => updateDoc(doc(col, id), { rot });
export const removeShape = (id)           => deleteDoc(doc(col, id));
export const lockShape   = (id, uid)      => updateDoc(doc(col, id), { lockedBy: uid });
export const unlockShape = (id)           => updateDoc(doc(col, id), { lockedBy: null });
