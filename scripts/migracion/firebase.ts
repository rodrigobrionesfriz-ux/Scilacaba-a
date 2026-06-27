import "dotenv/config"
import { initializeApp } from "firebase/app"
import { getAuth, signInAnonymously } from "firebase/auth"
import { doc, getDoc, getFirestore, type Firestore } from "firebase/firestore"
import { z } from "zod"

// Config web pública (cuaderno-de-campo-d2922), desde .env. Lectura vía login anónimo,
// igual que el monolito. No son credenciales admin.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

// Envelope común de los 3 docs: { payload (string JSON u objeto), _version }.
const docEnvelopeSchema = z.looseObject({
  payload: z.unknown(),
  _version: z.number().nullish(),
})

export type DocCrudo = {
  payload: unknown
  version: number | null
}

const leerDoc = async (db: Firestore, coleccion: string): Promise<DocCrudo> => {
  const snap = await getDoc(doc(db, coleccion, "main"))
  if (!snap.exists()) return { payload: null, version: null }
  const data = docEnvelopeSchema.parse(snap.data())
  const payload: unknown =
    typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload
  return { payload, version: data._version ?? null }
}

// Baja los 3 docs Firestore (sci/main, cuaderno/main, presupuesto/main).
export const fetchDocs = async () => {
  const app = initializeApp(firebaseConfig)
  await signInAnonymously(getAuth(app))
  const db = getFirestore(app)
  const [sci, cuaderno, presupuesto] = await Promise.all([
    leerDoc(db, "sci"),
    leerDoc(db, "cuaderno"),
    leerDoc(db, "presupuesto"),
  ])
  return { sci, cuaderno, presupuesto }
}
