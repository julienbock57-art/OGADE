export const EtatMateriel = {
  DISPONIBLE: "DISPONIBLE",
  EN_SERVICE: "EN_SERVICE",
  EN_REPARATION: "EN_REPARATION",
  REBUT: "REBUT",
  PRETE: "PRETE",
  ENVOYEE: "ENVOYEE",
} as const;

export type EtatMateriel = (typeof EtatMateriel)[keyof typeof EtatMateriel];

export type Materiel = {
  id: number;
  reference: string;
  libelle: string;
  etat: EtatMateriel;
  typeMateriel?: string | null;
  numeroSerie?: string | null;
  localisation?: string | null;
  site?: string | null;
  description?: string | null;
  dateEtalonnage?: string | Date | null;
  dateProchainEtalonnage?: string | Date | null;
  modele?: string | null;
  typeTraducteur?: string | null;
  typeEND?: string | null;
  groupe?: string | null;
  fournisseur?: string | null;
  validiteEtalonnage?: number | null;
  soumisVerification?: boolean;
  enPret?: boolean;
  motifPret?: string | null;
  dateRetourPret?: string | Date | null;
  completude?: string | null;
  informationVerifiee?: boolean;
  produitsChimiques?: boolean;
  commentaires?: string | null;
  entreprise?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
};
