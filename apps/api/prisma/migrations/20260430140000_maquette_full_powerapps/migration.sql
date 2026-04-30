-- Maquette : champs PowerApps complets (brief utilisateur)
ALTER TABLE "maquettes" ADD COLUMN "numero_fiec"               VARCHAR(255);
ALTER TABLE "maquettes" ADD COLUMN "reference_unique"          INTEGER UNIQUE;
ALTER TABLE "maquettes" ADD COLUMN "vie_maquette"              TEXT;
ALTER TABLE "maquettes" ADD COLUMN "historique_texte"          TEXT;
ALTER TABLE "maquettes" ADD COLUMN "description_defauts"       TEXT;
ALTER TABLE "maquettes" ADD COLUMN "complements_localisation"  TEXT;
ALTER TABLE "maquettes" ADD COLUMN "lien_ecm"                  TEXT;
ALTER TABLE "maquettes" ADD COLUMN "lien_ecm_rff"              TEXT;
ALTER TABLE "maquettes" ADD COLUMN "lien_photos"               TEXT;
ALTER TABLE "maquettes" ADD COLUMN "pieces"                    TEXT;
ALTER TABLE "maquettes" ADD COLUMN "produits_chimiques"        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "maquettes" ADD COLUMN "emprunteur_entreprise"     VARCHAR(255);
ALTER TABLE "maquettes" ADD COLUMN "referent_id"               INTEGER REFERENCES "agents"("id");
ALTER TABLE "maquettes" ADD COLUMN "amortissement"             TEXT;
ALTER TABLE "maquettes" ADD COLUMN "duree_vie"                 INTEGER;

-- Colisage
ALTER TABLE "maquettes" ADD COLUMN "colisage_longueur"      DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "colisage_largeur"       DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "colisage_hauteur"       DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "colisage_poids"         DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "colisage_description"   TEXT;

-- Localisation détaillée
ALTER TABLE "maquettes" ADD COLUMN "localisation_salle"     TEXT;
ALTER TABLE "maquettes" ADD COLUMN "localisation_rayonnage" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "adresse_num_voie"       VARCHAR(255);
ALTER TABLE "maquettes" ADD COLUMN "adresse_nom_voie"       VARCHAR(255);
ALTER TABLE "maquettes" ADD COLUMN "adresse_code_postal"    VARCHAR(32);
ALTER TABLE "maquettes" ADD COLUMN "adresse_ville"          VARCHAR(255);
ALTER TABLE "maquettes" ADD COLUMN "adresse_pays"           VARCHAR(255);
ALTER TABLE "maquettes" ADD COLUMN "adresse_site"           VARCHAR(255);

CREATE INDEX "maquettes_referent_id_idx" ON "maquettes"("referent_id");
