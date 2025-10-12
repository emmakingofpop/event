import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const USERS_COLLECTION = "users";

export interface User {
  id?: string;
  username: string;
  phoneNumber: string;
  password: string;
  createdAt?: Date;
}

/* ============================================================
   🔹 SIGN UP
   ============================================================ */
export const signup = async (username: string, phoneNumber: string, password: string) => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("phoneNumber", "==", phoneNumber));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return { success: false, message: "Un utilisateur avec ce numéro existe déjà." };
    }

    const docRef = await addDoc(collection(db, USERS_COLLECTION), {
      username,
      phoneNumber,
      password,
      createdAt: new Date(),
    });

    return { success: true, uid: docRef.id, username, phoneNumber, message: "Compte créé avec succès." };
  } catch {
    return { success: false, message: "Impossible de créer le compte. Réessayez plus tard." };
  }
};

/* ============================================================
   🔹 LOGIN
   ============================================================ */
export const logins = async (phoneNumber: string, password: string) => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("phoneNumber", "==", phoneNumber));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, message: "Utilisateur non trouvé." };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;

    if (password !== userData.password) {
      return { success: false, message: "Identifiants invalides." };
    }

    return {
      success: true,
      uid: userDoc.id,
      username: userData.username,
      phoneNumber: userData.phoneNumber,
      message: "Connexion réussie.",
    };
  } catch {
    return { success: false, message: "Impossible de se connecter. Réessayez plus tard." };
  }
};

/* ============================================================
   🔹 RESET PASSWORD
   ============================================================ */

export const resetPassword = async (phoneNumber: string, newPassword: string) => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("phoneNumber", "==", phoneNumber));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, message: "Utilisateur non trouvé." };
    }

    const userDoc = snapshot.docs[0];
    const ref = doc(db, USERS_COLLECTION, userDoc.id);

    await updateDoc(ref, { password: newPassword });

    return { success: true, message: "Mot de passe réinitialisé avec succès." };
  } catch {
    return { success: false, message: "Impossible de réinitialiser le mot de passe." };
  }
};

/* ============================================================
   🔹 GET ALL USERS
   ============================================================ */
export const getAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return { success: true, users: snapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as User) })) };
  } catch {
    return { success: false, users: [], message: "Impossible de récupérer les utilisateurs." };
  }
};

/* ============================================================
   🔹 GET USER BY ID
   ============================================================ */
export const getUserById = async (id: string) => {
  try {
    const ref = doc(db, USERS_COLLECTION, id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return { success: false, message: "Utilisateur non trouvé." };
    return { success: true, user: { uid: snapshot.id, ...(snapshot.data() as User) } };
  } catch {
    return { success: false, message: "Impossible de récupérer l'utilisateur." };
  }
};

/* ============================================================
   🔹 UPDATE USER
   ============================================================ */
export const updateUser = async (id: string, data: Partial<User>) => {
  try {
    const ref = doc(db, USERS_COLLECTION, id);
    await updateDoc(ref, data);
    return { success: true, message: "Utilisateur mis à jour avec succès." };
  } catch {
    return { success: false, message: "Impossible de mettre à jour l'utilisateur." };
  }
};

/* ============================================================
   🔹 DELETE USER
   ============================================================ */
export const deleteUser = async (id: string) => {
  try {
    const ref = doc(db, USERS_COLLECTION, id);
    await deleteDoc(ref);
    return { success: true, message: "Utilisateur supprimé avec succès." };
  } catch {
    return { success: false, message: "Impossible de supprimer l'utilisateur." };
  }
};
