-- Reservations: pré-réservations de matériel pour une période future
CREATE TABLE "reservations" (
  "id"              SERIAL PRIMARY KEY,
  "numero"          VARCHAR(255) NOT NULL UNIQUE,
  "materiel_id"     INTEGER NOT NULL REFERENCES "materiels"("id") ON DELETE CASCADE,
  "demandeur_id"    INTEGER NOT NULL REFERENCES "agents"("id"),
  "date_debut"      TIMESTAMP NOT NULL,
  "date_fin"        TIMESTAMP NOT NULL,
  "type"            VARCHAR(50)  NOT NULL DEFAULT 'AUTRE',
  "statut"          VARCHAR(50)  NOT NULL DEFAULT 'CONFIRMEE',
  "motif"           TEXT,
  "commentaire"     TEXT,
  "annule_par_id"   INTEGER REFERENCES "agents"("id"),
  "annule_le"       TIMESTAMP,
  "motif_annulation" TEXT,
  "created_at"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "reservations_materiel_id_idx" ON "reservations"("materiel_id");
CREATE INDEX "reservations_statut_idx"      ON "reservations"("statut");
CREATE INDEX "reservations_date_debut_idx"  ON "reservations"("date_debut");
CREATE INDEX "reservations_date_fin_idx"    ON "reservations"("date_fin");
