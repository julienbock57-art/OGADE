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

export type CreateDemandeEnvoiInput = z.infer<typeof createDemandeEnvoiSchema>;
export type UpdateDemandeEnvoiInput = z.infer<typeof updateDemandeEnvoiSchema>;
