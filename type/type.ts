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
  total?: number;
  etat: "payée" | "en attente" | "annulée";
  items: FactureItem[];
  createdAt?: Date;
}

export type Telechargement = {
  id?: string;
  uid: string;
  songId: string;
  factId: string;
  createdAt?: any;
  updatedAt?: any;
  active: boolean;
};


export const tel = '0977436749';

export const prixLikes = 0.5;

export const categories = [
  { name: 'Événements', icon: 'calendar' },
  { name: 'Shopping', icon: 'cart' },
  { name: 'Transport', icon: 'car' },
  { name: 'Réservation', icon: 'bed' },
  { name: 'Livraison', icon: 'bicycle' },
  { name: 'Rencontre', icon: 'heart' },
  { name: 'Musique', icon: 'musical-notes' },
];



export const souscat = [
  {
    title: "🏆 Ballon d’Or masculin",
    description: "Récompense le meilleur joueur de football masculin au monde."
  },
  {
    title: "🏆 Ballon d’Or féminin",
    description: "Récompense la meilleure joueuse de football au monde."
  },
  {
    title: "🏆 Trophée Kopa",
    description: "Attribué au meilleur joueur de moins de 21 ans."
  },
  {
    title: "🏆 Trophée Yachine",
    description: "Décerné au meilleur gardien de but de la saison."
  },
  {
    title: "🏆 Trophée Gerd Müller",
    description: "Récompense le meilleur buteur de l’année toutes compétitions confondues."
  },
  {
    title: "🏆 Trophée Socrates",
    description: "Distinction pour l’engagement humanitaire et social d’un joueur."
  },
  {
    title: "🏆 Club de l’année",
    description: "Récompense le meilleur club de football de la saison."
  },
  {
    title: "🏆 Coach de l’année",
    description: "Récompense le meilleur entraîneur de la saison."
  }
];

export const drcTowns = [
  "Kinshasa",
  "Lubumbashi",
  "Mbuji-Mayi",
  "Kananga",
  "Kisangani",
  "Bukavu",
  "Kolwezi",
  "Goma",
  "Tshikapa",
  "Likasi",
  "Kikwit",
  "Uvira",
  "Bunia",
  "Butembo",
  "Mbandaka",
  "Matadi",
  "Bandundu",
  "Boma",
  "Kindu",
  "Isiro",
  "Gemena",
  "Kalemie",
  "Mwene-Ditu",
  "Kabinda",
  "Gandajika",
  "Kamina",
  "Beni",
  "Kipushi",
  "Baraka",
  "Bumba",
  "Mbanza-Ngungu",
  "Muanda",
  "Lisala",
  "Kasongo",
  "Buta",
  "Inongo",
  "Basankusu",
  "Ilebo",
  "Kongolo",
  "Lukolela",
  "Lusambo",
  "Boende",
  "Tshela",
  "Bulungu",
  "Zongo",
  "Kenge",
  "Lodja",
  "Tshilenge",
  "Mangina",
  "Seke-Banza",
  "Oicha",
  "Masisi",
  "Dungu",
  "Watsa",
  "Manono",
  "Kambove",
  "Gbadolite",
  "Lukula",
  "Kimpese",
  "Kasangulu",
  "Idiofa",
  "Kasongo-Lunda",
  "Gungu",
  "Pweto",
  "Binga",
  "Mweka",
  "Dibaya",
  "Basoko",
  "Kabalo",
  "Bukama",
  "Moba",
  "Katwa",
  "Lukole",
  "Luebo",
  "Ankoro",
  "Bolobo",
  "Fizi",
  "Mwenga"
]