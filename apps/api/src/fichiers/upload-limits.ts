/**
 * Taille maximale acceptée pour un fichier téléversé.
 *
 * Multer bufferise l'intégralité du fichier en mémoire, puis celui-ci est
 * stocké dans une colonne BYTEA : sans borne, un seul envoi peut saturer le
 * tas Node comme la base. La valeur par défaut est volontairement large afin
 * de couvrir photos et documents courants ; MAX_UPLOAD_MB permet de
 * l'ajuster.
 *
 * Le proxy inverse doit être configuré en cohérence (client_max_body_size
 * pour nginx), faute de quoi il rejettera la requête avant l'application,
 * avec un message bien moins explicite.
 */
const DEFAULT_MAX_UPLOAD_MB = 25;

export const MAX_UPLOAD_MB = ((): number => {
  const raw = process.env.MAX_UPLOAD_MB;
  if (!raw) return DEFAULT_MAX_UPLOAD_MB;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_UPLOAD_MB;

  return parsed;
})();

export const MAX_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_MB * 1024 * 1024);
