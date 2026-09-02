#!/usr/bin/env bash
#
# Fabrique l'archive à transférer sur le serveur EDF.
#
# À exécuter depuis un poste disposant du dépôt Git — le serveur n'y ayant
# pas accès, le numéro de version et le hachage du commit sont figés ici,
# dans un fichier lu ensuite par build.sh.
#
# Usage :  ./deploy/edf/make-release.sh [répertoire_de_sortie]

set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SORTIE="${1:-$RACINE/dist-release}"

cd "$RACINE"

# ─── Version ───────────────────────────────────────────────────
# vite.config.ts déduit la version du dernier commit de fusion et le hachage
# du commit courant. Sans dépôt Git, il retomberait sur « 1.0.0 » et « dev ».
# On capture donc les deux valeurs maintenant.
NUMERO_PR="0"
COMMIT="inconnu"
if git rev-parse --git-dir >/dev/null 2>&1; then
  SUJET="$(git log --merges --grep='Merge pull request' -n 1 --pretty=format:%s 2>/dev/null || true)"
  if [[ "$SUJET" =~ \#([0-9]+) ]]; then
    NUMERO_PR="${BASH_REMATCH[1]}"
  fi
  COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo inconnu)"
else
  echo "Avertissement : dépôt Git introuvable, la version affichée sera 1.0.0." >&2
fi

HORODATAGE="$(date +%Y%m%d-%H%M%S)"
NOM="ogade-1.0.${NUMERO_PR}-${HORODATAGE}"

mkdir -p "$SORTIE"

# Ces valeurs seront réexportées par build.sh au moment de la compilation.
cat > "$RACINE/deploy/edf/RELEASE_VERSION" <<EOF
# Généré par make-release.sh — ne pas modifier à la main.
APP_PR_NUMBER=${NUMERO_PR}
GITHUB_SHA=${COMMIT}
EOF

# ─── Archive ───────────────────────────────────────────────────
# Liste blanche plutôt que liste d'exclusions : le dépôt contient des
# éléments sans rapport avec l'exécution — notamment l'export PowerApps
# d'origine, qui pèse à lui seul plus de 200 Mo. N'embarquer que le
# nécessaire évite d'alourdir le transfert et de diffuser des documents
# internes sur le serveur.
CONTENU=(
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  tsconfig.base.json
  apps
  packages
  deploy
)

for element in "${CONTENU[@]}"; do
  if [ ! -e "$RACINE/$element" ]; then
    echo "ERREUR : élément requis introuvable — $element" >&2
    exit 1
  fi
done

echo "Création de ${SORTIE}/${NOM}.tar.gz …"
tar -czf "${SORTIE}/${NOM}.tar.gz" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='.env.local' \
  --transform "s,^,${NOM}/," \
  "${CONTENU[@]}"

rm -f "$RACINE/deploy/edf/RELEASE_VERSION"

TAILLE="$(du -h "${SORTIE}/${NOM}.tar.gz" | cut -f1)"

cat <<EOF

Archive prête : ${SORTIE}/${NOM}.tar.gz  (${TAILLE})
  version  : 1.0.${NUMERO_PR}
  commit   : ${COMMIT}

Transfert puis installation :
  scp ${SORTIE}/${NOM}.tar.gz utilisateur@serveur-edf:/tmp/
  ssh utilisateur@serveur-edf
  sudo tar -xzf /tmp/${NOM}.tar.gz -C /opt
  sudo rm -rf /opt/ogade && sudo mv /opt/${NOM} /opt/ogade
  sudo chown -R ogade:ogade /opt/ogade
  sudo chmod +x /opt/ogade/deploy/edf/*.sh
  sudo -u ogade bash /opt/ogade/deploy/edf/build.sh

Détail complet : deploy/edf/DEPLOIEMENT.md
EOF
