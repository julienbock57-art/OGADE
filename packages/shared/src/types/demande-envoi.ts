export const TypeDemande = {
  MATERIEL: "MATERIEL",
  MAQUETTE: "MAQUETTE",
  MUTUALISEE: "MUTUALISEE",
} as const;

export type TypeDemande = (typeof TypeDemande)[keyof typeof TypeDemande];

export const StatutDemande = {
  BROUILLON: "BROUILLON",
  ENVOYEE: "ENVOYEE",
  EN_TRANSIT: "EN_TRANSIT",
  RECUE: "RECUE",
  CLOTUREE: "CLOTUREE",
  ANNULEE: "ANNULEE",
} as const;

export type StatutDemande = (typeof StatutDemande)[keyof typeof StatutDemande];

export type DemandeEnvoi = {
  id: number;
  numero: string;
  type: TypeDemande;
  demandeurId: number;
  destinataire: string;
  siteDestinataire?: string | null;
  motif?: string | null;
  dateSouhaitee?: string | Date | null;
  statut: StatutDemande;
  dateEnvoi?: string | Date | null;
  dateReception?: string | Date | null;
  commentaire?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type DemandeEnvoiLigne = {
  id: number;
  demandeId: number;
  materielId?: number | null;
  maquetteId?: number | null;
  quantite: number;
  recue: boolean;
  dateReception?: string | Date | null;
};
