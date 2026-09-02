#!/usr/bin/env bash
#
# Prepare l'archive a envoyer sur le serveur EDF.
#
# A lancer depuis un poste qui a le depot Git. Comme le serveur ne l'a pas, on
# fige ici le numero de version et le hash du commit dans un petit fichier que
# build.sh relira ensuite.
#
# Usage :  bash ./deploy/edf/make-release.sh [dossier_de_sortie]

set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SORTIE="${1:-$RACINE/dist-release}"

cd "$RACINE"

# --- Version ---
# vite.config.ts va chercher la version dans le dernier commit de merge et le
# hash du commit courant. Sans depot Git il retombe sur "1.0.0" et "dev", donc
# on recupere les deux valeurs maintenant, tant qu'on les a.
NUMERO_PR="0"
COMMIT="inconnu"
if git rev-parse --git-dir >/dev/null 2>&1; then
  SUJET="$(git log --merges --grep='Merge pull request' -n 1 --pretty=format:%s 2>/dev/null || true)"
  if [[ "$SUJET" =~ \#([0-9]+) ]]; then
    NUMERO_PR="${BASH_REMATCH[1]}"
  fi
  COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo inconnu)"
else
  echo "Attention : pas de depot Git ici, la version affichee sera 1.0.0." >&2
fi

HORODATAGE="$(date +%Y%m%d-%H%M%S)"
NOM="ogade-1.0.${NUMERO_PR}-${HORODATAGE}"

mkdir -p "$SORTIE"

# build.sh reexportera ces valeurs au moment de compiler.
cat > "$RACINE/deploy/edf/RELEASE_VERSION" <<EOF
# Généré par make-release.sh — ne pas modifier à la main.
APP_PR_NUMBER=${NUMERO_PR}
GITHUB_SHA=${COMMIT}
EOF

# --- Archive ---
# On liste ce qu'on prend, plutot que ce qu'on exclut. Le depot contient des
# trucs qui n'ont rien a faire la : notamment l'export PowerApps d'origine, qui
# pese a lui tout seul plus de 200 Mo. En ne prenant que le necessaire on evite
# d'alourdir le transfert et de balader des documents internes sur le serveur.
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
    echo "ERREUR : il manque $element" >&2
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

Ensuite, transfert et installation :
  scp ${SORTIE}/${NOM}.tar.gz utilisateur@serveur-edf:/tmp/
  ssh utilisateur@serveur-edf
  sudo tar -xzf /tmp/${NOM}.tar.gz -C /opt
  sudo rm -rf /opt/ogade && sudo mv /opt/${NOM} /opt/ogade
  sudo chown -R ogade:ogade /opt/ogade
  sudo chmod +x /opt/ogade/deploy/edf/*.sh
  sudo -u ogade bash /opt/ogade/deploy/edf/build.sh

Le detail complet est dans deploy/edf/DEPLOIEMENT.md
EOF
