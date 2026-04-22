-- CreateTable
CREATE TABLE "agents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "azure_ad_oid" TEXT,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "agent_roles" (
    "agent_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "granted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" INTEGER,

    PRIMARY KEY ("agent_id", "role_id"),
    CONSTRAINT "agent_roles_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agent_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maquettes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "etat" TEXT NOT NULL DEFAULT 'STOCK',
    "localisation" TEXT,
    "description" TEXT,
    "site" TEXT,
    "type_maquette" TEXT,
    "maquette_mere_id" INTEGER,
    "proprietaire_id" INTEGER,
    "emprunteur_id" INTEGER,
    "date_emprunt" DATETIME,
    "date_retour" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "deleted_at" DATETIME,
    CONSTRAINT "maquettes_maquette_mere_id_fkey" FOREIGN KEY ("maquette_mere_id") REFERENCES "maquettes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "maquettes_proprietaire_id_fkey" FOREIGN KEY ("proprietaire_id") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "maquettes_emprunteur_id_fkey" FOREIGN KEY ("emprunteur_id") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "maquettes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "maquettes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "materiels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "etat" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "type_materiel" TEXT,
    "numero_serie" TEXT,
    "localisation" TEXT,
    "site" TEXT,
    "description" TEXT,
    "date_etalonnage" DATETIME,
    "date_prochain_etalonnage" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "deleted_at" DATETIME,
    CONSTRAINT "materiels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "materiels_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "defauts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "maquette_id" INTEGER NOT NULL,
    "type_defaut" TEXT NOT NULL,
    "position" TEXT,
    "dimension" TEXT,
    "description" TEXT,
    "severite" TEXT NOT NULL DEFAULT 'MINEUR',
    "detecte_le" DATETIME NOT NULL,
    "detecte_par_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "defauts_maquette_id_fkey" FOREIGN KEY ("maquette_id") REFERENCES "maquettes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "defauts_detecte_par_id_fkey" FOREIGN KEY ("detecte_par_id") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "demandes_envoi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "demandeur_id" INTEGER NOT NULL,
    "destinataire" TEXT NOT NULL,
    "site_destinataire" TEXT,
    "motif" TEXT,
    "date_souhaitee" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "date_envoi" DATETIME,
    "date_reception" DATETIME,
    "commentaire" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "demandes_envoi_demandeur_id_fkey" FOREIGN KEY ("demandeur_id") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "demande_envoi_lignes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demande_id" INTEGER NOT NULL,
    "materiel_id" INTEGER,
    "maquette_id" INTEGER,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "recue" BOOLEAN NOT NULL DEFAULT false,
    "date_reception" DATETIME,
    CONSTRAINT "demande_envoi_lignes_demande_id_fkey" FOREIGN KEY ("demande_id") REFERENCES "demandes_envoi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "demande_envoi_lignes_materiel_id_fkey" FOREIGN KEY ("materiel_id") REFERENCES "materiels" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "demande_envoi_lignes_maquette_id_fkey" FOREIGN KEY ("maquette_id") REFERENCES "maquettes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evenements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" TEXT,
    "acteur_id" INTEGER,
    "occurred_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evenements_acteur_id_fkey" FOREIGN KEY ("acteur_id") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fichiers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "blob_key" TEXT NOT NULL,
    "nom_original" TEXT,
    "mime_type" TEXT,
    "taille_octets" INTEGER,
    "type_fichier" TEXT,
    "uploaded_by" INTEGER,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fichiers_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
CREATE INDEX "evenements_entity_type_entity_id_idx" ON "evenements"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "evenements_acteur_id_idx" ON "evenements"("acteur_id");

-- CreateIndex
CREATE UNIQUE INDEX "fichiers_blob_key_key" ON "fichiers"("blob_key");

-- CreateIndex
CREATE INDEX "fichiers_entity_type_entity_id_idx" ON "fichiers"("entity_type", "entity_id");
