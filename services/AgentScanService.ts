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
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const AGENT_COLLECTION = "agentsScan";

/**
 * Crée un nouvel agent de scannage
 */
export const createAgentSan = async (agentData: {
  uid: string;
  eventId: string;
  categorie: string;
  state: string;
}) => {
  try {
    const docRef = await addDoc(collection(db, AGENT_COLLECTION), agentData);
    return { id: docRef.id, ...agentData };
  } catch (error) {
    console.error("Erreur lors de la création de l’agent :", error);
    throw error;
  }
};

/**
 * Récupère tous les agents ou filtre par eventId
 */
export const getAgentsSan = async (eventId?: string): Promise<any> => {
  try {

    let col = collection(db, AGENT_COLLECTION);
    const q = query(col, where("eventId", "==", eventId));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch  {
  }
};

export const getAgentsSanByEventId = async (uid:string,eventId?: string): Promise<any> => {
  try {

    let col = collection(db, AGENT_COLLECTION);
    const q = query(col, where("eventId", "==", eventId), where("uid", "==", uid));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur lors de la récupération des agents :", error);
    throw error;
  }
};

/**
 * Récupère un agent spécifique par son ID
 */
export const getAgentSanById = async (id: string) => {
  try {
    const docRef = doc(db, AGENT_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error("Erreur lors de la récupération de l’agent :", error);
    throw error;
  }
};

/**
 * Met à jour un agent existant
 */
export const updateAgentSan = async (id: string, updates: Partial<{
  uid: string;
  eventId: string;
  categorie: string;
  state: string;
}>) => {
  try {
    const docRef = doc(db, AGENT_COLLECTION, id);
    await updateDoc(docRef, updates);
    return true;
  } catch  {

  }
};

/**
 * Supprime un agent
 */
export const deleteAgentSan = async (id: string) => {
  try {
    const docRef = doc(db, AGENT_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de l’agent :", error);
    throw error;
  }
};
