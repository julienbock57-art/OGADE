export const EtatMaquette = {
  STOCK: "STOCK",
  EMPRUNTEE: "EMPRUNTEE",
  EN_CONTROLE: "EN_CONTROLE",
  REBUT: "REBUT",
  EN_REPARATION: "EN_REPARATION",
  ENVOYEE: "ENVOYEE",
} as const;

export type EtatMaquette = (typeof EtatMaquette)[keyof typeof EtatMaquette];

export type Defaut = {
  id: number;
  typeDefaut: string;
  position?: string | null;
  dimension?: string | null;
  description?: string | null;
  severite: string;
  longueur?: number | null;
  largeur?: number | null;
  profondeur?: number | null;
  diametre?: number | null;
  cote?: string | null;
  certifie?: boolean;
  posX?: number | null;
  posY?: number | null;
  couleur?: string | null;
  detecteLe?: string | Date | null;
};

export type Maquette = {
  id: number;
  reference: string;
  libelle: string;
  etat: EtatMaquette;
  localisation?: string | null;
  description?: string | null;
  site?: string | null;
  typeMaquette?: string | null;
  maquetteMereId?: number | null;
  proprietaireId?: number | null;
  emprunteurId?: number | null;
  dateEmprunt?: string | Date | null;
  dateRetour?: string | Date | null;
  composant?: string | null;
  categorie?: string | null;
  forme?: string | null;
  typeAssemblage?: string | null;
  matiere?: string | null;
  procedures?: string | null;
  typeControle?: string | null;
  referenceASN?: boolean;
  horsPatrimoine?: boolean;
  informationsCertifiees?: boolean;
  enTransit?: boolean;
  longueur?: number | null;
  largeur?: number | null;
  hauteur?: number | null;
  dn?: number | null;
  epaisseurParoi?: number | null;
  poids?: number | null;
  quantite?: number | null;
  commentaires?: string | null;
  poleEntite?: string | null;
  entreprise?: string | null;
  valeurFinanciere?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  proprietaire?: { id: number; nom: string; prenom: string; email: string } | null;
  emprunteur?: { id: number; nom: string; prenom: string; email: string } | null;
  defauts?: Defaut[];
  _count?: { defauts: number };
};

export type MaquetteStats = {
  total: number;
  stock: number;
  empruntees: number;
  transit: number;
  empruntesOuTransit: number;
  asn: number;
  hs: number;
  enReparation: number;
  requalifier: number;
};
