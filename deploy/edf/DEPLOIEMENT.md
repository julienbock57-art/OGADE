# Déploiement OGADE — serveur de développement EDF

Installation sans Docker, sur Debian/Ubuntu, avec compilation sur le serveur.

Le serveur n'ayant pas accès au dépôt Git, l'application est livrée sous
forme d'archive fabriquée depuis un poste disposant du dépôt.

---

## 1. Prérequis

**Sur le serveur**

| Élément | Détail |
|---|---|
| Node.js | ≥ 20 (cible : 24.20.0) |
| pnpm | 10.33.0 — `npm install -g pnpm@10.33.0` |
| openssl | Requis par le moteur de requêtes Prisma |
| Accès au registre npm | Direct ou via miroir d'entreprise, pour `pnpm install` |
| PostgreSQL | Instance accessible, base et utilisateur créés |
| nginx | Pour HTTPS (voir §7) |

> **Corepack** est volontairement écarté au profit d'une installation directe
> de pnpm : sa version varie d'une image à l'autre et son comportement en
> `--frozen-lockfile` est plus strict.

**Base de données** — PostgreSQL est obligatoire : le schéma s'appuie sur
`BYTEA`, `JSONB`, `SERIAL` et sur la recherche insensible à la casse de
Prisma. Aucun autre moteur ne convient.

```sql
CREATE USER ogade WITH PASSWORD '...';
CREATE DATABASE ogade OWNER ogade;
```

Sur une base vierge, les migrations créent le schéma **et** alimentent les
référentiels, les CNPE et un jeu de matériels d'exemple : deux migrations
sont porteuses de données. Prévoir un nettoyage si ces exemples ne sont pas
souhaités.

---

## 2. Préparation du serveur

```bash
sudo useradd --system --home /opt/ogade --shell /usr/sbin/nologin ogade
sudo mkdir -p /opt/ogade /etc/ogade
sudo chown ogade:ogade /opt/ogade
```

---

## 3. Fabrication de l'archive (depuis votre poste)

```bash
bash ./deploy/edf/make-release.sh
```

Produit `dist-release/ogade-1.0.<n>-<horodatage>.tar.gz` (environ 350 Ko).

Le script fige au passage le numéro de version et le hachage du commit dans
`deploy/edf/RELEASE_VERSION`. Sans cela, l'interface afficherait `1.0.0` /
`dev`, `vite.config.ts` les déduisant normalement de Git — absent du serveur.

L'archive ne contient que le nécessaire à la compilation. L'export PowerApps
d'origine et la documentation interne en sont exclus.

---

## 4. Installation

```bash
scp dist-release/ogade-*.tar.gz utilisateur@serveur-edf:/tmp/
ssh utilisateur@serveur-edf

sudo tar -xzf /tmp/ogade-*.tar.gz -C /opt
sudo rm -rf /opt/ogade
sudo mv /opt/ogade-1.0.*-* /opt/ogade
sudo chown -R ogade:ogade /opt/ogade
sudo chmod +x /opt/ogade/deploy/edf/*.sh
```

> Le bit exécutable n'est pas conservé par toutes les chaînes de
> récupération du dépôt ; d'où le `chmod`. À défaut, invoquer les scripts
> via `bash chemin/script.sh`.

---

## 5. Configuration

```bash
sudo cp /opt/ogade/deploy/edf/ogade.env.example /etc/ogade/ogade.env
sudo chown root:ogade /etc/ogade/ogade.env
sudo chmod 640 /etc/ogade/ogade.env
sudo nano /etc/ogade/ogade.env
```

À renseigner au minimum : `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `API_URL`.

> **L'application ne lit aucun fichier `.env`.** Ni `@nestjs/config` ni
> `dotenv` ne sont présents : les variables doivent provenir de
> l'environnement du processus, donc de `EnvironmentFile` côté systemd.
>
> La CLI Prisma, elle, lit bien un `.env`. D'où un symptôme déroutant :
> les migrations aboutissent alors que l'application ne voit pas la base.

> **`API_URL` est encodée dans les QR codes générés.** Une valeur erronée
> rend inutilisables toutes les étiquettes imprimées, et la corriger
> n'actualise pas celles déjà en circulation.

---

## 6. Compilation

```bash
sudo -u ogade bash /opt/ogade/deploy/edf/build.sh
```

Enchaîne `pnpm install --frozen-lockfile`, la génération du client Prisma et
la compilation dans l'ordre imposé **shared → web → api** : l'API importe
des valeurs — schémas Zod — depuis `@ogade/shared`, et pas seulement des
types.

L'installation inclut les dépendances de développement : elles sont
nécessaires à la compilation, et la CLI Prisma sert ensuite aux migrations à
chaque démarrage.

---

## 7. Service systemd

```bash
sudo cp /opt/ogade/deploy/edf/ogade.service /etc/systemd/system/
command -v node          # vérifier que le chemin correspond à ExecStart
sudo systemctl daemon-reload
sudo systemctl enable --now ogade
sudo systemctl status ogade
```

Les migrations sont appliquées par `ExecStartPre` avant chaque démarrage.
**Un échec interrompt le démarrage** — contrairement à la commande de
l'image Docker, qui masque les erreurs et démarre sur une base
potentiellement non migrée. Un service arrêté et diagnosticable vaut mieux
qu'un service actif écrivant dans un schéma incohérent.

> Ne pas dupliquer le service : la tâche planifiée des relances d'étalonnage
> s'exécute dans le processus. Deux instances enverraient les notifications
> en double.

---

## 8. Proxy inverse

```bash
sudo cp /opt/ogade/deploy/edf/nginx-ogade.conf /etc/nginx/sites-available/ogade
sudo ln -s /etc/nginx/sites-available/ogade /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> **HTTPS n'est pas optionnel.** Le scanner de QR codes repose sur
> `getUserMedia()`, que les navigateurs réservent aux contextes sécurisés.
> En HTTP simple, la caméra ne s'ouvre pas, sans message explicite.

