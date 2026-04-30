import { z } from "zod";
import { TypeReservation, StatutReservation } from "../types/reservation";

export const createReservationSchema = z
  .object({
    materielId: z.number().int().positive(),
    dateDebut: z.coerce.date(),
    dateFin: z.coerce.date(),
    type: z
      .enum([
        TypeReservation.TRANSFERT_SITE,
        TypeReservation.ETALONNAGE,
        TypeReservation.PRET_EXTERNE,
        TypeReservation.PRET_INTERNE,
        TypeReservation.AUTRE,
      ])
      .default(TypeReservation.AUTRE),
    motif: z.string().optional(),
    commentaire: z.string().optional(),
  })
  .refine((d) => d.dateFin >= d.dateDebut, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["dateFin"],
  });

export const updateReservationSchema = z
  .object({
    dateDebut: z.coerce.date().optional(),
    dateFin: z.coerce.date().optional(),
    type: z
      .enum([
        TypeReservation.TRANSFERT_SITE,
        TypeReservation.ETALONNAGE,
        TypeReservation.PRET_EXTERNE,
        TypeReservation.PRET_INTERNE,
        TypeReservation.AUTRE,
      ])
      .optional(),
    motif: z.string().optional(),
    commentaire: z.string().optional(),
    statut: z
      .enum([
        StatutReservation.CONFIRMEE,
        StatutReservation.HONOREE,
        StatutReservation.ANNULEE,
      ])
      .optional(),
    motifAnnulation: z.string().optional(),
  })
  .refine(
    (d) =>
      d.dateDebut === undefined ||
      d.dateFin === undefined ||
      d.dateFin >= d.dateDebut,
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["dateFin"],
    },
  );

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
