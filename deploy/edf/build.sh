#!/usr/bin/env bash
#
# Compile OGADE directement sur le serveur.
#
# A lancer avec l'utilisateur de l'appli :
#   sudo -u ogade bash /opt/ogade/deploy/edf/build.sh
#
# Il faut un acces au registre npm (direct ou via le miroir de la boite).
# Le script ne demarre pas le service et ne fait pas les migrations, c'est
# systemd qui s'en occupe.

set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RACINE"

echo "=== Compilation OGADE ==="
echo "Répertoire : $RACINE"

# --- On verifie que tout est la ---
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

# Le moteur Prisma a besoin d'OpenSSL.
if ! command -v openssl >/dev/null 2>&1; then
  echo "Avertissement : openssl est introuvable. Le moteur Prisma peut échouer." >&2
  echo "                Installez-le avec : sudo apt-get install -y openssl" >&2
fi

# --- Version affichee dans l'interface ---
# Le serveur n'a pas de depot Git, donc ces valeurs viennent du fichier ecrit
# par make-release.sh au moment de la fabrication de l'archive.
if [ -f "$RACINE/deploy/edf/RELEASE_VERSION" ]; then
  # shellcheck disable=SC1091
  set -a; . "$RACINE/deploy/edf/RELEASE_VERSION"; set +a
  echo "Version    : 1.0.${APP_PR_NUMBER:-0} (${GITHUB_SHA:-inconnu})"
else
  echo "Version    : indéterminée — l'interface affichera 1.0.0 / dev"
fi

# --- Dependances ---
# On installe tout, y compris les devDependencies : il faut nest-cli, TypeScript
# et Vite pour compiler, et la CLI Prisma servira ensuite aux migrations a
# chaque demarrage du service.
echo
echo "--- Installation des dépendances ---"
pnpm install --frozen-lockfile

# --- Client Prisma ---
# A generer avant de compiler, sinon TypeScript n'a pas les types et ca casse.
echo
echo "--- Génération du client Prisma ---"
pnpm run db:generate

# --- Compilation ---
# L'ordre compte : shared, puis web, puis api. L'API importe de vraies valeurs
# depuis @ogade/shared (les schemas Zod), pas seulement des types.
echo
echo "--- Compilation (shared, web, api) ---"
pnpm run build

# --- On verifie que la compilation a bien tout produit ---
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

L'interface est dans apps/web/dist, c'est l'API qui la sert. Si ce dossier
disparait, le service demarre quand meme mais n'affiche plus aucune page.

Suite :
  sudo systemctl restart ogade
  sudo systemctl status ogade
  journalctl -u ogade -n 50 --no-pager
EOF
