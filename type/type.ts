export type FactureItem = {
  id: string;
  nom: string;
  quantite: number;
  prix: number;
};

// 🔹 Type d’une facture complète
export interface Facture {
  id?: string;
  uid: string;
  factureNumber: string;
  posteId: string;
  scanned: boolean;
  etat: "payée" | "en attente" | "annulée";
  items: FactureItem[];
  createdAt?: Date;
}



export const tel = '0977436749';

export const prixLikes = 0.5

export const souscat = ['sous cat 1', 'sous cat 2', 'sous cat 3', 'sous cat 4', 'sous cat 5'];