-- Add context and demandeEnvoiId to fichiers table
ALTER TABLE "fichiers" ADD COLUMN "context" TEXT;
ALTER TABLE "fichiers" ADD COLUMN "demande_envoi_id" INTEGER;

-- Add foreign key
ALTER TABLE "fichiers" ADD CONSTRAINT "fichiers_demande_envoi_id_fkey" FOREIGN KEY ("demande_envoi_id") REFERENCES "demandes_envoi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index
CREATE INDEX "fichiers_demande_envoi_id_idx" ON "fichiers"("demande_envoi_id");
