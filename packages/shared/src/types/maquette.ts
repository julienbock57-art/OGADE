export const EtatMaquette = {
  STOCK: "STOCK",
  EMPRUNTEE: "EMPRUNTEE",
  EN_CONTROLE: "EN_CONTROLE",
  REBUT: "REBUT",
  EN_REPARATION: "EN_REPARATION",
  ENVOYEE: "ENVOYEE",
} as const;

export type EtatMaquette = (typeof EtatMaquette)[keyof typeof EtatMaquette];

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
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
};
