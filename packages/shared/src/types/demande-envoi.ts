export const TypeDemande = {
  MATERIEL: "MATERIEL",
  MAQUETTE: "MAQUETTE",
  MUTUALISEE: "MUTUALISEE",
} as const;

export type TypeDemande = (typeof TypeDemande)[keyof typeof TypeDemande];

/**
 * Type métier d'envoi (workflow Phase 1).
 * - INTERNE              → CNPE → CNPE (réception saisie côté destinataire)
 * - EXTERNE_TITULAIRE    → vers société titulaire (pas de réception
 *                          remote, clôture au retour au site d'origine)
 * - ETALONNAGE           → vers prestataire d'étalonnage
 * - PRET_INTERNE         → entre groupes/pôles EDF
 * - PRET_EXTERNE         → vers société tierce
 */
export const TypeEnvoi = {
  INTERNE: "INTERNE",
  EXTERNE_TITULAIRE: "EXTERNE_TITULAIRE",
  ETALONNAGE: "ETALONNAGE",
  PRET_INTERNE: "PRET_INTERNE",
  PRET_EXTERNE: "PRET_EXTERNE",
} as const;
export type TypeEnvoi = (typeof TypeEnvoi)[keyof typeof TypeEnvoi];

/**
 * Statut global de la demande.
 *  BROUILLON → SOUMISE
 *  → VALIDEE_PARTIELLEMENT (au moins une ligne validée, d'autres en attente)
 *  → VALIDEE              (toutes les lignes décidées, au moins une validée)
 *  → REFUSEE              (toutes les lignes refusées ou demande annulée)
 *  → PRETE_A_EXPEDIER     (magasinier l'a vue)
 *  → EN_TRANSIT           (magasinier a expédié)
 *  → RECUE (interne) | LIVREE_TITULAIRE (externe)
 *  → EN_COURS             (chez le destinataire ou prestataire)
 *  → EN_RETOUR            (en transit retour)
 *  → RECUE_RETOUR         (récupéré au site d'origine)
 *  → CLOTUREE
 *  ANNULEE possible avant expédition.
 */
export const StatutDemande = {
  BROUILLON: "BROUILLON",
  SOUMISE: "SOUMISE",
  VALIDEE_PARTIELLEMENT: "VALIDEE_PARTIELLEMENT",
  VALIDEE: "VALIDEE",
  REFUSEE: "REFUSEE",
  PRETE_A_EXPEDIER: "PRETE_A_EXPEDIER",
  EN_TRANSIT: "EN_TRANSIT",
  RECUE: "RECUE",
  LIVREE_TITULAIRE: "LIVREE_TITULAIRE",
  EN_COURS: "EN_COURS",
  EN_RETOUR: "EN_RETOUR",
  RECUE_RETOUR: "RECUE_RETOUR",
  CLOTUREE: "CLOTUREE",
  ANNULEE: "ANNULEE",
  // alias rétro-compatible
  ENVOYEE: "EN_TRANSIT",
} as const;

export type StatutDemande = (typeof StatutDemande)[keyof typeof StatutDemande];

/** Statut d'une ligne (matériel/maquette) dans une demande */
export const StatutLigne = {
  EN_ATTENTE: "EN_ATTENTE",
  VALIDEE: "VALIDEE",
  REFUSEE: "REFUSEE",
  EXPEDIEE: "EXPEDIEE",
  LIVREE: "LIVREE",
  EN_RETOUR: "EN_RETOUR",
  RECUE_RETOUR: "RECUE_RETOUR",
  CLOTUREE: "CLOTUREE",
} as const;
export type StatutLigne = (typeof StatutLigne)[keyof typeof StatutLigne];

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
  urgence?: string | null;
  justificationUrgence?: string | null;
  contact?: string | null;
  contactTelephone?: string | null;
  adresseDestination?: string | null;
  convention?: boolean;
  souscriptionAssurance?: boolean;
  produitsChimiques?: boolean;
  // Workflow Phase 1
  typeEnvoi?: TypeEnvoi | null;
  siteOrigine?: string | null;
  magasinierEnvoiId?: number | null;
  magasinierReceptionId?: number | null;
  magasinierRetourId?: number | null;
  dateSoumission?: string | Date | null;
  dateValidation?: string | Date | null;
  dateExpedition?: string | Date | null;
  dateRetourEstimee?: string | Date | null;
  dateRetour?: string | Date | null;
  dateCloture?: string | Date | null;
  motifAnnulation?: string | null;
  // Workflow Phase 4 (transport / magasinier)
  numeroBonTransport?: string | null;
  transporteur?: string | null;
  commentaireExpedition?: string | null;
  commentaireReception?: string | null;
  commentaireRetour?: string | null;
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
  // Workflow Phase 1
  statut: StatutLigne;
  validateurId?: number | null;
  valideeLe?: string | Date | null;
  motifRefus?: string | null;
  etatDepart?: string | null;
  etatReception?: string | null;
  etatRetour?: string | null;
};
