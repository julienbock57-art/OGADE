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
