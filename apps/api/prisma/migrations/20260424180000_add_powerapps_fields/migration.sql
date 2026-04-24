-- Maquettes: classification fields from PowerApps
ALTER TABLE "maquettes" ADD COLUMN "composant" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "categorie" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "forme" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "type_assemblage" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "matiere" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "procedures" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "type_controle" TEXT;

-- Maquettes: flags
ALTER TABLE "maquettes" ADD COLUMN "reference_asn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "maquettes" ADD COLUMN "hors_patrimoine" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "maquettes" ADD COLUMN "informations_certifiees" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "maquettes" ADD COLUMN "en_transit" BOOLEAN NOT NULL DEFAULT false;

-- Maquettes: dimensions
ALTER TABLE "maquettes" ADD COLUMN "longueur" DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "largeur" DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "hauteur" DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "dn" DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "epaisseur_paroi" DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "poids" DOUBLE PRECISION;
ALTER TABLE "maquettes" ADD COLUMN "quantite" INTEGER;

-- Maquettes: extra info
ALTER TABLE "maquettes" ADD COLUMN "commentaires" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "pole_entite" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "entreprise" TEXT;
ALTER TABLE "maquettes" ADD COLUMN "valeur_financiere" DOUBLE PRECISION;

-- Materiels: classification fields from PowerApps
ALTER TABLE "materiels" ADD COLUMN "modele" TEXT;
ALTER TABLE "materiels" ADD COLUMN "type_traducteur" TEXT;
ALTER TABLE "materiels" ADD COLUMN "type_end" TEXT;
ALTER TABLE "materiels" ADD COLUMN "groupe" TEXT;
ALTER TABLE "materiels" ADD COLUMN "fournisseur" TEXT;

-- Materiels: calibration
ALTER TABLE "materiels" ADD COLUMN "validite_etalonnage" INTEGER;
ALTER TABLE "materiels" ADD COLUMN "soumis_verification" BOOLEAN NOT NULL DEFAULT false;

-- Materiels: loan
ALTER TABLE "materiels" ADD COLUMN "en_pret" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "materiels" ADD COLUMN "motif_pret" TEXT;
ALTER TABLE "materiels" ADD COLUMN "date_retour_pret" TIMESTAMP(3);

-- Materiels: completeness and status
ALTER TABLE "materiels" ADD COLUMN "completude" TEXT;
ALTER TABLE "materiels" ADD COLUMN "information_verifiee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "materiels" ADD COLUMN "produits_chimiques" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "materiels" ADD COLUMN "commentaires" TEXT;
ALTER TABLE "materiels" ADD COLUMN "entreprise" TEXT;

-- Demandes d'envoi: additional fields from PowerApps
ALTER TABLE "demandes_envoi" ADD COLUMN "urgence" TEXT;
ALTER TABLE "demandes_envoi" ADD COLUMN "justification_urgence" TEXT;
ALTER TABLE "demandes_envoi" ADD COLUMN "contact" TEXT;
ALTER TABLE "demandes_envoi" ADD COLUMN "contact_telephone" TEXT;
ALTER TABLE "demandes_envoi" ADD COLUMN "adresse_destination" TEXT;
ALTER TABLE "demandes_envoi" ADD COLUMN "convention" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "demandes_envoi" ADD COLUMN "souscription_assurance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "demandes_envoi" ADD COLUMN "produits_chimiques" BOOLEAN NOT NULL DEFAULT false;
