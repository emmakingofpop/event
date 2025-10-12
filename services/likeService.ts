// services/likeService.ts
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from "./firebaseConfig";

const likesCollection = collection(db, 'likes');

export interface Like {
  id?: string;       // Firestore document ID
  uid: string;       // User who liked
  posteId: string;   // ID of the post/profile liked
  nbrelikes: number; // Number of likes
}

export const LikeService = {
  // Create a new like
  async createLike(data: Like) {
    try {
      const docRef = doc(likesCollection);
      await setDoc(docRef, data);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error creating like:', error);
      throw error;
    }
  },

  // Read a like by ID
  async getLikeById(id: string) {
    try {
      const docRef = doc(likesCollection, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as Like;
    } catch (error) {
      console.error('Error getting like:', error);
      throw error;
    }
  },

  // Read all likes for a posteId
  async getLikesByPosteId(posteId: string) {
    try {
      const q = query(likesCollection, where('posteId', '==', posteId));
      const querySnap = await getDocs(q);
      const likes: Like[] = [];
      querySnap.forEach((doc) => likes.push({ id: doc.id, ...doc.data() } as Like));
      return likes;
    } catch (error) {
      console.error('Error getting likes by posteId:', error);
      throw error;
    }
  },

  // Update a like by ID
  async updateLike(id: string, data: Partial<Like>) {
    try {
      const docRef = doc(likesCollection, id);
      await updateDoc(docRef, data);
      return { id, ...data };
    } catch (error) {
      console.error('Error updating like:', error);
      throw error;
    }
  },

  // Delete a like by ID
  async deleteLike(id: string) {
    try {
      await deleteDoc(doc(likesCollection, id));
      return true;
    } catch (error) {
      console.error('Error deleting like:', error);
      throw error;
    }
  },

  // Check if a user already liked a post
  async getLikeByUser(uid: string, posteId: string) {
    try {
      const q = query(likesCollection, where('uid', '==', uid), where('posteId', '==', posteId));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const docSnap = querySnap.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Like;
      }
      return null;
    } catch (error) {
      console.error('Error checking user like:', error);
      throw error;
    }
  },

  async toggleLike(uid: string, posteId: string) {
  try {
    const q = query(
      likesCollection,
      where("uid", "==", uid),
      where("posteId", "==", posteId)
    );

    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      // Le like existe déjà -> on ne décrémente pas, retourne le nbrelikes actuel
      const docSnap = querySnap.docs[0];
      const currentLikes = docSnap.data().nbrelikes || 1;
      return { liked: false, nbrelikes: currentLikes };
    } else {
      // Ajoute un nouveau like avec nbrelikes = 1
      const docRef = doc(likesCollection);
      await setDoc(docRef, { uid, posteId, nbrelikes: 1 });
      return { liked: true, nbrelikes: 1 };
    }
  } catch (error) {
    console.error("Erreur lors du toggle like :", error);
    throw error;
  }
},

  async getLikesCount(posteId: string): Promise<number> {
  try {
    const q = query(likesCollection, where("posteId", "==", posteId));
    const querySnap = await getDocs(q);

    // additionne tous les champs nbrelikes
    let totalLikes = 0;
    querySnap.forEach((doc) => {
      const data = doc.data();
      totalLikes += data.nbrelikes || 0; // si le champ n'existe pas, on ajoute 0
    });

    return totalLikes;
  } catch (error) {
    console.error("Erreur lors du calcul des likes :", error);
    return 0;
  }
}

};
