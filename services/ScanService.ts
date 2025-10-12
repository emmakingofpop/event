import { db } from "@/services/firebaseConfig";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where
} from "firebase/firestore";

export interface Scan {
  id?: string;
  factureId: string;
  uid: string;
  createdAt?: Date;
}

const scansCollection = collection(db, "scans");

export const ScanService = {
  /**
   * 🔹 Créer un nouveau scan
   */
  async createScan(data: Omit<Scan, "id" | "createdAt">): Promise<string | null> {
    try {
      const docRef = await addDoc(scansCollection, {
        ...data,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de la création du scan :", error);
      return null;
    }
  },

  /**
   * 🔹 Récupérer tous les scans d’un utilisateur
   */
  async getScansByUser(uid: string): Promise<Scan[]> {
    try {
      const q = query(scansCollection, where("uid", "==", uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Scan[];
    } catch (error) {
      console.error("Erreur lors de la récupération des scans :", error);
      return [];
    }
  },

  /**
   * 🔹 Récupérer les scans d’une facture spécifique
   */
  async getScansByFacture(factureId: string): Promise<Scan[]> {
    try {
      const q = query(scansCollection, where("factureId", "==", factureId));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Scan[];
    } catch {
      return [];
    }
  },

  /**
   * 🔹 Récupérer un scan par son ID
   */
  async getScanById(id: string): Promise<Scan | null> {
    try {
      const docRef = doc(db, "scans", id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Scan;
    } catch (error) {
      console.error("Erreur lors de la récupération du scan :", error);
      return null;
    }
  },

  /**
   * 🔹 Mettre à jour un scan
   */
  async updateScan(id: string, data: Partial<Scan>): Promise<boolean> {
    try {
      const docRef = doc(db, "scans", id);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du scan :", error);
      return false;
    }
  },

  /**
   * 🔹 Supprimer un scan
   */
  async deleteScan(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, "scans", id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du scan :", error);
      return false;
    }
  },
};
