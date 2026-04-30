-- Per-defect dimensions and plan coordinates (from PowerApps + maquette design brief)
ALTER TABLE "defauts" ADD COLUMN "longueur"   DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "largeur"    DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "profondeur" DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "diametre"   DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "cote"       VARCHAR(64);
ALTER TABLE "defauts" ADD COLUMN "certifie"   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "defauts" ADD COLUMN "pos_x"      DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "pos_y"      DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "couleur"    VARCHAR(64);
