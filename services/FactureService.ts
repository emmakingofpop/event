import { db } from "@/services/firebaseConfig";
import { Facture } from "@/type/type";
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


const facturesCollection = collection(db, "factures");

export const FactureService = {
  /**
   * 🔹 Génère automatiquement un nouveau numéro de facture unique (ex: FAC-001)
   */
  async generateFactureNumber(): Promise<string> {
    const q = query(facturesCollection, orderBy("factureNumber", "desc"), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) return "FAC-001";

    const lastFacture = snap.docs[0].data() as Facture;
    const lastNumber = parseInt(lastFacture.factureNumber.split("-")[1]);
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");

    return `FAC-${nextNumber}`;
  },

  /**
   * 🔸 Créer une nouvelle facture (le numéro est généré automatiquement)
   */
  async createFacture(
    data: Omit<Facture, "id" | "factureNumber">
  ): Promise<string | null> {
    try {
      const factureNumber = await this.generateFactureNumber();

      const docRef = await addDoc(facturesCollection, {
        ...data,
        factureNumber,
        createdAt: new Date(),
      });

      return factureNumber; // retourne le numéro généré
    } catch (error) {
      console.error("Erreur lors de la création de la facture :", error);
      return null;
    }
  },

  /**
   * 🔸 Récupérer toutes les factures d’un utilisateur
   */
  async getFacturesByUser(uid: string): Promise<Facture[]> {
    try {
      const q = query(facturesCollection, where("uid", "==", uid),orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Facture[];
    } catch (error) {
      console.error("Erreur lors de la récupération des factures :", error);
      return [];
    }
  },

  
  /**
   * 🔸 Récupérer toutes les factures d’un utilisateur
   */

  async getFacturesByfactureNumberfactureNumber(factureNumber: string): Promise<Facture[]> {
    try {
      const q = query(facturesCollection, where("factureNumber", "==", factureNumber));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Facture[];
    } catch {
      return [];
    }
  },

  
  async getFacturesByPostId(uid:string,posteId:string): Promise<Facture[]> {
    try {
      const q = query(facturesCollection, where("uid", "==", uid), where("posteId", "==", posteId));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Facture[];
    } catch {
      return [];
    }
  },


  async getAllFactures(): Promise<Facture[]> {
    try {
      // Query without the 'where' clause to get all documents
      const q = query(facturesCollection, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Facture[];
    } catch{
      return [];
    }
  },


  /**
   * 🔸 Récupérer une facture par son ID
   */
  async getFactureById(id: string): Promise<Facture | null> {
    try {
      const docRef = doc(db, "factures", id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Facture;
    } catch  {
      return null;
    }
  },

  /**
   * 🔸 Mettre à jour une facture
   */
  async updateFacture(id: string, data: Partial<Facture>): Promise<boolean> {
    try {
      const docRef = doc(db, "factures", id);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la facture :", error);
      return false;
    }
  },

  /**
   * 🔸 Supprimer une facture
   */
  async deleteFacture(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, "factures", id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de la facture :", error);
      return false;
    }
  },
};
