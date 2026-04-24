import { z } from "zod";
import { EtatMateriel } from "../types/materiel";

export const createMaterielSchema = z.object({
  reference: z.string().min(1),
  libelle: z.string().min(1),
  typeMateriel: z.string().optional(),
  numeroSerie: z.string().optional(),
  localisation: z.string().optional(),
  site: z.string().optional(),
  description: z.string().optional(),
  dateEtalonnage: z.coerce.date().optional(),
  dateProchainEtalonnage: z.coerce.date().optional(),
  modele: z.string().optional(),
  typeTraducteur: z.string().optional(),
  typeEND: z.string().optional(),
  groupe: z.string().optional(),
  fournisseur: z.string().optional(),
  validiteEtalonnage: z.number().optional(),
  soumisVerification: z.boolean().optional(),
  enPret: z.boolean().optional(),
  motifPret: z.string().optional(),
  dateRetourPret: z.coerce.date().optional(),
  completude: z.string().optional(),
  informationVerifiee: z.boolean().optional(),
  produitsChimiques: z.boolean().optional(),
  commentaires: z.string().optional(),
  entreprise: z.string().optional(),
});

export const updateMaterielSchema = createMaterielSchema.partial().extend({
  etat: z
    .enum([
      EtatMateriel.DISPONIBLE,
      EtatMateriel.EN_SERVICE,
      EtatMateriel.EN_REPARATION,
      EtatMateriel.REBUT,
      EtatMateriel.PRETE,
      EtatMateriel.ENVOYEE,
    ])
    .optional(),
});

export type CreateMaterielInput = z.infer<typeof createMaterielSchema>;
export type UpdateMaterielInput = z.infer<typeof updateMaterielSchema>;
