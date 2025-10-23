import { db } from "@/services/firebaseConfig";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

type TicketSoldOuts = { id:string;posteId: string; factureId: string }

const TICKET_SOLDOUT_COLLECTION = "ticketSoldOut";

export const TicketSoldOutService = {
  // ✅ Create new TicketSoldOut
  async create(data: { posteId: string; factureId: string }) {
    try {
      const docRef = await addDoc(collection(db, TICKET_SOLDOUT_COLLECTION), {
        posteId: data.posteId,
        factureId: data.factureId,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    } catch  {
        return null
    }
  },

  // ✅ Get all TicketSoldOut
  async getAll(): Promise<any[] | null>{
    try {
      const snapshot = await getDocs(collection(db, TICKET_SOLDOUT_COLLECTION));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch {
        return null
    }
  },

  // ✅ Get TicketSoldOut by ID
  async getById(id: string) {
    try {
      const docRef = doc(db, TICKET_SOLDOUT_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      console.error("Error fetching TicketSoldOut by ID:", error);
      throw error;
    }
  },

  // ✅ Update TicketSoldOut
  async update(id: string, data: Partial<{ posteId: string; factureId: string }>) {
    try {
      const docRef = doc(db, TICKET_SOLDOUT_COLLECTION, id);
      await updateDoc(docRef, data);
      return { id, ...data };
    } catch (error) {
      console.error("Error updating TicketSoldOut:", error);
      throw error;
    }
  },

  // ✅ Delete TicketSoldOut
  async delete(id: string) {
    try {
      const docRef = doc(db, TICKET_SOLDOUT_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting TicketSoldOut:", error);
      throw error;
    }
  },

  // ✅ Optional: Filter by posteId
  async getByPosteId(posteId: string) {
    try {
      const q = query(
        collection(db, TICKET_SOLDOUT_COLLECTION),
        where("posteId", "==", posteId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching by posteId:", error);
      throw error;
    }
  },
};
