import { z } from "zod";
import { TypeDemande, TypeEnvoi, StatutDemande } from "../types/demande-envoi";

const ligneSchema = z
  .object({
    materielId: z.number().optional(),
    maquetteId: z.number().optional(),
    quantite: z.number().default(1),
  })
  .refine((ligne) => {
    const hasMateriel = ligne.materielId !== undefined;
    const hasMaquette = ligne.maquetteId !== undefined;
    return (hasMateriel && !hasMaquette) || (!hasMateriel && hasMaquette);
  }, "Exactly one of materielId or maquetteId must be set");

const ALL_STATUTS = [
  StatutDemande.BROUILLON,
  StatutDemande.SOUMISE,
  StatutDemande.VALIDEE_PARTIELLEMENT,
  StatutDemande.VALIDEE,
  StatutDemande.REFUSEE,
  StatutDemande.PRETE_A_EXPEDIER,
  StatutDemande.EN_TRANSIT,
  StatutDemande.RECUE,
  StatutDemande.LIVREE_TITULAIRE,
  StatutDemande.EN_COURS,
  StatutDemande.EN_RETOUR,
  StatutDemande.RECUE_RETOUR,
  StatutDemande.CLOTUREE,
  StatutDemande.ANNULEE,
] as const;

const TYPES_ENVOI = [
  TypeEnvoi.INTERNE,
  TypeEnvoi.EXTERNE_TITULAIRE,
  TypeEnvoi.ETALONNAGE,
  TypeEnvoi.PRET_INTERNE,
  TypeEnvoi.PRET_EXTERNE,
] as const;

export const createDemandeEnvoiSchema = z
  .object({
    type: z.enum([
      TypeDemande.MATERIEL,
      TypeDemande.MAQUETTE,
      TypeDemande.MUTUALISEE,
    ]),
    destinataire: z.string().min(1),
    siteDestinataire: z.string().optional(),
    siteOrigine: z.string().optional(),
    typeEnvoi: z.enum(TYPES_ENVOI).optional(),
    motif: z.string().optional(),
    dateSouhaitee: z.coerce.date().optional(),
    dateRetourEstimee: z.coerce.date().optional(),
    commentaire: z.string().optional(),
    urgence: z.string().optional(),
    justificationUrgence: z.string().optional(),
    contact: z.string().optional(),
    contactTelephone: z.string().optional(),
    adresseDestination: z.string().optional(),
    convention: z.boolean().optional(),
    souscriptionAssurance: z.boolean().optional(),
    produitsChimiques: z.boolean().optional(),
    lignes: z.array(ligneSchema),
  });

export const updateDemandeEnvoiSchema = z.object({
  destinataire: z.string().min(1).optional(),
  siteDestinataire: z.string().optional(),
  siteOrigine: z.string().optional(),
  typeEnvoi: z.enum(TYPES_ENVOI).optional(),
  motif: z.string().optional(),
  dateSouhaitee: z.coerce.date().optional(),
  dateRetourEstimee: z.coerce.date().optional(),
  commentaire: z.string().optional(),
  urgence: z.string().optional(),
  justificationUrgence: z.string().optional(),
  contact: z.string().optional(),
  contactTelephone: z.string().optional(),
  adresseDestination: z.string().optional(),
  convention: z.boolean().optional(),
  souscriptionAssurance: z.boolean().optional(),
  produitsChimiques: z.boolean().optional(),
  statut: z.enum(ALL_STATUTS).optional(),
});

export const refuseLigneSchema = z.object({
  motif: z.string().min(3, "Le motif de refus est obligatoire"),
});

export const validateLignesBatchSchema = z.object({
  ligneIds: z.array(z.number().int().positive()).min(1),
});

const ETATS_PHYSIQUES = ["CORRECT", "LEGER_DEFAUT", "HS"] as const;

const ligneEtatSchema = z.object({
  ligneId: z.number().int().positive(),
  etat: z.enum(ETATS_PHYSIQUES),
});

export const expedierSchema = z.object({
  numeroBonTransport: z.string().min(1, "Numéro de bon de transport requis"),
  transporteur: z.string().min(1, "Transporteur requis"),
  dateExpedition: z.coerce.date().optional(),
  commentaire: z.string().optional(),
  lignesEtat: z.array(ligneEtatSchema).default([]),
});

export const receptionnerSchema = z.object({
  dateReception: z.coerce.date().optional(),
  commentaire: z.string().optional(),
  lignesEtat: z.array(ligneEtatSchema).default([]),
});

export const receptionnerRetourSchema = z.object({
  dateRetour: z.coerce.date().optional(),
  commentaire: z.string().optional(),
  lignesEtat: z.array(ligneEtatSchema).default([]),
});

export type CreateDemandeEnvoiInput = z.infer<typeof createDemandeEnvoiSchema>;
export type UpdateDemandeEnvoiInput = z.infer<typeof updateDemandeEnvoiSchema>;
export type RefuseLigneInput = z.infer<typeof refuseLigneSchema>;
export type ValidateLignesBatchInput = z.infer<typeof validateLignesBatchSchema>;
export type ExpedierInput = z.infer<typeof expedierSchema>;
export type ReceptionnerInput = z.infer<typeof receptionnerSchema>;
export type ReceptionnerRetourInput = z.infer<typeof receptionnerRetourSchema>;
export type EtatPhysique = (typeof ETATS_PHYSIQUES)[number];
