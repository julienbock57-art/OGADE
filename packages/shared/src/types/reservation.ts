export const TypeReservation = {
  TRANSFERT_SITE: "TRANSFERT_SITE",
  ETALONNAGE: "ETALONNAGE",
  PRET_EXTERNE: "PRET_EXTERNE",
  PRET_INTERNE: "PRET_INTERNE",
  AUTRE: "AUTRE",
} as const;

export type TypeReservation =
  (typeof TypeReservation)[keyof typeof TypeReservation];

export const StatutReservation = {
  CONFIRMEE: "CONFIRMEE",
  HONOREE: "HONOREE",
  ANNULEE: "ANNULEE",
} as const;

export type StatutReservation =
  (typeof StatutReservation)[keyof typeof StatutReservation];

export type Reservation = {
  id: number;
  numero: string;
  materielId: number;
  demandeurId: number;
  dateDebut: string | Date;
  dateFin: string | Date;
  type: TypeReservation;
  statut: StatutReservation;
  motif?: string | null;
  commentaire?: string | null;
  annuleParId?: number | null;
  annuleLe?: string | Date | null;
  motifAnnulation?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  materiel?: {
    id: number;
    reference: string;
    libelle: string;
    typeMateriel?: string | null;
    modele?: string | null;
    site?: string | null;
    localisation?: string | null;
  } | null;
  demandeur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  } | null;
  annulePar?: {
    id: number;
    nom: string;
    prenom: string;
  } | null;
};

export type ReservationConflict = {
  kind: "reservation" | "demande-envoi";
  id: number;
  numero: string;
  label: string;
  dateDebut: string | Date;
  dateFin: string | Date | null;
};

export type ReservationStats = {
  total: number;
  actives: number;
  cetteSemaine: number;
  aujourdhui: number;
  mesReservations: number;
};
