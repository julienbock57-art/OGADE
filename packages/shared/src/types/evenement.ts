export type EvenementPayload = {
  changedFields?: Record<
    string,
    { old: string | number | boolean | null; new: string | number | boolean | null }
  >;
  summary?: string;
};

export type Evenement = {
  id: number;
  entityType: string;
  entityId: number;
  eventType: string;
  payload: EvenementPayload | null;
  acteurId: number | null;
  occurredAt: string | Date;
  acteur?: { id: number; nom: string; prenom: string } | null;
};
