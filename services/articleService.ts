// articleService.ts
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
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebaseConfig";

// Référence à la collection Firestore
export const articleCollection = collection(db, "articles");

/**
 * Upload une image vers Firebase Storage
 */
export const uploadImage = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = `images/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Erreur upload image :", error);
    throw error;
  }
};

/**
 * Ajouter un article
 */
export const createArticle = async (article: any) => {
  const now = new Date().toISOString();

  // Upload toutes les images
  const uploadedImages = await Promise.all(article.images.map((uri: string) => uploadImage(uri)));

  const newArticle = {
    ...article,
    images: uploadedImages,
    created_at: now,
    updated_at: now,
  };

  const docRef = await addDoc(articleCollection, newArticle);
  return { id: docRef.id, ...newArticle };
};

/**
 * Lire tous les articles
 */
export const getArticles = async () => {
  const snapshot = await getDocs(articleCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};


/**
 * Lire les 10 derniers articles (triés par date de création décroissante)
 */
export const getArticlesLimit = async (): Promise<any | null> => {
  try {
    const q = query(articleCollection, orderBy("created_at", "desc"), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch {
    return null
  }
};

/**
 * articles by UID
 */


export const getArticlesByUid = async (uid: string) => {
  try {
    const q = query(
      articleCollection,
      where("uid", "==", uid),
      orderBy("created_at", "desc") // 🔹 newest first
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

/**
 * articles by Category
 */

export const getArticlesByCategory = async (category: string): Promise<any> => {
  try {
    const q = query(
      articleCollection,
       where("category", "==", category));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    return [];
  }
};

/**
 * Lire un seul article
 */
export const getArticleById = async (id: string) => {
  const docRef = doc(db, "articles", id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  } else {
    return null
  }
};

/**
 * Mettre à jour un article
 */
export const updateArticle = async (id: string, updatedData: any): Promise<boolean> => {
  try {
    const docRef = doc(db, "articles", id);

    let newImages = updatedData.images || [];
    if (newImages.length > 0) {
      newImages = await Promise.all(newImages.map((uri: string) => uploadImage(uri)));
    }

    await updateDoc(docRef, {
      ...updatedData,
      images: newImages.length > 0 ? newImages : updatedData.images,
      updated_at: new Date().toISOString(),
    });

    return true; // success
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    return false; // failure
  }
};


/**
 * Supprimer un article + ses images
 */
export const deleteArticle = async (id: string, images: string[]): Promise<boolean> => {
  try {
    const docRef = doc(db, "articles", id);

    // Supprime les images du Storage
    for (const imageUrl of images) {
      const imageRef = ref(storage, imageUrl);
      try {
        await deleteObject(imageRef);
      } catch (err) {
        return true; 
      }
    }

    await deleteDoc(docRef);

    return true; 
  } catch (err) {
    return false; // deletion failed
  }
};
