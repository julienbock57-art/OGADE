#!/usr/bin/env bash
#
# Compile OGADE sur le serveur.
#
# À exécuter sous l'utilisateur applicatif, depuis la racine du dépôt :
#   sudo -u ogade bash /opt/ogade/deploy/edf/build.sh
#
# Nécessite un accès au registre npm (direct ou via miroir d'entreprise).
# Ne démarre pas le service et n'applique aucune migration : ces deux
# opérations relèvent de systemd.

set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RACINE"

echo "=== Compilation OGADE ==="
echo "Répertoire : $RACINE"

# ─── Prérequis ──────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
  echo "ERREUR : node est introuvable dans le PATH." >&2
  exit 1
fi

VERSION_NODE="$(node --version)"
MAJEUR_NODE="$(echo "$VERSION_NODE" | sed 's/^v\([0-9]*\).*/\1/')"
echo "Node       : $VERSION_NODE"
if [ "$MAJEUR_NODE" -lt 20 ]; then
  echo "ERREUR : Node 20 ou supérieur est requis (détecté : $VERSION_NODE)." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERREUR : pnpm est introuvable. Installez-le avec :" >&2
  echo "         npm install -g pnpm@10.33.0" >&2
  exit 1
fi
echo "pnpm       : $(pnpm --version)"

# Le moteur de requêtes Prisma est lié à OpenSSL.
if ! command -v openssl >/dev/null 2>&1; then
  echo "Avertissement : openssl est introuvable. Le moteur Prisma peut échouer." >&2
  echo "                Installez-le avec : sudo apt-get install -y openssl" >&2
fi

# ─── Version affichée dans l'interface ────────────────────────────────
# Le serveur n'ayant pas de dépôt Git, ces valeurs proviennent du fichier
# écrit par make-release.sh au moment de la fabrication de l'archive.
if [ -f "$RACINE/deploy/edf/RELEASE_VERSION" ]; then
  # shellcheck disable=SC1091
  set -a; . "$RACINE/deploy/edf/RELEASE_VERSION"; set +a
  echo "Version    : 1.0.${APP_PR_NUMBER:-0} (${GITHUB_SHA:-inconnu})"
else
  echo "Version    : indéterminée — l'interface affichera 1.0.0 / dev"
fi

# ─── Dépendances ────────────────────────────────────────────────
# Installation complète, y compris les dépendances de développement : la
# compilation requiert nest-cli, TypeScript et Vite, et la CLI Prisma sert
# ensuite aux migrations au démarrage du service.
echo
echo "--- Installation des dépendances ---"
pnpm install --frozen-lockfile

# ─── Client Prisma ─────────────────────────────────────────────
# À générer avant la compilation : les services TypeScript s'appuient sur
# les types produits ici.
echo
echo "--- Génération du client Prisma ---"
pnpm run db:generate

# ─── Compilation ───────────────────────────────────────────────
# Ordre imposé : shared -> web -> api. L'API importe des valeurs (schémas
# Zod), et pas seulement des types, depuis @ogade/shared.
echo
echo "--- Compilation (shared, web, api) ---"
pnpm run build

# ─── Contrôles ─────────────────────────────────────────────────
echo
echo "--- Vérifications ---"
ERREURS=0

verifier() {
  if [ -e "$1" ]; then
    echo "  OK      $2"
  else
    echo "  MANQUE  $2  ($1)"
    ERREURS=$((ERREURS + 1))
  fi
}

verifier "$RACINE/packages/shared/dist/index.js"     "bibliothèque partagée"
verifier "$RACINE/apps/api/dist/main.js"             "API compilée"
verifier "$RACINE/apps/web/dist/index.html"          "interface web compilée"
verifier "$RACINE/apps/api/node_modules/.bin/prisma" "CLI Prisma (migrations)"

if [ "$ERREURS" -ne 0 ]; then
  echo
  echo "ERREUR : compilation incomplète ($ERREURS élément(s) manquant(s))." >&2
  exit 1
fi

cat <<EOF

=== Compilation réussie ===

L'interface se trouve dans apps/web/dist et sera servie par l'API : si ce
répertoire venait à manquer, le service démarrerait malgré tout mais
n'afficherait aucune page.

Suite :
  sudo systemctl restart ogade
  sudo systemctl status ogade
  journalctl -u ogade -n 50 --no-pager
EOF
