import { db } from "@/services/firebaseConfig"; // adjust this path to your firebase config
import { Telechargement } from "@/type/type";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";


const COLLECTION_NAME = "telechargements";

// ✅ Helper to generate a unique FACT ID like FACT-2025-001
const generateUniqueFactId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const ref = collection(db, COLLECTION_NAME);

  // Find the last created factId for the current year
  const q = query(ref, where("factId", ">=", `FACT-${year}-`), orderBy("factId", "desc"), limit(1));
  const snapshot = await getDocs(q);

  let nextNumber = 1;
  if (!snapshot.empty) {
    const lastFactId = snapshot.docs[0].data().factId as string;
    const lastNumber = parseInt(lastFactId.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  // Pad number to always be 3 digits
  const padded = nextNumber.toString().padStart(3, "0");
  return `FACT-${year}-${padded}`;
};

// ✅ Create a new download (auto-generate unique factId)
export const createTelechargement = async (data:Telechargement) => {
  const ref = collection(db, COLLECTION_NAME);

  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id, ...data};
};

// ✅ Get all downloads
export const getAllTelechargements = async (): Promise<Telechargement[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Telechargement));
};

// ✅ Get downloads by user
export const getTelechargementsByUid = async (uid: string): Promise<Telechargement[]> => {
  const q = query(collection(db, COLLECTION_NAME), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Telechargement));
};

// ✅ Get download by user and song ID
export const getTelechargementByUidAndSongId = async (
  uid: string,
  songId: string
): Promise<Telechargement | null> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("uid", "==", uid),
    where("songId", "==", songId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Telechargement;
};

// ✅ Get a single download by ID
export const getTelechargementById = async (id: string): Promise<Telechargement | null> => {
  const ref = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Telechargement;
};

// ✅ Update a download
export const updateTelechargement = async (id: string, data: Partial<Telechargement>) => {
  const ref = doc(db, COLLECTION_NAME, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ✅ Delete a download
export const deleteTelechargement = async (id: string) => {
  const ref = doc(db, COLLECTION_NAME, id);
  await deleteDoc(ref);
};
