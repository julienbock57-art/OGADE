-- Referentiels: generic lookup table for all dropdown values
CREATE TABLE "referentiels" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "referentiels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referentiels_type_code_key" ON "referentiels"("type", "code");
CREATE INDEX "referentiels_type_idx" ON "referentiels"("type");

-- Sites: with full address
CREATE TABLE "ref_sites" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "adresse" TEXT,
    "code_postal" TEXT,
    "ville" TEXT,
    "pays" TEXT DEFAULT 'France',
    "telephone" TEXT,
    "email" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ref_sites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ref_sites_code_key" ON "ref_sites"("code");

-- Entreprises: companies with full address (entreprises, fournisseurs, prestataires)
CREATE TABLE "ref_entreprises" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ENTREPRISE',
    "adresse" TEXT,
    "code_postal" TEXT,
    "ville" TEXT,
    "pays" TEXT DEFAULT 'France',
    "telephone" TEXT,
    "email" TEXT,
    "siret" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ref_entreprises_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ref_entreprises_code_key" ON "ref_entreprises"("code");
