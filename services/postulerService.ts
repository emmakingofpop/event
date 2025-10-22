// PostulerService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Postuler {
  id?: string;       // Firestore document ID
  uid: string;
  eventId: string;
  category: string;
  numero:string;
}

const postulerCollection = collection(db, 'postulers');

export const PostulerService = {

  /** CREATE a new postuler */
  createPostuler: async (data: Postuler): Promise<string> => {
    const docRef = await addDoc(postulerCollection, data);
    return docRef.id;
  },

  /** READ a single postuler by document ID */
  getPostulerById: async (id: string): Promise<Postuler | null> => {
    const docRef = doc(postulerCollection, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Postuler;
    } else {
      return null;
    }
  },

  /** READ all postulers */
  getAllPostulers: async (): Promise<Postuler[]> => {
    const snapshot = await getDocs(postulerCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Postuler));
  },

  // getall postulers with eventId
  getAllPostulersWithEventId: async (eventId: string): Promise<Postuler[]> => {
    const q = query(postulerCollection, where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Postuler));
  },

  /** READ postulers by user ID */
  getPostulersByUid: async (uid: string): Promise<Postuler[]> => {
    const q = query(postulerCollection, where('uid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Postuler));
  },

  
  /** READ postulers by numero ID */
  getPostulersByNumero: async (numero: string): Promise<Postuler[]> => {
    const q = query(postulerCollection, where('numero', '==', numero));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Postuler));
  },

  /** UPDATE a postuler by document ID */
  updatePostuler: async (id: string, data: Partial<Postuler>): Promise<void> => {
    const docRef = doc(postulerCollection, id);
    await updateDoc(docRef, data);
  },

  /** DELETE a postuler by document ID */
  deletePostuler: async (id: string): Promise<boolean> => {
    try {
      const docRef = doc(postulerCollection, id);
      await deleteDoc(docRef);
      return true
    } catch {
      return false
    }
  },
};
