import { db } from "@/services/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

// Collection Firestore
const abonnementCollection = collection(db, "abonnements");

export type Abonnement = {
  id?: string;
  uid: string;
  category: string;
  months: number;
  numero: string;
  startDate: string;
  endDate: string;
  createdAt?: any;
  updatedAt?: any;
  active: boolean;
};


/**
 * Génère un numéro d’abonnement unique
 */
const generateUniqueAbonnementNumber = async (): Promise<string> => {
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const number = `ABON-${datePart}-${randomId}`;

  const q = query(abonnementCollection, where("numero", "==", number));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return generateUniqueAbonnementNumber(); // rare collision

  return number;
};

/**
 * Crée ou met à jour un abonnement utilisateur
 */
export const createAbonnement = async (
  uid: string,
  category: string,
  months: number
): Promise<{ status: "created" | "updated"; numero: string }> => {
  if (!uid || !category || months < 1 || months > 12)
    throw new Error("Paramètres d’abonnement invalides");

  const now = new Date();
  const q = query(abonnementCollection, where("uid", "==", uid), where("category", "==", category));
  const snapshot = await getDocs(q);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(startDate.getMonth() + months);

  if (snapshot.empty) {
    const numero = await generateUniqueAbonnementNumber();
    await addDoc(abonnementCollection, {
      uid,
      category,
      months,
      numero,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: serverTimestamp(),
      active: false,
    });
    return { status: "created", numero };
  } else {
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    const end = new Date(data.endDate);
    if (end > now) throw new Error(`Un abonnement ${category} est encore actif.`);

    const ref = doc(db, "abonnements", docSnap.id);
    const numero = await generateUniqueAbonnementNumber();
    await updateDoc(ref, {
      months,
      numero,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      updatedAt: serverTimestamp(),
      active: false,
    });
    return { status: "updated", numero };
  }
};

/**
 * Vérifie si un utilisateur a un abonnement actif
 */
export const checkActiveAbonnement = async (uid: string, category: string): Promise<boolean> => {
  const q = query(abonnementCollection, where("uid", "==", uid), where("category", "==", category));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;

  const docData = snapshot.docs[0].data();
  const endDate = new Date(docData.endDate);
  return endDate > new Date() && docData.active;
};

/**
 * Récupère tous les abonnements d’un utilisateur
 */
export const getUserAbonnements = async (uid: string): Promise<Abonnement[]> => {
  const q = query(abonnementCollection, where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Abonnement) }));
};

/**
 * Récupère tous les abonnements (admin)
 */
export const getAllAbonnements = async (): Promise<Abonnement[]> => {
  const snapshot = await getDocs(abonnementCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Abonnement) }));
};

/**
 * Active un abonnement par son numéro
 */
export const activateAbonnementByNumero = async (numero: string): Promise<void> => {
  const q = query(abonnementCollection, where("numero", "==", numero));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error(`Aucun abonnement trouvé pour le numéro ${numero}`);
  const ref = doc(db, "abonnements", snapshot.docs[0].id);
  await updateDoc(ref, { active: true, updatedAt: serverTimestamp() });
};

/**
 * Désactive un abonnement par son numéro
 */
export const deactivateAbonnementByNumero = async (numero: string): Promise<void> => {
  const q = query(abonnementCollection, where("numero", "==", numero));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error(`Aucun abonnement trouvé pour le numéro ${numero}`);
  const ref = doc(db, "abonnements", snapshot.docs[0].id);
  await updateDoc(ref, { active: false, updatedAt: serverTimestamp() });
};

/**
 * Supprime un abonnement par son numéro
 */
export const deleteAbonnementByNumero = async (numero: string): Promise<void> => {
  const q = query(abonnementCollection, where("numero", "==", numero));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error(`Aucun abonnement trouvé pour le numéro ${numero}`);
  await deleteDoc(doc(db, "abonnements", snapshot.docs[0].id));
};
