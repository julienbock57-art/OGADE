export type Fichier = {
  id: number;
  entityType: string;
  entityId: number;
  blobKey: string;
  nomOriginal: string | null;
  mimeType: string | null;
  tailleOctets: number | null;
  typeFichier: string | null;
  context: string | null;
  demandeEnvoiId: number | null;
  uploadedById: number | null;
  uploadedAt: string | Date;
  uploadedBy?: { id: number; nom: string; prenom: string } | null;
};
