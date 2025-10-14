import { db } from "@/services/firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

// Collection Firestore
const abonnementCollection = collection(db, "abonnements");

/**
 * Génère un numéro d’abonnement unique au format :
 * ABON-YYYYMMDD-XXXXXX
 */
const generateUniqueAbonnementNumber = async (): Promise<string> => {
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ""); // YYYYMMDD

  const number = `ABON-${datePart}-${randomId}`;

  // Vérifie que ce numéro n'existe pas déjà (sécurité)
  const q = query(abonnementCollection, where("numero", "==", number));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // En cas de collision rare, régénère
    return generateUniqueAbonnementNumber();
  }

  return number;
};

/**
 * Crée ou met à jour un abonnement utilisateur
 * - Crée si aucun abonnement n’existe pour la catégorie
 * - Met à jour si expiré
 * - Attribue un numéro d’abonnement unique
 */
export const createAbonnement = async (
  uid: string,
  category: string,
  months: number
) => {
  if (!uid || !category || months < 1 || months > 12)
    throw new Error("Paramètres d’abonnement invalides");

  const now = new Date();
  const q = query(
    abonnementCollection,
    where("uid", "==", uid),
    where("category", "==", category)
  );
  const snapshot = await getDocs(q);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(startDate.getMonth() + months);

  if (snapshot.empty) {
    // 🔹 Créer un nouvel abonnement
    const numero = await generateUniqueAbonnementNumber();

    await addDoc(abonnementCollection, {
      uid,
      category,
      months,
      numero,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: serverTimestamp(),
      active: true,
    });

    return { status: "created", numero };
  } else {
    // 🔹 Déjà existant — vérifier expiration
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    const end = new Date(data.endDate);

    if (end > now) {
      throw new Error(`Un abonnement ${category} est encore actif.`);
    } else {
      const ref = doc(db, "abonnements", docSnap.id);
      const numero = await generateUniqueAbonnementNumber();

      await updateDoc(ref, {
        months,
        numero,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        updatedAt: serverTimestamp(),
        active: true,
      });

      return { status: "updated", numero };
    }
  }
};

/**
 * Vérifie si un utilisateur a un abonnement actif
 */
export const checkActiveAbonnement = async (
  uid: string,
  category: string
): Promise<boolean> => {
  const q = query(
    abonnementCollection,
    where("uid", "==", uid),
    where("category", "==", category)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  const docData = snapshot.docs[0].data();
  const now = new Date();
  const endDate = new Date(docData.endDate);

  return endDate > now && docData.active;
};

/**
 * Récupère tous les abonnements d’un utilisateur
 */
export const getUserAbonnements = async (uid: string): Promise<any[]> => {
  const q = query(abonnementCollection, where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
