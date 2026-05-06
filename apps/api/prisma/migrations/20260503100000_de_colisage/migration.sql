-- Évolution formulaire demande d'envoi : colisage (poids + dimensions)

ALTER TABLE "demandes_envoi" ADD COLUMN "poids_colisage"     DOUBLE PRECISION;
ALTER TABLE "demandes_envoi" ADD COLUMN "longueur_colisage"  DOUBLE PRECISION;
ALTER TABLE "demandes_envoi" ADD COLUMN "largeur_colisage"   DOUBLE PRECISION;
ALTER TABLE "demandes_envoi" ADD COLUMN "hauteur_colisage"   DOUBLE PRECISION;
