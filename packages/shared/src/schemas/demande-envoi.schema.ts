import { z } from "zod";
import { TypeDemande, StatutDemande } from "../types/demande-envoi";

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

export const createDemandeEnvoiSchema = z.object({
  type: z.enum([
    TypeDemande.MATERIEL,
    TypeDemande.MAQUETTE,
    TypeDemande.MUTUALISEE,
  ]),
  destinataire: z.string().min(1),
  siteDestinataire: z.string().optional(),
  motif: z.string().optional(),
  dateSouhaitee: z.coerce.date().optional(),
  commentaire: z.string().optional(),
  lignes: z.array(ligneSchema),
});

export const updateDemandeEnvoiSchema = z.object({
  destinataire: z.string().min(1).optional(),
  siteDestinataire: z.string().optional(),
  motif: z.string().optional(),
  dateSouhaitee: z.coerce.date().optional(),
  commentaire: z.string().optional(),
  statut: z
    .enum([
      StatutDemande.BROUILLON,
      StatutDemande.ENVOYEE,
      StatutDemande.EN_TRANSIT,
      StatutDemande.RECUE,
      StatutDemande.CLOTUREE,
      StatutDemande.ANNULEE,
    ])
    .optional(),
});

export type CreateDemandeEnvoiInput = z.infer<typeof createDemandeEnvoiSchema>;
export type UpdateDemandeEnvoiInput = z.infer<typeof updateDemandeEnvoiSchema>;
