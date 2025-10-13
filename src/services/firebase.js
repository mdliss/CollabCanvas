import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Fail fast if required env vars are missing
const projectId = import.meta.env.VITE_FB_PROJECT_ID;
const dbUrl = import.meta.env.VITE_FB_DB_URL;

if (!projectId || !dbUrl) {
  console.error("[firebase] FATAL: Missing required environment variables!");
  console.error("[firebase] VITE_FB_PROJECT_ID:", projectId || "MISSING");
  console.error("[firebase] VITE_FB_DB_URL:", dbUrl || "MISSING");
  throw new Error("Firebase configuration incomplete. Check .env file.");
}

if (!dbUrl || !/^https:\/\/.+(firebaseio|firebasedatabase)\.com|app\/?$/.test(dbUrl)) {
  console.error("[firebase] FATAL: Malformed VITE_FB_DB_URL:", dbUrl);
  throw new Error("VITE_FB_DB_URL must be a valid Firebase RTDB URL");
}

const app = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FB_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  databaseURL: dbUrl
});

console.info("[rtdb] url:", dbUrl);
console.log("[firebase] project:", projectId);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