`client_max_body_size` doit rester supérieur ou égal à `MAX_UPLOAD_MB`
(défaut : 25 Mo). Si nginx est plus restrictif, il rejette la requête avant
l'application et le message indiquant la limite n'est jamais renvoyé.

---

## 9. Vérification

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/api/health   # 200
curl -s http://127.0.0.1:3000/ | head -c 20                                 # <!DOCTYPE html>
journalctl -u ogade -n 30 --no-pager
```

Le journal de démarrage indique le mode retenu :

```
LOG [Bootstrap] OGADE démarré — port 3000
LOG [Bootstrap] Mode : développement
LOG [Bootstrap] Documentation API : /api/docs
```

Un avertissement « Interface web introuvable » signale que `apps/web/dist`
est absent : l'API répond, mais aucune page ne s'affiche. C'est le mode de
défaillance le plus déroutant — relancer `build.sh`.

---

## 10. Mise à jour

```bash
# Poste :
bash ./deploy/edf/make-release.sh
scp dist-release/ogade-*.tar.gz utilisateur@serveur-edf:/tmp/

# Serveur :
sudo systemctl stop ogade
sudo mv /opt/ogade /opt/ogade.precedent
sudo tar -xzf /tmp/ogade-*.tar.gz -C /opt
sudo mv /opt/ogade-1.0.*-* /opt/ogade
sudo chown -R ogade:ogade /opt/ogade
sudo chmod +x /opt/ogade/deploy/edf/*.sh
sudo -u ogade bash /opt/ogade/deploy/edf/build.sh
sudo systemctl start ogade
```

Retour arrière : `sudo rm -rf /opt/ogade && sudo mv /opt/ogade.precedent /opt/ogade`,
puis redémarrage. Attention : les migrations déjà appliquées ne sont pas
annulées — un retour arrière ne convient que si la version précédente
tolère le schéma en place.

`/etc/ogade/ogade.env` n'est pas touché par la mise à jour.

---

## 11. Sécurité — à assumer explicitement

`NODE_ENV` est laissé **non défini** sur ce serveur : l'application se
comporte alors exactement comme l'existant, sans blocage.

Conséquence : **l'en-tête HTTP `x-user-email` suffit pour être authentifié
comme n'importe quel compte, administrateur compris, sans mot de passe.**

```bash
curl -H 'x-user-email: julien.bock57@gmail.com' https://ogade-dev.../api/v1/materiels
```

Ce n'est pas une régression — c'est le comportement actuel de l'application
— mais il est plus exposé sur un réseau d'entreprise que sur un poste local.
**L'accès réseau au serveur doit donc être restreint.**

### Durcir le service

Deux modifications dans `/etc/ogade/ogade.env` :

```bash
NODE_ENV=production
JWT_SECRET=<openssl rand -base64 48>
```

Effets : repli par en-tête désactivé, `JWT_SECRET` obligatoire et vérifié,
Swagger masqué. Les comptes disposent déjà de mots de passe en base, la
connexion locale reste donc fonctionnelle.

Deux points de vigilance :

- **Le démarrage échoue** si `JWT_SECRET` est absent, trop court (< 32
  caractères) ou laissé à la valeur de développement. C'est volontaire.
- Changer `JWT_SECRET` **invalide toutes les sessions ouvertes**.

Pour conserver Swagger malgré tout : `ENABLE_SWAGGER=true`.

---

## 12. Exploitation

**Journaux** — `journalctl -u ogade -f`

**Sauvegarde** — `pg_dump` suffit : les fichiers et photos sont stockés en
base, colonne `BYTEA`. Aucun volume ni répertoire à sauvegarder.

```bash
pg_dump -Fc -h serveur-postgres.interne -U ogade ogade > ogade-$(date +%F).dump
```

En contrepartie, la base grossit au rythme des téléversements : surveiller
sa taille et adapter `MAX_UPLOAD_MB` si nécessaire.

**Accès sortants** — l'application n'en requiert aucun. Deux
fonctionnalités le font depuis le navigateur : la carte de localisation
(tuiles OpenStreetMap) et, si Entra ID est activé, la connexion Microsoft
(`login.microsoftonline.com`). Sans ces accès, la carte reste blanche ;
tout le reste fonctionne.

---

## 13. Point ouvert — Prisma sur Node 24

Prisma 5.22 date de novembre 2024, Node 24 d'avril 2025 : la combinaison
n'est pas couverte officiellement. Le moteur étant un binaire Rust chargé
via Node-API (ABI stable), elle devrait fonctionner, mais cela reste à
confirmer.

**À vérifier en premier sur le serveur cible :**

```bash
cd /opt/ogade
node --version
./apps/api/node_modules/.bin/prisma migrate deploy --schema=./apps/api/prisma/schema.prisma
```

En cas d'échec, monter en Prisma 6, qui prend Node 24 en charge.

Validé ici sur Node 22.22 : 19 migrations appliquées, requêtes et
téléversements fonctionnels. Les `binaryTargets` du `schema.prisma`
(`native`, `debian-openssl-3.0.x`) conviennent à Debian/Ubuntu ; une autre
distribution imposerait d'ajouter la cible correspondante.
