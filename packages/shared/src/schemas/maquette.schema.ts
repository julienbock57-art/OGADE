import { z } from "zod";
import { EtatMaquette } from "../types/maquette";

export const createMaquetteSchema = z.object({
  reference: z.string().min(1),
  libelle: z.string().min(1),
  typeMaquette: z.string().optional(),
  localisation: z.string().optional(),
  site: z.string().optional(),
  description: z.string().optional(),
  maquetteMereId: z.number().optional(),
});

export const updateMaquetteSchema = createMaquetteSchema.partial().extend({
  etat: z
    .enum([
      EtatMaquette.STOCK,
      EtatMaquette.EMPRUNTEE,
      EtatMaquette.EN_CONTROLE,
      EtatMaquette.REBUT,
      EtatMaquette.EN_REPARATION,
      EtatMaquette.ENVOYEE,
    ])
    .optional(),
  emprunteurId: z.number().nullable().optional(),
  dateEmprunt: z.coerce.date().nullable().optional(),
  dateRetour: z.coerce.date().nullable().optional(),
});

export type CreateMaquetteInput = z.infer<typeof createMaquetteSchema>;
export type UpdateMaquetteInput = z.infer<typeof updateMaquetteSchema>;
