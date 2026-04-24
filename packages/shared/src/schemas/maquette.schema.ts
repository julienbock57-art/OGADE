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
  composant: z.string().optional(),
  categorie: z.string().optional(),
  forme: z.string().optional(),
  typeAssemblage: z.string().optional(),
  matiere: z.string().optional(),
  procedures: z.string().optional(),
  typeControle: z.string().optional(),
  referenceASN: z.boolean().optional(),
  horsPatrimoine: z.boolean().optional(),
  informationsCertifiees: z.boolean().optional(),
  enTransit: z.boolean().optional(),
  longueur: z.number().optional(),
  largeur: z.number().optional(),
  hauteur: z.number().optional(),
  dn: z.number().optional(),
  epaisseurParoi: z.number().optional(),
  poids: z.number().optional(),
  quantite: z.number().optional(),
  commentaires: z.string().optional(),
  poleEntite: z.string().optional(),
  entreprise: z.string().optional(),
  valeurFinanciere: z.number().optional(),
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
