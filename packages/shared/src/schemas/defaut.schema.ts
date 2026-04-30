import { z } from "zod";

const baseDefautFields = {
  typeDefaut: z.string().min(1),
  position: z.string().optional(),
  dimension: z.string().optional(),
  description: z.string().optional(),
  severite: z.string().optional(),
  longueur: z.number().optional(),
  largeur: z.number().optional(),
  profondeur: z.number().optional(),
  diametre: z.number().optional(),
  cote: z.string().optional(),
  certifie: z.boolean().optional(),
  posX: z.number().min(0).max(100).optional(),
  posY: z.number().min(0).max(100).optional(),
  couleur: z.string().optional(),
  detecteLe: z.coerce.date().optional(),
  detecteParId: z.number().int().optional(),
};

export const createDefautSchema = z.object(baseDefautFields);
export const updateDefautSchema = z.object(baseDefautFields).partial();

export type CreateDefautInput = z.infer<typeof createDefautSchema>;
export type UpdateDefautInput = z.infer<typeof updateDefautSchema>;
