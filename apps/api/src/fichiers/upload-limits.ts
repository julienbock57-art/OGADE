// Taille max d'un fichier qu'on accepte à l'upload.
//
// Multer garde tout le fichier en mémoire avant qu'on l'écrive en base (colonne
// BYTEA), donc sans limite un seul gros envoi peut faire tomber le process.
// On met large par défaut pour ne géner personne (photos, PDF), et
// MAX_UPLOAD_MB permet d'ajuster si besoin.
//
// Penser à mettre client_max_body_size au moins aussi haut côté nginx, sinon
// c'est nginx qui refuse avant nous, avec un message beaucoup moins parlant.
const DEFAULT_MAX_UPLOAD_MB = 25;

export const MAX_UPLOAD_MB = ((): number => {
  const raw = process.env.MAX_UPLOAD_MB;
  if (!raw) return DEFAULT_MAX_UPLOAD_MB;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_UPLOAD_MB;

  return parsed;
})();

export const MAX_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_MB * 1024 * 1024);
