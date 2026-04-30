import { z } from "zod";
import { EtatMaquette } from "../types/maquette";

const baseFields = {
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
  produitsChimiques: z.boolean().optional(),
  longueur: z.number().optional(),
  largeur: z.number().optional(),
  hauteur: z.number().optional(),
  dn: z.number().optional(),
  epaisseurParoi: z.number().optional(),
  poids: z.number().optional(),
  quantite: z.number().int().optional(),
  commentaires: z.string().optional(),
  poleEntite: z.string().optional(),
  entreprise: z.string().optional(),
  valeurFinanciere: z.number().optional(),
  // Extended PowerApps fields
  numeroFIEC: z.string().optional(),
  referenceUnique: z.number().int().optional(),
  vieMaquette: z.string().optional(),
  historiqueTexte: z.string().optional(),
  descriptionDefauts: z.string().optional(),
  complementsLocalisation: z.string().optional(),
  lienECM: z.string().optional(),
  lienECMRFF: z.string().optional(),
  lienPhotos: z.string().optional(),
  pieces: z.string().optional(),
  emprunteurEntreprise: z.string().optional(),
  referentId: z.number().int().optional(),
  amortissement: z.string().optional(),
  dureeVie: z.number().int().optional(),
  // Colisage
  colisageLongueur: z.number().optional(),
  colisageLargeur: z.number().optional(),
  colisageHauteur: z.number().optional(),
  colisagePoids: z.number().optional(),
  colisageDescription: z.string().optional(),
  // Localisation détaillée
  localisationSalle: z.string().optional(),
  localisationRayonnage: z.string().optional(),
  adresseNumVoie: z.string().optional(),
  adresseNomVoie: z.string().optional(),
  adresseCodePostal: z.string().optional(),
  adresseVille: z.string().optional(),
  adressePays: z.string().optional(),
  adresseSite: z.string().optional(),
};

export const createMaquetteSchema = z.object(baseFields);

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
