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
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebaseConfig";

// 🔹 Firestore collection for user profiles
export const profileCollection = collection(db, "profiles");

/**
 * Upload une image vers Firebase Storage (pour le profil)
 */

export const uploadProfileImage = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = `profiles/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Erreur upload image profil :", error);
    throw error;
  }
};

/**
 * Ajouter un profil
 */

export const createProfile = async (profile: any) => {
  const now = new Date().toISOString();

  // 🔹 Upload toutes les images de profil (si elles ne sont pas déjà en ligne)
  const uploadedImages = await Promise.all(
    (profile.images || []).map(async (uri: string) =>
      uri.startsWith("https://") ? uri : await uploadProfileImage(uri)
    )
  );

  const newProfile = {
    ...profile,
    images: uploadedImages,
    created_at: now,
    updated_at: now,
  };

  // 🔹 Ajouter le profil à Firestore
  const docRef = await addDoc(profileCollection, newProfile);

  // 🔹 Mettre à jour le profil avec le doc ID comme uid
  await updateDoc(doc(db, "profiles", docRef.id), {
    uid: docRef.id,
  });

  return {
    id: docRef.id,
    ...newProfile,
    uid: docRef.id,
  };
};

/**
 * Lire tous les profils
 */
export const getProfiles = async () => {
  const snapshot = await getDocs(profileCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Profils par UID (unique user)
 */
export const getProfileByUid = async (uid: string): Promise<any> => {
  try {
    const q = query(profileCollection, where("uid", "==", uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    
    return [];
  }
};


export const getProfilesByUids = async (uids: string[]): Promise<any[]> => {
  try {
    const promises = uids.map((uid) => getProfileByUid(uid));
    const results = await Promise.all(promises);
    // Flatten since each getProfileByUid returns an array
    return results.flat();
  } catch (error) {
    
    return [];
  }
};


/**
 * Lire un profil par ID
 */
export const getProfileById = async (id: string) => {
  const docRef = doc(db, "profiles", id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  } else {
    return null;
  }
};

/**
 * Mettre à jour un profil
 */
export const updateProfileByUid = async (uid: string, updatedData: any): Promise<boolean> => {
  try {
    // 🔹 Rechercher le profil correspondant à l'UID
    const q = query(profileCollection, where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn("Aucun profil trouvé pour cet UID :", uid);
      return false;
    }

    // 🔹 Récupérer la référence du document
    const profileDoc = snapshot.docs[0];
    const docRef = doc(db, "profiles", profileDoc.id);

    // 🔹 Gérer les nouvelles images
    let newImages = updatedData.images || [];
    if (newImages.length > 0) {
      newImages = await Promise.all(
        newImages.map(async (uri: string) =>
          uri.startsWith("https://") ? uri : await uploadProfileImage(uri)
        )
      );
    }

    // 🔹 Mettre à jour le document
    await updateDoc(docRef, {
      ...updatedData,
      images: newImages.length > 0 ? newImages : updatedData.images,
      updated_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil par UID :", error);
    return false;
  }
};


/**
 * Supprimer un profil + ses images
 */
export const deleteProfile = async (id: string, images: string[]): Promise<boolean> => {
  try {
    const docRef = doc(db, "profiles", id);

    // 🔹 Supprimer les images du Storage
    for (const imageUrl of images) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (err) {
        console.warn("Échec suppression image :", err);
      }
    }

    await deleteDoc(docRef);

    return true;
  } catch (err) {
    console.error("Erreur suppression profil :", err);
    return false;
  }
};
