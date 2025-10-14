import { db } from "@/services/firebaseConfig";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "firebase/firestore";

// Firestore collection
const abonnementCollection = collection(db, "abonnements");

/**
 * Créer un abonnement pour un utilisateur
 * @param uid Identifiant utilisateur
 * @param category Nom de la catégorie
 * @param months Durée en mois (1 à 12)
 */


/**
 * Crée ou met à jour un abonnement.
 * - Crée si aucun abonnement n’existe pour la catégorie.
 * - Met à jour uniquement si l’abonnement précédent est expiré.
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
    // Aucun abonnement trouvé — on en crée un nouveau
    await addDoc(abonnementCollection, {
      uid,
      category,
      months,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: serverTimestamp(),
      active: false,
    });
    return "created";
  } else {
    // Un abonnement existe déjà → vérifier s’il est expiré
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    const end = new Date(data.endDate);

    if (end > now) {
      // Abonnement encore actif
      throw new Error(`Un abonnement ${category} est encore actif.`);
    } else {
      // Expiré → on met à jour
      const ref = doc(db, "abonnements", docSnap.id);
      await updateDoc(ref, {
        months,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        updatedAt: serverTimestamp(),
        active: false,
      });
      return "updated";
    }
  }
};

/**
 * Vérifie si un utilisateur a un abonnement actif
 */
export const checkActiveAbonnement = async (uid: string, category: string) => {
  const q = query(abonnementCollection, where("uid", "==", uid), where("category", "==", category));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  const docData = snapshot.docs[0].data();
  const now = new Date();
  const endDate = new Date(docData.endDate);

  return endDate > now && docData.active;
};

/**
 * Récupérer tous les abonnements de l’utilisateur
 */
export const getUserAbonnements = async (uid: string) => {
  const q = query(abonnementCollection, where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
