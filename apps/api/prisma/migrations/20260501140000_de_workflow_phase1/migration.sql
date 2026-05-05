-- Phase 1 du workflow envoi/réception : extension du schéma
-- (validation par référent ligne par ligne, magasinier ↔ site,
--  statuts détaillés sur la demande).

-- ─── 1. DemandeEnvoi : nouveaux champs workflow ──────────────────
ALTER TABLE "demandes_envoi" ADD COLUMN "type_envoi"             VARCHAR(64);
ALTER TABLE "demandes_envoi" ADD COLUMN "site_origine"           VARCHAR(64);
ALTER TABLE "demandes_envoi" ADD COLUMN "magasinier_envoi_id"    INTEGER REFERENCES "agents"("id");
ALTER TABLE "demandes_envoi" ADD COLUMN "magasinier_reception_id" INTEGER REFERENCES "agents"("id");
ALTER TABLE "demandes_envoi" ADD COLUMN "magasinier_retour_id"   INTEGER REFERENCES "agents"("id");
ALTER TABLE "demandes_envoi" ADD COLUMN "date_soumission"        TIMESTAMP;
ALTER TABLE "demandes_envoi" ADD COLUMN "date_validation"        TIMESTAMP;
ALTER TABLE "demandes_envoi" ADD COLUMN "date_expedition"        TIMESTAMP;
ALTER TABLE "demandes_envoi" ADD COLUMN "date_retour_estimee"    TIMESTAMP;
ALTER TABLE "demandes_envoi" ADD COLUMN "date_retour"            TIMESTAMP;
ALTER TABLE "demandes_envoi" ADD COLUMN "date_cloture"           TIMESTAMP;
ALTER TABLE "demandes_envoi" ADD COLUMN "motif_annulation"       TEXT;

-- ─── 2. DemandeEnvoiLigne : workflow ligne par ligne ─────────────
ALTER TABLE "demande_envoi_lignes" ADD COLUMN "statut"          VARCHAR(64) NOT NULL DEFAULT 'EN_ATTENTE';
ALTER TABLE "demande_envoi_lignes" ADD COLUMN "validateur_id"   INTEGER REFERENCES "agents"("id");
ALTER TABLE "demande_envoi_lignes" ADD COLUMN "validee_le"      TIMESTAMP;
ALTER TABLE "demande_envoi_lignes" ADD COLUMN "motif_refus"     TEXT;
ALTER TABLE "demande_envoi_lignes" ADD COLUMN "etat_depart"     VARCHAR(32);
ALTER TABLE "demande_envoi_lignes" ADD COLUMN "etat_reception"  VARCHAR(32);
ALTER TABLE "demande_envoi_lignes" ADD COLUMN "etat_retour"     VARCHAR(32);

-- Bascule : les lignes existantes "recue=true" passent en LIVREE
UPDATE "demande_envoi_lignes" SET "statut" = 'LIVREE' WHERE "recue" = TRUE;

CREATE INDEX "demande_envoi_lignes_statut_idx"
  ON "demande_envoi_lignes"("statut");
CREATE INDEX "demande_envoi_lignes_demande_statut_idx"
  ON "demande_envoi_lignes"("demande_id", "statut");

-- ─── 3. Magasinier ↔ Site (many-to-many) ──────────────────────────
CREATE TABLE "magasinier_sites" (
  "agent_id"  INTEGER NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
  "site_code" VARCHAR(64) NOT NULL,
  "granted_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("agent_id", "site_code")
);
CREATE INDEX "magasinier_sites_site_code_idx" ON "magasinier_sites"("site_code");

-- ─── 4. Seed des rôles workflow ──────────────────────────────────
-- Le rôle MAGASINIER s'applique sur 1+ sites via `magasinier_sites`.
-- DEMANDEUR & VALIDATEUR sont des rôles métier supplémentaires :
-- en pratique le validateur est dérivé du `responsable_id` (matériel)
-- ou du `referent_id` (maquette), donc ces rôles servent uniquement
-- de catégorisation. On les ajoute pour documenter.
INSERT INTO "roles" ("code", "label", "description") VALUES
  ('MAGASINIER',  'Magasinier',
   'Gestionnaire physique des envois sur un ou plusieurs sites EDF — expédie et réceptionne les colis'),
  ('DEMANDEUR',   'Demandeur',
   'Peut créer une demande d''envoi'),
  ('VALIDATEUR',  'Validateur',
   'Référent matériel ou maquette autorisé à valider/refuser une ligne d''envoi')
ON CONFLICT ("code") DO UPDATE SET "label" = EXCLUDED."label", "description" = EXCLUDED."description";
