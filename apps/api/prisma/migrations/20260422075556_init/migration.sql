-- CreateEnum
CREATE TYPE "etat_maquette" AS ENUM ('STOCK', 'EMPRUNTEE', 'EN_CONTROLE', 'REBUT', 'EN_REPARATION', 'ENVOYEE');

-- CreateEnum
CREATE TYPE "etat_materiel" AS ENUM ('DISPONIBLE', 'EN_SERVICE', 'EN_REPARATION', 'REBUT', 'PRETE', 'ENVOYEE');

-- CreateEnum
CREATE TYPE "severite_defaut" AS ENUM ('MINEUR', 'MAJEUR', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "type_demande" AS ENUM ('MATERIEL', 'MAQUETTE', 'MUTUALISEE');

-- CreateEnum
CREATE TYPE "statut_demande" AS ENUM ('BROUILLON', 'ENVOYEE', 'EN_TRANSIT', 'RECUE', 'CLOTUREE', 'ANNULEE');

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "azure_ad_oid" TEXT,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_roles" (
    "agent_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" INTEGER,

    CONSTRAINT "agent_roles_pkey" PRIMARY KEY ("agent_id","role_id")
);

-- CreateTable
CREATE TABLE "maquettes" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "etat" "etat_maquette" NOT NULL DEFAULT 'STOCK',
    "localisation" TEXT,
    "description" TEXT,
    "site" TEXT,
    "type_maquette" TEXT,
    "maquette_mere_id" INTEGER,
    "proprietaire_id" INTEGER,
    "emprunteur_id" INTEGER,
    "date_emprunt" TIMESTAMP(3),
    "date_retour" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "maquettes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiels" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "etat" "etat_materiel" NOT NULL DEFAULT 'DISPONIBLE',
    "type_materiel" TEXT,
    "numero_serie" TEXT,
    "localisation" TEXT,
    "site" TEXT,
    "description" TEXT,
    "date_etalonnage" TIMESTAMP(3),
    "date_prochain_etalonnage" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "materiels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defauts" (
    "id" SERIAL NOT NULL,
    "maquette_id" INTEGER NOT NULL,
    "type_defaut" TEXT NOT NULL,
    "position" TEXT,
    "dimension" TEXT,
    "description" TEXT,
    "severite" "severite_defaut" NOT NULL DEFAULT 'MINEUR',
    "detecte_le" DATE NOT NULL,
    "detecte_par_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defauts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_envoi" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "type" "type_demande" NOT NULL,
    "demandeur_id" INTEGER NOT NULL,
    "destinataire" TEXT NOT NULL,
    "site_destinataire" TEXT,
    "motif" TEXT,
    "date_souhaitee" DATE,
    "statut" "statut_demande" NOT NULL DEFAULT 'BROUILLON',
    "date_envoi" TIMESTAMP(3),
    "date_reception" TIMESTAMP(3),
    "commentaire" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandes_envoi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demande_envoi_lignes" (
    "id" SERIAL NOT NULL,
    "demande_id" INTEGER NOT NULL,
    "materiel_id" INTEGER,
    "maquette_id" INTEGER,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "recue" BOOLEAN NOT NULL DEFAULT false,
    "date_reception" TIMESTAMP(3),

    CONSTRAINT "demande_envoi_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements" (
    "id" SERIAL NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "acteur_id" INTEGER,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichiers" (
    "id" SERIAL NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "blob_key" TEXT NOT NULL,
    "nom_original" TEXT,
    "mime_type" TEXT,
    "taille_octets" INTEGER,
    "type_fichier" TEXT,
    "uploaded_by" INTEGER,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fichiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_azure_ad_oid_key" ON "agents"("azure_ad_oid");

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "maquettes_reference_key" ON "maquettes"("reference");

-- CreateIndex
CREATE INDEX "maquettes_etat_idx" ON "maquettes"("etat");

-- CreateIndex
CREATE UNIQUE INDEX "materiels_reference_key" ON "materiels"("reference");

-- CreateIndex
CREATE INDEX "materiels_etat_idx" ON "materiels"("etat");

-- CreateIndex
CREATE INDEX "defauts_maquette_id_idx" ON "defauts"("maquette_id");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_envoi_numero_key" ON "demandes_envoi"("numero");

-- CreateIndex
CREATE INDEX "demandes_envoi_statut_idx" ON "demandes_envoi"("statut");

-- CreateIndex
CREATE INDEX "evenements_entity_type_entity_id_occurred_at_idx" ON "evenements"("entity_type", "entity_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "evenements_acteur_id_occurred_at_idx" ON "evenements"("acteur_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "fichiers_blob_key_key" ON "fichiers"("blob_key");

-- CreateIndex
CREATE INDEX "fichiers_entity_type_entity_id_idx" ON "fichiers"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "agent_roles" ADD CONSTRAINT "agent_roles_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_roles" ADD CONSTRAINT "agent_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_roles" ADD CONSTRAINT "agent_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquettes" ADD CONSTRAINT "maquettes_maquette_mere_id_fkey" FOREIGN KEY ("maquette_mere_id") REFERENCES "maquettes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquettes" ADD CONSTRAINT "maquettes_proprietaire_id_fkey" FOREIGN KEY ("proprietaire_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquettes" ADD CONSTRAINT "maquettes_emprunteur_id_fkey" FOREIGN KEY ("emprunteur_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquettes" ADD CONSTRAINT "maquettes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquettes" ADD CONSTRAINT "maquettes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiels" ADD CONSTRAINT "materiels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiels" ADD CONSTRAINT "materiels_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defauts" ADD CONSTRAINT "defauts_maquette_id_fkey" FOREIGN KEY ("maquette_id") REFERENCES "maquettes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defauts" ADD CONSTRAINT "defauts_detecte_par_id_fkey" FOREIGN KEY ("detecte_par_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_envoi" ADD CONSTRAINT "demandes_envoi_demandeur_id_fkey" FOREIGN KEY ("demandeur_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demande_envoi_lignes" ADD CONSTRAINT "demande_envoi_lignes_demande_id_fkey" FOREIGN KEY ("demande_id") REFERENCES "demandes_envoi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demande_envoi_lignes" ADD CONSTRAINT "demande_envoi_lignes_materiel_id_fkey" FOREIGN KEY ("materiel_id") REFERENCES "materiels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demande_envoi_lignes" ADD CONSTRAINT "demande_envoi_lignes_maquette_id_fkey" FOREIGN KEY ("maquette_id") REFERENCES "maquettes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_acteur_id_fkey" FOREIGN KEY ("acteur_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichiers" ADD CONSTRAINT "fichiers_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
