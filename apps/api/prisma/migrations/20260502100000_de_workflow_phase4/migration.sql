-- Phase 4 du workflow envoi/réception : module magasinier
-- (expédition + bon transport + réception interne + retour)

ALTER TABLE "demandes_envoi" ADD COLUMN "numero_bon_transport"     VARCHAR(128);
ALTER TABLE "demandes_envoi" ADD COLUMN "transporteur"             VARCHAR(255);
ALTER TABLE "demandes_envoi" ADD COLUMN "commentaire_expedition"   TEXT;
ALTER TABLE "demandes_envoi" ADD COLUMN "commentaire_reception"    TEXT;
ALTER TABLE "demandes_envoi" ADD COLUMN "commentaire_retour"       TEXT;
