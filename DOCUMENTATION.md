# DOCUMENTATION OGADE — De A à Z, pour quelqu'un qui débute

> Ce document explique **toute** l'application OGADE : ce qu'on a construit, dans quel ordre, comment c'est architecturé, **chaque langage utilisé** (avec un mini-cours), comment c'est conteneurisé et déployé, et toutes les commandes utiles. Lis-le dans l'ordre la première fois, puis utilise la table des matières comme référence.

---

## Sommaire

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Tableau exhaustif de tout le travail (PRs)](#2-tableau-exhaustif-de-tout-le-travail-prs)
3. [Architecture de l'application](#3-architecture-de-lapplication)
4. [Mini-cours : TypeScript & JavaScript](#4-mini-cours--typescript--javascript)
5. [Mini-cours : SQL & Prisma](#5-mini-cours--sql--prisma)
6. [Backend : NestJS expliqué](#6-backend--nestjs-expliqué)
7. [Frontend : React + Vite expliqué](#7-frontend--react--vite-expliqué)
8. [Base de données : PostgreSQL](#8-base-de-données--postgresql)
9. [Conteneurisation : Docker + Docker Compose](#9-conteneurisation--docker--docker-compose)
10. [CI/CD : GitHub Actions → Azure App Service](#10-cicd--github-actions--azure-app-service)
11. [Toutes les commandes utiles](#11-toutes-les-commandes-utiles)
12. [Glossaire des termes](#12-glossaire-des-termes)

---

## 1. Vue d'ensemble du projet

**OGADE** = *Outil de Gestion des Actifs END de la DQI* — application web interne EDF qui remplace une solution PowerApps.

**Ce que l'appli gère :**
- 📦 **Matériels END** (ultrasons, radio, magnéto, ressuage, visuel) — inventaire, étalonnage, prêt
- 🧩 **Maquettes** (tubes, coudes, soudures…) avec défauts artificiels pour qualification CND
- 🔄 **Mouvements / demandes d'envoi** (transferts entre sites, étalonnages, prêts)
- ⭐ **Réservations** : pré-blocage de matériel pour campagnes futures
- 📅 **Calendrier** type Gantt (matériels × jours)
- 📄 **Export PDF** d'une fiche matériel

**Pour qui :**
- *Gestionnaire magasin* : saisit, expédie, réceptionne
- *Référent* : crée mouvements complexes
- *Demandeur* : demande des prêts/étalonnages
- *Admin* : tous droits

**Volumes cibles :** ~500 matériels actifs, ~50 mouvements/mois, ~20 réservations/mois.

---

## 2. Tableau exhaustif de tout le travail (PRs)

Chaque ligne = une *Pull Request* (PR) mergée dans `main`. Une PR est une **proposition de modification** de l'application qui a été revue puis fusionnée avec la branche principale.

### 2.1 Conventions de noms

- **PR #N** : numéro de la pull request GitHub (lien : `https://github.com/julienbock57-art/OGADE/pull/N`)
- **Branche** : nom de la branche Git temporaire utilisée pour la PR
- **Type** : `feat` (nouvelle fonctionnalité), `fix` (correction), `chore` (maintenance), `docs` (documentation)

### 2.2 Phase 1 — Bootstrap et fondations (PRs #1–#36)

Cette phase a posé toute l'infrastructure : schéma de base de données, authentification, modules CRUD pour matériels/maquettes, déploiement Azure.

| PR | Type | Branche | Ce qu'elle a apporté |
|----|------|---------|----------------------|
| #1 | feat | `claude/analyze-power-apps-1YBtF` | Scaffold initial du monorepo (apps/api, apps/web, packages/shared) |
| #2, #3 | fix | `fix/prisma-openssl` | Compatibilité Prisma ↔ OpenSSL dans le conteneur Linux |
| #4–#15 | feat | `claude/analyze-power-apps-1YBtF` | Modules CRUD matériels + maquettes + agents + référentiels + sites + entreprises ; auth Microsoft + JWT local |
| #16–#27 | feat | `claude/analyze-power-apps-1YBtF` | Pages frontend matériels (liste, détail, formulaire wizard), drawer de consultation, KPIs, filtres |
| #28–#36 | feat | `claude/analyze-power-apps-1YBtF` | Champs PowerApps complets matériels, photos/PJ, QR codes, déploiement Azure App Service via Docker |

### 2.3 Phase 2 — Chatbot et NLP (PRs #37–#40)

| PR | Type | Branche | Ce qu'elle a apporté |
|----|------|---------|----------------------|
| #37 | feat | `claude/analyze-power-apps-1YBtF` | Premier chatbot avec Google Gemini Flash (function calling) |
| #38 | fix | `claude/analyze-power-apps-1YBtF` | Affichage du détail des erreurs Gemini |
| #39 | feat | `claude/analyze-power-apps-1YBtF` | Chatbot local sans API externe (parseur de mots-clés) |
| #40 | feat | `claude/analyze-power-apps-1YBtF` | Parseur NLP enrichi (synonymes, fuzzy matching, Levenshtein) |

### 2.4 Phase 3 — Modules métier majeurs (PRs #41–#45)

| PR | Type | Branche | Ce qu'elle a apporté |
|----|------|---------|----------------------|
| #41 | feat | `claude/align-detail-page-design-f5Z8O` | Page détail matériel alignée sur le drawer de consultation (mode page partagé) |
| #42 | feat | `claude/reservations-system` | **Système de réservations complet** (modèle Prisma + 7 endpoints + page liste + modale + onglet drawer) |
| #43 | feat | `claude/calendrier-materiel` | **Calendrier matériel** — page `/calendrier` (Gantt globale) + onglet drawer (timeline 1 ligne) |
| #44 | fix | `claude/fix-reservations-calendar` | Bugs : KPIs cliquables, cache conflits, calendrier vide (`pageSize` capé à 100 → 500) |
| #45 | feat | `claude/maquette-redesign` | **Redesign maquettes complet** — KPIs, table dense, drawer avec 7 onglets, plan SVG des défauts |

### 2.5 Phase 4 — Export PDF + corrections (PRs #46–#47)

| PR | Type | Branche | Ce qu'elle a apporté |
|----|------|---------|----------------------|
| #46 | feat | `claude/materiel-pdf-export` | **Export PDF** d'une fiche matériel (pdfkit, A4, charte EDF) |
| #47 | fix | `claude/materiel-fixes` | Filtre Tous/Mes matériels, calendrier drawer (compact), avatar responsable |

### 2.6 Phase 5 — Maquettes étendues (PRs #48–#49)

| PR | Type | Branche | Ce qu'elle a apporté |
|----|------|---------|----------------------|
| #48 | feat | `claude/maquette-fields-form` | Tous les champs PowerApps maquette (FIEC, vie, colisage, adresse…), wizard 5 étapes, 3 maquettes test |
| #49 | feat | `claude/maquette-defauts-crud` | CRUD défauts dans le formulaire de modification (étape « Défauts ») |

> ⚠️ **À retenir :** chaque PR a été buildée, mergée sur `main`, ce qui déclenche automatiquement le workflow GitHub Actions qui build l'image Docker, l'envoie sur GitHub Container Registry, et redéploie Azure App Service. Cf. section [10](#10-cicd--github-actions--azure-app-service).

---

## 3. Architecture de l'application

### 3.1 Vue d'avion

```
┌──────────────────────────────────────────────────────────────────┐
│                         NAVIGATEUR                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  React 18 + Vite (HTML / CSS / TS) → "Single Page App"   │    │
│  │  Pages : /materiels, /maquettes, /reservations, /calendrier   │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                             │ HTTPS (fetch)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              AZURE APP SERVICE (conteneur Docker)                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  NestJS (Node.js + TypeScript)                          │     │
│  │  - Routes /api/v1/...   (Controllers)                   │     │
│  │  - Logique métier        (Services)                     │     │
│  │  - Auth (Microsoft + JWT local)                         │     │
│  └─────────────────┬───────────────────────────────────────┘     │
│                    │ Prisma ORM (TypeScript ↔ SQL)               │
└────────────────────┼───────────────────────────────────────────-─┘
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│         AZURE PostgreSQL Flexible Server (base de données)       │
│  Tables : agents, materiels, maquettes, reservations, defauts… │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Le monorepo

Tout le code vit dans **un seul dépôt Git** appelé un *monorepo*. Il contient 3 *packages* indépendants (chacun avec son `package.json`) gérés par **pnpm workspaces**.

```
OGADE/
├── apps/
│   ├── api/            ← Backend NestJS (Node.js + TypeScript)
│   │   ├── prisma/         ← Schéma + migrations DB
│   │   ├── src/
│   │   │   ├── auth/           Authentification
│   │   │   ├── materiels/      Module CRUD matériels
│   │   │   ├── maquettes/      Module CRUD maquettes (+ défauts)
│   │   │   ├── reservations/   Module réservations
│   │   │   ├── pdf/            Génération PDF
│   │   │   └── main.ts         Point d'entrée serveur
│   │   └── package.json
│   │
│   └── web/            ← Frontend React + Vite
│       ├── src/
│       │   ├── components/     Composants réutilisables (MaterielDrawer, GanttCalendar…)
│       │   ├── pages/          Une page par route (MaterielsListPage…)
│       │   ├── lib/            api.ts, auth.tsx
│       │   ├── hooks/          use-pagination, use-referentiels
│       │   └── ogade-design.css  Charte graphique EDF
│       └── package.json
│
├── packages/
│   └── shared/         ← Code partagé API ↔ Web (types, schémas Zod)
│       └── src/
│           ├── types/      ex. Materiel, Maquette, Reservation
│           └── schemas/    ex. createMaterielSchema (Zod)
│
├── .github/workflows/  ← CI/CD (deploy-azure.yml)
├── docker-compose.yml  ← PostgreSQL local pour le dev
├── Dockerfile          ← Recette de l'image de prod
└── package.json        ← Scripts racine (pnpm dev, build…)
```

### 3.3 Pourquoi un monorepo + un package `shared` ?

Parce que **le frontend et le backend partagent les mêmes définitions de données** :
- Le type `Materiel` est défini une seule fois dans `packages/shared` ;
- Quand on ajoute un champ, le compilateur **TypeScript** détecte automatiquement les endroits où il manque, côté API *et* côté Web.
- Les schémas Zod (validation) servent à la fois côté serveur (pour valider les requêtes) et côté client (pour valider les formulaires avec react-hook-form).

C'est le **single source of truth**.

### 3.4 Le flux d'une donnée, pas à pas

Exemple : l'utilisateur crée une réservation.

1. **Navigateur** : il remplit la modale `ReservationModal.tsx`.
2. La modale appelle `api.post("/reservations", payload)` (fonction définie dans `apps/web/src/lib/api.ts`).
3. Cette fonction émet une requête HTTP `POST /api/v1/reservations` vers le backend (sur Azure).
4. **Backend NestJS** : `ReservationsController` reçoit le body, le valide avec `createReservationSchema` (Zod).
5. Si OK → appelle `ReservationsService.create(...)`.
6. Le service appelle Prisma : `this.prisma.reservation.create({ data: ... })`.
7. Prisma transforme cet appel en SQL `INSERT INTO reservations (...) VALUES (...)`.
8. PostgreSQL stocke la ligne et renvoie l'objet créé.
9. Prisma → service → controller → réponse HTTP `201 Created` avec le JSON.
10. Côté navigateur, React Query reçoit la réponse, **invalide les caches** des listes/KPIs concernés, ce qui re-déclenche les requêtes `GET` et met à jour l'écran.

---

## 4. Mini-cours : TypeScript & JavaScript

### 4.1 JavaScript en 3 minutes

JavaScript (JS) est le langage **du navigateur** : tout site web en utilise pour réagir aux clics, animer, faire des requêtes. Avec **Node.js**, on peut aussi l'exécuter côté serveur.

```js
// Variable
const nom = "Julien";
let age = 30;     // peut changer
const pi = 3.14;  // ne peut pas changer

// Fonction
function bonjour(prenom) {
  return "Salut " + prenom + " !";
}
console.log(bonjour("Marie"));   // "Salut Marie !"

// Fonction "fléchée" (forme courte, utilisée partout en React)
const carre = (n) => n * n;
carre(4);  // 16

// Tableau (array) + map/filter
const nombres = [1, 2, 3, 4];
const doubles = nombres.map(n => n * 2);          // [2, 4, 6, 8]
const pairs   = nombres.filter(n => n % 2 === 0); // [2, 4]

// Objet
const user = { nom: "Bock", actif: true };
console.log(user.nom);   // "Bock"

// Asynchrone (await) — pour appeler une API
async function fetchMateriels() {
  const response = await fetch("/api/v1/materiels");
  const data = await response.json();
  return data;
}
```

> 💡 **Point clé :** en JavaScript, **tout est un objet** (même les fonctions). Et tout est asynchrone par défaut sur les opérations I/O (réseau, disque) — on utilise `async` / `await`.

### 4.2 TypeScript = JavaScript + types

TypeScript (TS) **est** du JavaScript, mais avec des **annotations de type** vérifiées avant exécution. Le navigateur ne lit **jamais** du TS : un *transpileur* (le compilateur `tsc` ou Vite/esbuild) le convertit en JS au moment du build.

```ts
// Types primitifs
const nom: string = "Julien";
const age: number = 30;
const actif: boolean = true;

// Type d'une fonction (paramètres + retour)
function additionner(a: number, b: number): number {
  return a + b;
}

// Type personnalisé (= un "moule")
type Materiel = {
  id: number;
  reference: string;
  libelle: string;
  etat: "CORRECT" | "HS" | "PERDU"; // union de valeurs autorisées
  dateEtalonnage?: Date | null;     // ? = optionnel
};

const m: Materiel = {
  id: 1,
  reference: "PGM215",
  libelle: "Poste UT",
  etat: "CORRECT",
};
// m.etat = "BIZARRE"; ← ❌ ERREUR de compilation : pas dans l'union
```

**Pourquoi on l'utilise dans OGADE :**
- Quand on renomme un champ dans `packages/shared/src/types/maquette.ts`, le compilateur signale **toutes** les pages qui doivent être mises à jour. Pas de surprise en production.
- L'éditeur (VS Code) propose l'**autocomplétion** intelligente : on tape `m.` et il liste les champs disponibles.

### 4.3 Concepts TS qu'on a beaucoup utilisés

```ts
// Generics — type paramétré
function premier<T>(liste: T[]): T | undefined {
  return liste[0];
}
premier<string>(["a", "b"]);  // "a"
premier<number>([1, 2]);      // 1

// Type "Partial" — rend tous les champs optionnels (utile pour les updates)
type UpdateMateriel = Partial<Materiel>;

// Inférence de type Zod
import { z } from "zod";
const schema = z.object({ nom: z.string(), age: z.number() });
type User = z.infer<typeof schema>;
//   ^? { nom: string; age: number; }
```

---

## 5. Mini-cours : SQL & Prisma

### 5.1 SQL en 5 minutes

SQL = *Structured Query Language* — le langage qu'on utilise pour parler à une base de données **relationnelle** comme PostgreSQL. Une base relationnelle stocke ses données dans des **tables** (lignes × colonnes).

```sql
-- Créer une table
CREATE TABLE materiels (
  id          SERIAL PRIMARY KEY,           -- entier auto-incrémenté
  reference   VARCHAR(255) NOT NULL UNIQUE, -- texte obligatoire, unique
  libelle     VARCHAR(255) NOT NULL,
  etat        VARCHAR(50) DEFAULT 'CORRECT',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer
INSERT INTO materiels (reference, libelle) VALUES ('PGM215', 'Poste UT');

-- Lire (SELECT)
SELECT * FROM materiels WHERE etat = 'CORRECT';
SELECT reference, libelle FROM materiels ORDER BY created_at DESC LIMIT 10;

-- Modifier
UPDATE materiels SET etat = 'HS' WHERE id = 1;

-- Supprimer
DELETE FROM materiels WHERE id = 1;

-- Joindre 2 tables
SELECT m.reference, m.libelle, a.nom AS responsable_nom
FROM materiels m
JOIN agents a ON a.id = m.responsable_id;
```

> 💡 **CRUD** = *Create / Read / Update / Delete* = les 4 opérations de base sur n'importe quelle entité.

### 5.2 Prisma : « SQL sans écrire de SQL »

Écrire du SQL à la main est verbeux et risqué (oubli de `WHERE`, injection SQL…). On utilise un **ORM** (Object-Relational Mapper) appelé **Prisma**.

**Le principe :** on décrit les tables dans un fichier `schema.prisma`, et Prisma génère :
- Les migrations SQL (à exécuter sur la vraie DB)
- Un client TypeScript typé pour interagir avec elle

```prisma
// apps/api/prisma/schema.prisma
model Materiel {
  id        Int      @id @default(autoincrement())
  reference String   @unique
  libelle   String
  etat      String   @default("CORRECT")
  createdAt DateTime @default(now()) @map("created_at")

  // Relation : un matériel a un responsable (Agent)
  responsableId Int?  @map("responsable_id")
  responsable   Agent? @relation(fields: [responsableId], references: [id])

  @@map("materiels")
}
```

Côté code Node.js, on l'utilise comme ça :

```ts
// CRUD avec autocomplétion + types
const m = await prisma.materiel.create({
  data: { reference: "PGM215", libelle: "Poste UT" },
});

const tous = await prisma.materiel.findMany({
  where: { etat: "CORRECT" },
  orderBy: { createdAt: "desc" },
  include: { responsable: true },  // auto-jointure
});

await prisma.materiel.update({
  where: { id: 1 },
  data: { etat: "HS" },
});
```

### 5.3 Migrations Prisma

À chaque modification du schéma, on crée une **migration** = un fichier SQL versionné. Exemple : `apps/api/prisma/migrations/20260430140000_maquette_full_powerapps/migration.sql`.

```bash
# Pour créer une migration en local
pnpm --filter @ogade/api exec prisma migrate dev --name nom_de_la_migration

# Pour appliquer les migrations en production (Azure)
pnpm db:migrate:deploy
```

Au démarrage du conteneur Docker en production, le script `start.sh` lance `prisma migrate deploy` automatiquement → la base se met à jour toute seule.

---

## 6. Backend : NestJS expliqué

### 6.1 Qu'est-ce que NestJS ?

**NestJS** est un *framework* Node.js (basé sur Express ou Fastify) qui structure une API HTTP autour de 3 concepts :
- **Module** : un regroupement de fonctionnalités (ex. `MaterielsModule`)
- **Controller** : reçoit les requêtes HTTP, route vers la bonne méthode
- **Service** : contient la logique métier et appelle Prisma

C'est très inspiré d'Angular, et utilise un système d'**injection de dépendances** pour câbler tout ça automatiquement.

### 6.2 Anatomie d'un module OGADE

Prenons `materiels` :

```
apps/api/src/materiels/
├── materiels.module.ts       Déclare le module et liste ses dépendances
├── materiels.controller.ts   Définit les routes HTTP
└── materiels.service.ts      Contient la logique (Prisma queries)
```

**`materiels.module.ts`** — la "boîte" :
```ts
@Module({
  imports: [EvenementsModule, PdfModule],   // ce dont on a besoin
  controllers: [MaterielsController],
  providers: [MaterielsService],            // services injectables
  exports: [MaterielsService],              // ce qu'on partage avec d'autres modules
})
export class MaterielsModule {}
```

**`materiels.controller.ts`** — les routes HTTP :
```ts
@Controller('api/v1/materiels')
export class MaterielsController {
  constructor(
    private readonly service: MaterielsService,   // injection auto par Nest
    private readonly pdfService: PdfService,
  ) {}

  @Get()                                          // GET /api/v1/materiels
  findAll(@Query('page') page?: string) {
    return this.service.findAll({ page });
  }

  @Get(':id/pdf')                                 // GET /api/v1/materiels/:id/pdf
  async pdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const buffer = await this.pdfService.materielPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(buffer);
  }
}
```

**`materiels.service.ts`** — la logique :
```ts
@Injectable()
export class MaterielsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ page }: { page?: string }) {
    return this.prisma.materiel.findMany({
      where: { deletedAt: null },
      include: { responsable: true },
    });
  }
}
```

### 6.3 Les modules métier d'OGADE

| Module | Rôle |
|--------|------|
| `auth` | Authentification (Microsoft via JWKS + JWT local HS256) |
| `materiels` | CRUD matériels, stats, historique, export PDF |
| `maquettes` | CRUD maquettes + CRUD défauts imbriqués |
| `reservations` | CRUD réservations + détection de conflits + KPI stats |
| `demandes-envoi` | Demandes d'envoi + lignes (matériel ou maquette) |
| `referentiels`, `sites`, `entreprises`, `agents` | Tables de référence |
| `fichiers` | Upload + download (Azure Blob Storage en prod, Bytea en local) |
| `qrcode` | Génération QR codes pour matériels & maquettes |
| `evenements` | Audit trail (qui a fait quoi, quand) |
| `pdf` | Génération PDF mis en page (pdfkit) |
| `chat` | Chatbot NLP local |

### 6.4 Authentification — comment c'est câblé

`auth.guard.ts` est un *Global Guard* : il intercepte **toutes** les requêtes et refuse celles qui ne sont pas authentifiées.

```ts
1. Si la route a @Public() → on laisse passer
2. Sinon, on cherche un token Bearer dans l'header Authorization
   - Token JWT local (HS256) → validation rapide avec JWT_SECRET
   - Sinon Token Microsoft → validation via JWKS (jose lib)
3. Sinon, fallback dev : header x-user-email
4. On lookup l'agent en base et on l'attache à la requête : req.user
```

Le décorateur `@CurrentUser()` permet ensuite à n'importe quel handler de récupérer l'utilisateur courant :

```ts
@Get('mes-reservations')
mes(@CurrentUser() user: RequestUser | null) {
  return this.service.findAll({ demandeurId: user?.agentId });
}
```

### 6.5 Validation Zod

À l'entrée d'un controller, on **ne fait pas confiance** au body envoyé par le client. On le passe dans un schéma Zod :

```ts
@Post()
async create(@Body() body: any) {
  const result = createMaterielSchema.safeParse(body);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return this.service.create(result.data);  // result.data est typé !
}
```

Si le body est invalide → réponse `400 Bad Request` avec la liste des erreurs.

---

## 7. Frontend : React + Vite expliqué

### 7.1 React en 5 minutes

**React** est une *librairie* JavaScript pour construire des interfaces. Le principe :
- Tout est un **composant** (= une fonction qui renvoie du JSX, qui ressemble à du HTML).
- Le composant a un **état** (`useState`) et des **effets** (`useEffect`).
- Quand l'état change, React **re-rend** le composant et met à jour le DOM minimalement.

```tsx
import { useState } from "react";

function Compteur() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Cliqué {count} fois
    </button>
  );
}
```

> 💡 **JSX** : c'est du JavaScript qui ressemble à du HTML. Le compilateur le transforme en `React.createElement(...)` derrière la scène.

### 7.2 Vite : le bundler

**Vite** est l'outil qui :
- Lance un serveur de dev avec **hot reload** (le navigateur se met à jour à la sauvegarde, sans recharger).
- En prod, *bundle* tout le code TS/JSX en quelques fichiers JS minifiés + un index.html.

```bash
pnpm dev:web      # http://localhost:5173 — dev avec hot reload
pnpm build:web    # produit apps/web/dist/ (servi par NestJS en prod)
```

### 7.3 React Query : l'état serveur

On utilise **TanStack React Query** pour toutes les requêtes au backend. C'est ce qui :
- Met en **cache** les réponses (clé : `queryKey`)
- Re-fetch automatiquement quand la fenêtre reprend le focus
- Permet d'**invalider** un cache après une mutation pour rafraîchir les écrans

```tsx
const { data, isLoading } = useQuery({
  queryKey: ["materiels", { search }],
  queryFn: () => api.get("/materiels", { search }),
});

const mutation = useMutation({
  mutationFn: (payload) => api.post("/materiels", payload),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["materiels"] });  // refresh la liste
  },
});
```

### 7.4 react-hook-form + Zod : les formulaires

```tsx
const { register, handleSubmit } = useForm({
  resolver: zodResolver(createMaterielSchema),  // validation Zod
});

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register("reference")} />
    <input {...register("libelle")} />
    <button type="submit">Créer</button>
  </form>
);
```

Le `register("reference")` câble l'input au form state ; `zodResolver` valide tout d'un coup.

### 7.5 Composants OGADE phares

| Composant | Rôle |
|-----------|------|
| `MaterielDrawer` / `MaquetteDrawer` | Panneau de consultation à 7 onglets (Infos, PJ, Photos, État, Calendrier, Historique, QR), réutilisable en mode `drawer` (slide-in) ou `page` |
| `ReservationModal` | Modale de création/édition réservation avec détection de conflits temps-réel |
| `GanttCalendar` | Composant timeline matériels × jours, variant `compact` pour l'embarquer dans un drawer |
| `MaquetteDefautsEditor` | Tableau + éditeur inline pour CRUD des défauts d'une maquette |

### 7.6 Routing — `routes.tsx`

```tsx
<Routes>
  <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
    <Route path="/" element={<HomePage />} />
    <Route path="/materiels" element={<MaterielsListPage />} />
    <Route path="/materiels/:id" element={<MaterielDetailPage />} />
    <Route path="/materiels/:id/edit" element={<MaterielFormPage />} />
    <Route path="/maquettes" element={<MaquettesListPage />} />
    {/* …etc. */}
    <Route path="/reservations" element={<ReservationsListPage />} />
    <Route path="/calendrier" element={<CalendrierPage />} />
  </Route>
</Routes>
```

Tout est protégé par `RequireAuth`, qui montre `LoginPage` si l'utilisateur n'est pas connecté (et que l'auth est requise).

### 7.7 CSS — `ogade-design.css`

On n'utilise **pas** Tailwind ici (sauf marginal). On a un **design system maison** dans `apps/web/src/ogade-design.css` qui définit :
- Variables CSS (couleurs `--accent`, `--rose`, `--emerald`, `--ink`…)
- Composants : `.kpi`, `.pill`, `.tag`, `.obtn` (button), `.drawer`, `.mq-tabs`, `.cal-bar` (gantt bar), `.mchip`, `.prop-card`, etc.
- Variants : `.kpi-active`, `.cal-wrap.compact`, `.mq-type.qual`, etc.

Charte EDF : bleu `--brand: #183F80` + accent violet `oklch(0.55 0.20 275)`.

---

## 8. Base de données : PostgreSQL

**PostgreSQL** = SGBD (Système de Gestion de Base de Données) **relationnel** open source. Données stockées dans des tables, transactions ACID, support JSON natif…

**En local :** lancé par Docker Compose (cf. section 9).
**En prod :** *Azure Database for PostgreSQL — Flexible Server* (managé par Microsoft Azure).

Connexion via la variable d'environnement `DATABASE_URL` :
```
postgresql://user:password@host:5432/ogade
```

Tables principales (extrait) :

| Table | Lignes attendues | Rôle |
|-------|------------------|------|
| `agents` | ~50 | Utilisateurs autorisés + leurs rôles |
| `roles` + `agent_roles` | 5 + N | RBAC (ADMIN, REFERENT_LOGISTIQUE…) |
| `materiels` | ~500 | Inventaire matériel END (soft-delete via `deleted_at`) |
| `maquettes` | ~200 | Maquettes physiques de qualification |
| `defauts` | variable | Défauts artificiels par maquette |
| `reservations` | ~20/mois | Pré-réservations futures |
| `demandes_envoi` + `demande_envoi_lignes` | ~50/mois | Mouvements |
| `referentiels` | ~100 | Listes de choix (TYPE_END, MATIERE…) |
| `ref_sites`, `ref_entreprises` | ~20 | Référentiels Sites & Entreprises |
| `fichiers` | variable | Photos / documents (lien vers Azure Blob ou bytea) |
| `evenements` | beaucoup | Audit trail |

---

## 9. Conteneurisation : Docker + Docker Compose

### 9.1 Pourquoi Docker ?

Sans Docker, déployer = installer Node.js, OpenSSL, PostgreSQL client, libcurl… sur le serveur cible et croiser les doigts. Une vraie galère, et chaque environnement (Mac, Linux, Windows) se comporte différemment.

**Docker** empaquète l'app **et toutes ses dépendances système** dans une **image** = un fichier portable. On peut ensuite lancer cette image partout : sur ta machine, sur Azure, sur AWS, identique au bit près.

Vocabulaire :
- **Image** : recette figée (ex. `ghcr.io/julienbock57-art/ogade:latest`)
- **Conteneur** : une instance qui tourne d'une image
- **Dockerfile** : la recette pour construire l'image
- **Docker Compose** : un orchestrateur multi-conteneurs (1 fichier YAML qui décrit "lance Postgres + l'API ensemble")

### 9.2 Notre `Dockerfile` (multi-stage)

Notre image est construite en **2 étapes** pour qu'elle soit la plus petite possible.

```dockerfile
# ──────────────── STAGE 1 — builder ────────────────
FROM node:20-slim AS builder
RUN corepack enable
WORKDIR /app

# Copie des manifestes (cache Docker efficace)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# Copie le code complet, génère le client Prisma, build les 3 packages
COPY . .
RUN pnpm run db:generate
RUN pnpm run build

# Aplatit la sortie en /deploy/ avec un package.json minimal
RUN mkdir -p /deploy/apps/api /deploy/apps/web && \
    cp -r apps/api/dist /deploy/apps/api/ && \
    cp -r apps/api/prisma /deploy/apps/api/ && \
    cp -r apps/web/dist /deploy/apps/web/

# ──────────────── STAGE 2 — image finale ────────────────
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /deploy .
EXPOSE 8080
CMD ["sh", "start.sh"]   # lance prisma migrate deploy puis node main.js
```

> 🔑 **Astuce performance :** copier d'abord `package.json` puis lancer `pnpm install`, **avant** de copier le reste, permet à Docker de **réutiliser le cache** des dépendances tant que `pnpm-lock.yaml` n'a pas changé.

### 9.3 `docker-compose.yml` (dev local)

Un seul service en local : PostgreSQL. L'API et le Web tournent en mode dev directement avec Node.js (hot reload).

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: ogade-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ogade
      POSTGRES_PASSWORD: ogade
      POSTGRES_DB: ogade
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ogade"]
      interval: 5s

volumes:
  pgdata:
```

Commande :
```bash
pnpm docker:up    # démarre Postgres (en arrière-plan)
pnpm docker:down  # arrête tout
```

---

## 10. CI/CD : GitHub Actions → Azure App Service

### 10.1 Le pipeline complet

Le fichier `.github/workflows/deploy-azure.yml` est exécuté automatiquement par GitHub à chaque push sur `main`.

```yaml
name: Deploy to Azure App Service
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }

    steps:
      - uses: actions/checkout@v4
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/ogade:latest
            ghcr.io/${{ github.repository_owner }}/ogade:${{ github.sha }}

      # … puis Azure CLI déclenche un redeploy de l'App Service
      #     pour pull la nouvelle image et restart le conteneur.
```

### 10.2 Le cycle de vie d'une feature (vue d'ensemble)

```
[1] git checkout -b claude/ma-feature
[2] code, edit, save
[3] pnpm build              → vérifie que tout compile
[4] git commit + git push -u origin claude/ma-feature
[5] PR sur GitHub (draft puis ready)
[6] merge sur main          ─┐
                              ├─ déclenche le workflow
[7] GitHub Actions :          │
    - checkout                │
    - docker build           ─┘
    - docker push (ghcr.io)
[8] Azure App Service :
    - détecte la nouvelle image (via webhook)
    - pull + redémarre le conteneur
    - le start.sh lance prisma migrate deploy
[9] Le site est à jour : https://ogade.azurewebsites.net
```

### 10.3 Variables d'environnement de prod (Azure App Service)

| Variable | Exemple | Rôle |
|----------|---------|------|
| `DATABASE_URL` | `postgresql://...` | Connexion à Azure PostgreSQL |
| `AZURE_AD_CLIENT_ID` | `c8151b03-...` | OAuth Microsoft |
| `AZURE_AD_TENANT_ID` | `common` | Tenant Azure AD |
| `JWT_SECRET` | `<random>` | Signature des JWT locaux |
| `AZURE_STORAGE_*` | `...` | Azure Blob (photos/docs) |
| `PORT` | `8080` | Port HTTP du conteneur |
| `CORS_ORIGIN` | `https://...` | Origines autorisées |

---

## 11. Toutes les commandes utiles

### 11.1 Pré-requis (à installer une fois)
- **Node.js ≥ 20** ([nodejs.org](https://nodejs.org/))
- **pnpm ≥ 9** : `npm install -g pnpm` ou `corepack enable`
- **Docker** : [docker.com](https://www.docker.com/products/docker-desktop)

### 11.2 Démarrage local — première fois

```bash
# 1. Installer les dépendances de tous les packages
pnpm install

# 2. Démarrer la base PostgreSQL (Docker)
pnpm docker:up

# 3. Créer le client Prisma + appliquer les migrations
pnpm db:generate
pnpm db:migrate

# 4. Insérer les données initiales (referentiels, admin)
pnpm db:seed

# 5. Lancer l'API + le Web en parallèle
pnpm dev
```

Une fois lancé :
- API : http://localhost:3000 (Swagger : http://localhost:3000/api/docs)
- Web : http://localhost:5173

### 11.3 Commandes du quotidien

| Commande | Effet |
|----------|-------|
| `pnpm dev` | Lance API + Web en parallèle (hot reload) |
| `pnpm dev:api` | Lance uniquement l'API |
| `pnpm dev:web` | Lance uniquement le Web |
| `pnpm build` | Build complet (shared → web → api) |
| `pnpm build:shared` / `:api` / `:web` | Build d'un seul package |
| `pnpm db:studio` | Ouvre Prisma Studio (GUI pour la base) |
| `pnpm db:migrate` | Crée et applique une nouvelle migration en local |
| `pnpm db:migrate:deploy` | Applique les migrations existantes (utilisé en prod) |
| `pnpm docker:up` / `:down` | Démarre / arrête PostgreSQL local |

### 11.4 Git — workflow OGADE

```bash
# Créer une branche pour une nouvelle fonctionnalité
git checkout main
git pull origin main
git checkout -b claude/ma-feature

# Faire des modifs… puis
git add apps packages
git commit -m "feat(scope): description courte

Détail multi-lignes…"

# Pousser et ouvrir une PR
git push -u origin claude/ma-feature
# Aller sur GitHub → Create Pull Request → mergeer
```

### 11.5 Docker — utiles

```bash
docker ps                          # liste les conteneurs en cours
docker logs ogade-db               # voir les logs Postgres
docker compose up -d               # démarrer en arrière-plan
docker compose down -v             # tout arrêter + supprimer le volume (⚠ données perdues)
docker build -t ogade .            # build l'image en local
docker run -p 8080:8080 ogade      # lance le conteneur prod en local
```

### 11.6 Tests rapides API (curl)

```bash
# Liste des matériels
curl http://localhost:3000/api/v1/materiels -H "x-user-email: julien.bock57@gmail.com"

# Détail
curl http://localhost:3000/api/v1/materiels/1

# Stats
curl http://localhost:3000/api/v1/materiels/stats

# Export PDF (sauvegarde dans materiel.pdf)
curl -o materiel.pdf http://localhost:3000/api/v1/materiels/1/pdf
```

---

## 12. Glossaire des termes

| Terme | Définition courte |
|-------|-------------------|
| **API** | *Application Programming Interface* — contrat entre 2 logiciels (ici, le backend qui expose des routes HTTP au frontend) |
| **Backend** | Le code qui tourne sur le **serveur** : reçoit les requêtes, parle à la base de données, renvoie du JSON |
| **Frontend** | Le code qui tourne dans le **navigateur** : pages, formulaires, animations |
| **CRUD** | Create / Read / Update / Delete — les 4 opérations de base |
| **REST** | Style d'API où chaque ressource a une URL (`GET /materiels/1`, `POST /materiels`…) |
| **JSON** | Format texte d'échange de données : `{ "nom": "Julien", "age": 30 }` |
| **HTTP** | Protocole web. Méthodes : GET (lire), POST (créer), PATCH (modifier), DELETE (supprimer) |
| **JWT** | *JSON Web Token* — jeton signé qui prouve qu'un utilisateur est authentifié |
| **OAuth / OIDC** | Standards d'authentification (Microsoft, Google… utilisés par OGADE pour SSO Azure AD) |
| **ORM** | *Object-Relational Mapper* — transforme des objets de code en lignes de DB. Prisma chez nous |
| **Migration** | Fichier SQL versionné qui modifie la structure de la DB |
| **Schema** | Description de la DB (tables, colonnes, relations) — `schema.prisma` |
| **Zod** | Librairie de validation de schémas TypeScript |
| **React Query** | Cache + fetcher pour les requêtes API (côté React) |
| **react-hook-form** | Gestion des formulaires React avec validation |
| **Vite** | Bundler/serveur de dev pour le frontend |
| **NestJS** | Framework Node.js structuré (modules / controllers / services) |
| **Monorepo** | Un seul dépôt Git contenant plusieurs sous-projets |
| **pnpm workspaces** | Système qui gère les dépendances d'un monorepo efficacement |
| **Docker** | Outil pour empaqueter une app + ses dépendances dans une **image** portable |
| **Conteneur** | Instance d'une image en cours d'exécution |
| **Image Docker** | Recette figée immutable, tirée d'un *registry* (ghcr.io chez nous) |
| **Dockerfile** | La recette qui décrit comment construire l'image |
| **Docker Compose** | Orchestrateur multi-conteneurs (1 fichier YAML) |
| **CI/CD** | *Continuous Integration / Continuous Deployment* — automatisation build + déploiement |
| **GitHub Actions** | Service CI/CD intégré à GitHub (= notre pipeline `deploy-azure.yml`) |
| **Azure App Service** | Service managé Azure qui exécute notre conteneur Docker en prod |
| **PostgreSQL** | Base de données relationnelle open source utilisée par OGADE |
| **Single Page App (SPA)** | App web qui ne recharge jamais la page complète — la navigation se fait en JS |
| **Hot reload** | Mise à jour de l'écran à la sauvegarde du code, sans recharger |
| **Pull Request (PR)** | Proposition de modification du code, à reviewer avant merge |
| **Branche** | Version parallèle du code, isolée jusqu'au merge |
| **Merge** | Fusion d'une branche dans `main` |
| **Drawer** | Panneau latéral coulissant (utilisé pour la consultation matériel/maquette) |
| **Wizard** | Formulaire en plusieurs étapes (utilisé pour création/édition matériel et maquette) |
| **KPI** | *Key Performance Indicator* — carte chiffre clé en haut d'une page liste |
| **CND / END** | Contrôle Non Destructif / Examens Non Destructifs (métier OGADE) |

---

## 🎯 Pour aller plus loin

Lectures et tutoriels recommandés (gratuits et bien faits) :

- 🔗 [TypeScript Handbook (officiel)](https://www.typescriptlang.org/docs/handbook/intro.html)
- 🔗 [React (officiel) — nouvelle doc 2024](https://react.dev/learn)
- 🔗 [NestJS (officiel)](https://docs.nestjs.com/)
- 🔗 [Prisma — Get started](https://www.prisma.io/docs/getting-started)
- 🔗 [Docker — Get started](https://docs.docker.com/get-started/)
- 🔗 [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

---

*Dernière mise à jour : 30 avril 2026 — généré dans la PR #50.*

---

## 13. Fonctions clés expliquées en détail (avec exemples du code OGADE)

> Cette section reprend **chaque langage / librairie utilisé**, et explique les *fonctions clés* qu'on a employées dans OGADE. Chaque sous-section commence par une syntaxe minimale, puis montre **un extrait réel du code OGADE** pour que tu puisses faire le lien.
>
> Tableau de bord :
>
> | # | Langage / Librairie | Où c'est utilisé dans OGADE |
> |---|---------------------|------------------------------|
> | 13.1 | **TypeScript** | Toute la codebase (sauf SQL et YAML) |
> | 13.2 | **JavaScript runtime** (fetch, Promise, Array, Date) | API client + composants React |
> | 13.3 | **Prisma schema** (DSL) | `apps/api/prisma/schema.prisma` |
> | 13.4 | **Prisma client** (TypeScript) | Tous les services NestJS (`*.service.ts`) |
> | 13.5 | **SQL** | Migrations dans `apps/api/prisma/migrations/` |
> | 13.6 | **Zod** | `packages/shared/src/schemas/` + côté React (formulaires) |
> | 13.7 | **React hooks** | Tous les composants `apps/web/src/components/`, `pages/` |
> | 13.8 | **React Query + react-hook-form** | Toutes les pages liste / form |
> | 13.9 | **NestJS décorateurs** | Tous les controllers et services backend |
> | 13.10 | **CSS** (custom properties) | `apps/web/src/ogade-design.css` |
> | 13.11 | **Dockerfile** | `Dockerfile` à la racine |
> | 13.12 | **YAML** (GitHub Actions) | `.github/workflows/deploy-azure.yml` |

### 13.1 TypeScript — fonctions clés employées dans OGADE

#### `type` — définir un type personnalisé
Crée un *alias* qu'on peut réutiliser. C'est juste de la documentation pour le compilateur (zéro coût à l'exécution).

**Syntaxe minimale :**
```ts
type Etat = "CORRECT" | "HS";   // union de valeurs autorisées
type User = { nom: string; age?: number };  // ? = optionnel
```

**Dans OGADE — `packages/shared/src/types/maquette.ts`** :
```ts
export const EtatMaquette = {
  STOCK: "STOCK",
  EMPRUNTEE: "EMPRUNTEE",
  EN_CONTROLE: "EN_CONTROLE",
  REBUT: "REBUT",
  EN_REPARATION: "EN_REPARATION",
  ENVOYEE: "ENVOYEE",
} as const;

export type EtatMaquette = (typeof EtatMaquette)[keyof typeof EtatMaquette];
```
Pourquoi cette astuce ? `as const` fige les valeurs et `(typeof X)[keyof typeof X]` extrait l'union `"STOCK" | "EMPRUNTEE" | ...`. Du coup on peut **utiliser le même nom comme valeur ET comme type** : `EtatMaquette.STOCK` (valeur), `: EtatMaquette` (type).

#### `interface` (alternative à `type`)
Utilisé dans NestJS pour décrire les requêtes utilisateurs.

**OGADE — `apps/api/src/auth/auth.guard.ts`** :
```ts
export interface RequestUser {
  agentId: number;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
}
```

#### Generics — fonctions paramétrées par un type
Permet d'écrire **une fonction** qui marche pour plusieurs types tout en gardant le typage.

**Syntaxe :**
```ts
function premier<T>(arr: T[]): T | undefined { return arr[0]; }
premier<string>(["a"]);  // T = string
```

**OGADE — `apps/web/src/lib/api.ts`** :
```ts
export const api = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return apiFetch<T>(`${path}${buildQueryString(params)}`, { method: "GET" });
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
  },
};
```
On l'appelle ainsi : `api.get<Materiel>(...)` → TypeScript sait que la promesse renvoie un `Materiel`.

#### `async` / `await` — code asynchrone lisible
Au lieu de chaîner `.then()`, on écrit séquentiellement.

**OGADE — `apps/api/src/maquettes/maquettes.service.ts`** :
```ts
async findOne(id: number) {
  const maquette = await this.prisma.maquette.findFirst({
    where: { id, deletedAt: null },
    include: MAQUETTE_DETAIL_INCLUDE,
  });
  if (!maquette) {
    throw new NotFoundException(`Maquette #${id} not found`);
  }
  return maquette;
}
```
- `async` rend la fonction asynchrone (elle retourne automatiquement une `Promise`).
- `await` attend que la promesse Prisma se résolve avant de continuer.
- Si Prisma rejette, l'exception remonte (pas besoin de `try/catch` partout).

#### Optional chaining `?.` & nullish coalescing `??`
```ts
user?.nom            // si user existe → user.nom, sinon undefined
user?.address?.ville // chaîne sécurisée
m.modele ?? "—"      // si null/undefined → "—" (mais "" reste "")
```

**OGADE — `apps/web/src/components/MaterielDrawer.tsx`** :
```tsx
<Field label="Modèle">{m.modele ?? "—"}</Field>
<Field label="Responsable">
  {m.responsable ? `${m.responsable.prenom} ${m.responsable.nom}` : "—"}
</Field>
```

#### Décorateurs (`@Get`, `@Body`, `@Injectable`…)
Une **fonction** précédée de `@` qui ajoute un comportement à une classe ou à une méthode. Très utilisé par NestJS.

**OGADE — `apps/api/src/materiels/materiels.controller.ts`** :
```ts
@Controller('api/v1/materiels')
export class MaterielsController {
  @Get(':id/pdf')
  async pdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.pdfService.materielPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.end(buffer);
  }
}
```
- `@Controller(prefix)` : associe la classe à un préfixe d'URL.
- `@Get(path)` : déclare la méthode comme handler `GET /prefix/path`.
- `@Param('id', ParseIntPipe)` : extrait l'`id` d'URL et le convertit en `number`.
- `@Res()` : injection de l'objet réponse Express bas niveau.

#### Spread `...` & destructuring
**Syntaxe :**
```ts
const { nom, age } = user;        // destructuring objet
const [premier, ...reste] = arr;  // destructuring tableau
const copie = { ...obj, age: 31 };// copie + override
```

**OGADE — `apps/api/src/reservations/reservations.controller.ts`** :
```ts
const pagination = paginationSchema.parse({ page, pageSize });
return this.service.findAll({
  ...pagination,                                // étale page + pageSize
  statut: statut || undefined,
  type: type || undefined,
  materielId: materielId ? parseInt(materielId, 10) : undefined,
});
```

#### Type `Partial<T>`
Rend tous les champs optionnels. Utile pour les payloads d'update.

**OGADE — `packages/shared/src/schemas/maquette.schema.ts`** :
```ts
export const updateMaquetteSchema = createMaquetteSchema.partial().extend({
  etat: z.enum([...]).optional(),
});
```
`createMaquetteSchema.partial()` (Zod) revient à appliquer `Partial` côté schéma : tous les champs deviennent optionnels.

### 13.2 JavaScript runtime — les fonctions de la "bibliothèque standard"

#### `fetch()` — appel HTTP depuis le navigateur
La fonction navigateur pour parler à une API. Renvoie une `Promise<Response>`.

**OGADE — `apps/web/src/lib/api.ts`** :
```ts
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch { /* body pas en JSON, on garde le statut */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
```
- `response.ok` est `true` si statut 2xx.
- `response.json()` lit le corps JSON (asynchrone).
- `204 No Content` → on renvoie `undefined`.

#### `Promise` & `Promise.all`
Permet d'attendre plusieurs requêtes **en parallèle** (au lieu de les enchaîner).

**OGADE — `apps/api/src/maquettes/maquettes.service.ts`** :
```ts
async stats() {
  const where = { deletedAt: null };
  const [total, stock, empruntees, transit, asn, hs, enReparation] =
    await Promise.all([
      this.prisma.maquette.count({ where }),
      this.prisma.maquette.count({ where: { ...where, etat: 'STOCK' } }),
      this.prisma.maquette.count({ where: { ...where, etat: 'EMPRUNTEE' } }),
      this.prisma.maquette.count({ where: { ...where, enTransit: true } }),
      this.prisma.maquette.count({ where: { ...where, referenceASN: true } }),
      this.prisma.maquette.count({ where: { ...where, etat: 'REBUT' } }),
      this.prisma.maquette.count({ where: { ...where, etat: 'EN_REPARATION' } }),
    ]);
  return { total, stock, empruntees, transit, ... };
}
```
Sans `Promise.all`, ces 7 `count` s'exécuteraient en série (~7× plus lent).

#### Méthodes de tableau : `map`, `filter`, `find`, `reduce`, `forEach`
Toutes **renvoient un nouveau tableau** (sauf `forEach`/`reduce`).

**OGADE — `apps/web/src/components/GanttCalendar.tsx`** :
```ts
export function reservationsToEvents(reservations: Reservation[]): CalendarEvent[] {
  return reservations
    .filter((r) => r.statut !== "ANNULEE")     // garde celles non annulées
    .map((r) => ({                              // transforme en CalendarEvent
      kind: "reservation" as const,
      id: r.id,
      materielId: r.materielId,
      start: new Date(r.dateDebut),
      end: new Date(r.dateFin),
      type: r.type,
      statut: r.statut,
      label: r.numero,
      numero: r.numero,
    }));
}
```

**`find`** dans `MaterielsListPage.tsx` :
```ts
const typeMatRef = (typesMat ?? []).find((t: any) => t.code === m.typeMateriel);
```

#### `JSON.stringify` / `JSON.parse`
**OGADE — `apps/web/src/lib/api.ts`** :
```ts
return apiFetch<T>(path, {
  method: "POST",
  body: JSON.stringify(body),       // objet JS → string JSON
});
// côté serveur, NestJS fait JSON.parse automatiquement
```

#### `Date` & `toLocaleDateString`
**OGADE — `apps/web/src/components/MaterielDrawer.tsx`** :
```ts
const fmtDate = (d?: string | Date | null): string => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
```
`toLocaleDateString("fr-FR", ...)` → `"04 février 2026"`.

#### Calculs de dates en millisecondes
**OGADE — `apps/web/src/pages/CalendrierPage.tsx`** :
```ts
const dayMs = 86400000;             // 24 × 60 × 60 × 1000
const echeance = new Date(m.dateProchainEtalonnage);
const jours = Math.round((echeance.getTime() - Date.now()) / dayMs);
```
`Date.now()` = ms depuis 1970. La différence entre deux `getTime()` divisée par `86400000` donne un nombre de jours.

#### `URL.createObjectURL` (téléchargement de fichier)
**OGADE — `apps/web/src/components/MaterielDrawer.tsx`** :
```ts
const blob = await api.fetchBlob(`/materiels/${m.id}/pdf`);
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `OGADE-${m.reference}.pdf`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);            // libère la mémoire
```

#### `Map` & `Set`
Structures de données plus puissantes que `{}` et `[]`.

**OGADE — `apps/web/src/components/GanttCalendar.tsx`** :
```ts
const eventsByMateriel = useMemo(() => {
  const map = new Map<number, CalendarEvent[]>();
  materiels.forEach((m) => map.set(m.id, []));
  events.forEach((ev) => {
    if (!map.has(ev.materielId)) return;
    map.get(ev.materielId)!.push(ev);
  });
  return map;
}, [materiels, events]);
```

**`Set`** dans `MaquetteFormPage.tsx` :
```ts
const [triedAdvance, setTriedAdvance] = useState<Set<number>>(new Set());
// ...
setTriedAdvance((s) => new Set(s).add(step));    // immuable : on crée un nouveau Set
```

#### Template literals (backticks)
```ts
const url = `${API_BASE}/materiels/${id}`;
const msg = `Erreur ${response.status}`;
```
Utilisés **partout** pour construire des URLs, messages, classNames dynamiques.

### 13.3 Prisma schema — DSL pour décrire la base

C'est un *Domain Specific Language* propre à Prisma, écrit dans `apps/api/prisma/schema.prisma`. Mots-clés clés :

| Mot-clé | Rôle |
|---------|------|
| `model X { ... }` | Définit une table |
| `@id` | Clé primaire |
| `@unique` | Contrainte d'unicité |
| `@default(...)` | Valeur par défaut |
| `@map("col_name")` | Renomme la colonne SQL (camelCase ↔ snake_case) |
| `@@map("table_name")` | Renomme la table SQL |
| `@@index([...])` | Crée un index |
| `@relation(...)` | Décrit une relation FK |
| `?` après le type | Champ nullable |
| `@updatedAt` | Touch automatique sur update |

**OGADE — `apps/api/prisma/schema.prisma` (extrait Maquette)** :
```prisma
model Maquette {
  id             Int       @id @default(autoincrement())
  reference      String    @unique
  libelle        String
  etat           String    @default("STOCK")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")          // soft delete

  // Foreign keys
  proprietaireId Int?      @map("proprietaire_id")
  emprunteurId   Int?      @map("emprunteur_id")

  // Relations (Prisma génère les jointures côté client)
  proprietaire   Agent?    @relation("maquette_proprietaire",
                                     fields: [proprietaireId],
                                     references: [id])
  emprunteur     Agent?    @relation("maquette_emprunteur",
                                     fields: [emprunteurId],
                                     references: [id])
  defauts        Defaut[]                              // 1-N
  lignesEnvoi    DemandeEnvoiLigne[] @relation("ligne_maquette")

  @@index([etat])
  @@map("maquettes")
}
```

**Notations clés :**
- `Int?` = nullable. Sans `?` → NOT NULL en SQL.
- `@map("created_at")` : on écrit `createdAt` en TypeScript, mais la colonne SQL reste `created_at`.
- `Defaut[]` : relation 1-N (une maquette a plusieurs défauts). Pas de FK ici, elle est sur l'autre côté.
- `@relation("nom_relation", fields: [...], references: [...])` : nécessaire dès qu'il y a **plusieurs relations** entre 2 tables (ici Agent ↔ Maquette en a 5 : créateur, modificateur, propriétaire, emprunteur, référent).

**Côté Agent** (l'autre bout des relations) :
```prisma
model Agent {
  id    Int    @id @default(autoincrement())
  email String @unique
  nom   String
  prenom String
  // ...
  maquettesProprietaire  Maquette[]  @relation("maquette_proprietaire")
  maquettesEmprunteur    Maquette[]  @relation("maquette_emprunteur")
  maquettesReferent      Maquette[]  @relation("maquette_referent")
  // ...
}
```
Chaque relation nommée a son **inverse** sur l'autre modèle.

### 13.4 Prisma client — fonctions clés utilisées

Prisma génère un client TypeScript fortement typé : `prisma.<table>.<action>(...)`.

| Méthode | Rôle |
|---------|------|
| `findUnique({ where })` | 1 ligne par clé unique → ou null |
| `findFirst({ where })` | 1 ligne (filtres composés) |
| `findMany({ where, orderBy, skip, take, include })` | N lignes |
| `count({ where })` | Compter |
| `create({ data })` | Insérer |
| `update({ where, data })` | Modifier |
| `delete({ where })` | Supprimer |
| `upsert(...)` | Insère **ou** met à jour |
| `$transaction([...])` | Exécute en transaction |

#### `findMany` avec filtres + tri + pagination + include

**OGADE — `apps/api/src/maquettes/maquettes.service.ts`** :
```ts
const [data, total] = await Promise.all([
  this.prisma.maquette.findMany({
    where,                                  // filtres dynamiques
    skip,                                   // pagination
    take: pageSize,
    orderBy: { createdAt: 'desc' },
    include: MAQUETTE_LIST_INCLUDE,         // jointures
  }),
  this.prisma.maquette.count({ where }),
]);
```

#### `where` dynamique
```ts
const where: any = { deletedAt: null, AND: [] as any[] };
if (etat)  where.AND.push({ etat });
if (site)  where.AND.push({ site });
if (search) {
  where.AND.push({
    OR: [
      { reference: { contains: search, mode: 'insensitive' } },
      { libelle:   { contains: search, mode: 'insensitive' } },
    ],
  });
}
if (where.AND.length === 0) delete where.AND;
```
**Opérateurs Prisma utilisés :**
- `{ contains: x, mode: 'insensitive' }` → `LIKE %x%` insensible à la casse
- `{ in: [...] }` → `IN`
- `{ lte: x }`, `{ gte: x }` → `<=`, `>=`
- `{ not: x }`, `{ AND: [...] }`, `{ OR: [...] }`

#### `include` vs `select`
- `include: { responsable: true }` → ramène la relation **en plus** des colonnes natives
- `select: { id: true, nom: true }` → **uniquement** les colonnes listées

**OGADE — `materiels.service.ts`** :
```ts
const RESERVATION_INCLUDE = {
  materiel: { select: { id: true, reference: true, libelle: true } },
  demandeur: { select: { id: true, nom: true, prenom: true, email: true } },
  annulePar: { select: { id: true, nom: true, prenom: true } },
} as const;
```

#### `_count` (compter une relation sans la charger)
**OGADE — `maquettes.service.ts`** :
```ts
const MAQUETTE_LIST_INCLUDE = {
  // ...
  defauts: { select: DEFAUT_SELECT, orderBy: { id: 'asc' as const } },
  _count: { select: { defauts: true } },   // m._count.defauts → number
};
```

#### `create` avec relation imbriquée
**OGADE — `demandes-envoi.service.ts`** :
```ts
return this.prisma.demandeEnvoi.create({
  data: {
    ...demandeData,
    numero,
    demandeurId,
    lignes: {                                // crée les lignes en cascade
      create: lignes.map((ligne) => ({
        materielId: ligne.materielId ?? null,
        maquetteId: ligne.maquetteId ?? null,
        quantite: ligne.quantite,
      })),
    },
  },
  include: { lignes: true },
});
```

#### `update` partiel
**OGADE — `reservations.service.ts`** :
```ts
return this.prisma.reservation.update({
  where: { id },
  data: {
    ...(data.dateDebut !== undefined ? { dateDebut: data.dateDebut } : {}),
    ...(data.dateFin   !== undefined ? { dateFin:   data.dateFin   } : {}),
    ...(data.motif     !== undefined ? { motif:     data.motif     } : {}),
  },
  include: RESERVATION_INCLUDE,
});
```
Astuce : `...(cond ? { x: y } : {})` permet de **n'écrire la propriété que si elle est présente** dans le payload.

### 13.5 SQL — instructions clés dans nos migrations

Les fichiers SQL d'OGADE vivent dans `apps/api/prisma/migrations/` et sont **rejoués automatiquement** au démarrage du conteneur (`prisma migrate deploy`).

#### `CREATE TABLE` + types courants
**OGADE — `20260430090000_add_reservations/migration.sql`** :
```sql
CREATE TABLE "reservations" (
  "id"              SERIAL PRIMARY KEY,
  "numero"          VARCHAR(255) NOT NULL UNIQUE,
  "materiel_id"     INTEGER NOT NULL REFERENCES "materiels"("id") ON DELETE CASCADE,
  "demandeur_id"    INTEGER NOT NULL REFERENCES "agents"("id"),
  "date_debut"      TIMESTAMP NOT NULL,
  "date_fin"        TIMESTAMP NOT NULL,
  "type"            VARCHAR(50) NOT NULL DEFAULT 'AUTRE',
  "statut"          VARCHAR(50) NOT NULL DEFAULT 'CONFIRMEE',
  "motif"           TEXT,
  "annule_par_id"   INTEGER REFERENCES "agents"("id"),
  "annule_le"       TIMESTAMP,
  "created_at"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
- `SERIAL PRIMARY KEY` : entier auto-incrémenté + clé primaire.
- `REFERENCES "table"("col") ON DELETE CASCADE` : foreign key + suppression en cascade.
- `DEFAULT CURRENT_TIMESTAMP` : valeur par défaut côté DB.

#### `CREATE INDEX`
```sql
CREATE INDEX "reservations_materiel_id_idx" ON "reservations"("materiel_id");
CREATE INDEX "reservations_statut_idx"      ON "reservations"("statut");
```
Un index = structure interne qui rend les `WHERE materiel_id = X` quasi-instantanés.

#### `ALTER TABLE … ADD COLUMN`
**OGADE — `20260430120000_defaut_extra_fields/migration.sql`** :
```sql
ALTER TABLE "defauts" ADD COLUMN "longueur"   DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "largeur"    DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "certifie"   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "defauts" ADD COLUMN "pos_x"      DOUBLE PRECISION;
ALTER TABLE "defauts" ADD COLUMN "couleur"    VARCHAR(64);
```

#### `INSERT … ON CONFLICT … DO NOTHING` (UPSERT)
Évite l'erreur quand on insère une ligne déjà présente — utile pour seeder en idempotent.

**OGADE — `20260430140100_maquette_seed_refs_samples/migration.sql`** :
```sql
INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('TYPE_DEFAUT', 'FISSURE',   'Fissure',   1, TRUE),
  ('TYPE_DEFAUT', 'POROSITE',  'Porosité',  2, TRUE),
  ('TYPE_DEFAUT', 'INCLUSION', 'Inclusion', 3, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;
```

#### `INSERT` multi-lignes avec colonnes hétérogènes
Gros bloc `INSERT INTO maquettes (...) VALUES (...), (...), (...)` pour seeder les 3 maquettes test (extrait) :
```sql
INSERT INTO "maquettes" (
  "reference", "libelle", "etat",
  "site", "type_maquette", "categorie",
  "longueur", "dn", "epaisseur_paroi", "poids",
  "reference_asn", "informations_certifiees",
  "created_at", "updated_at"
) VALUES
(
  'MQ-2026-001', 'Tube primaire DN350', 'STOCK',
  'CRUAS', 'QUALIFICATION', 'PRIMAIRE',
  1200, 350, 28, 215,
  TRUE, TRUE,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- … 2 autres lignes …
ON CONFLICT ("reference") DO NOTHING;
```

#### `UPDATE` + `WHERE`
**OGADE — `20260427100000_materiel_powerapps_fields/migration.sql`** :
```sql
UPDATE materiels SET etat = 'CORRECT' WHERE etat IN ('DISPONIBLE', 'EN_SERVICE');
UPDATE materiels SET etat = 'HS'      WHERE etat IN ('EN_REPARATION', 'REBUT');
```

#### `DELETE` (utilisé pour reseed)
```sql
DELETE FROM referentiels WHERE type = 'ETAT_MATERIEL';
```

### 13.6 Zod — validation et inférence de type

Zod permet à la fois de **valider** un objet à l'exécution **et** d'en dériver son type TypeScript. C'est notre rempart entre l'API et la DB, **et** entre le formulaire React et l'API.

#### Constructeurs de base

| Méthode | Rôle |
|---------|------|
| `z.string()` / `z.number()` / `z.boolean()` | Types primitifs |
| `z.coerce.number()` / `z.coerce.date()` | Convertit la string en number/Date avant validation |
| `z.enum([...])` | Union de littéraux |
| `z.object({ ... })` | Objet structuré |
| `.optional()` / `.nullable()` | Champ optionnel ou nullable |
| `.default(x)` | Valeur par défaut |
| `.min(n)` / `.max(n)` | Contraintes |
| `.refine(fn, msg)` | Validation custom |
| `.safeParse(x)` | Valide sans lancer d'exception → `{ success, data }` |
| `z.infer<typeof schema>` | Extrait le type TS associé |

#### Schéma de création

**OGADE — `packages/shared/src/schemas/reservation.schema.ts`** :
```ts
export const createReservationSchema = z
  .object({
    materielId: z.number().int().positive(),
    dateDebut: z.coerce.date(),
    dateFin:   z.coerce.date(),
    type: z
      .enum([
        TypeReservation.TRANSFERT_SITE,
        TypeReservation.ETALONNAGE,
        TypeReservation.PRET_EXTERNE,
        TypeReservation.PRET_INTERNE,
        TypeReservation.AUTRE,
      ])
      .default(TypeReservation.AUTRE),
    motif: z.string().optional(),
    commentaire: z.string().optional(),
  })
  .refine((d) => d.dateFin >= d.dateDebut, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["dateFin"],
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
```
- `z.coerce.date()` : si on reçoit une string ISO depuis JSON, elle est convertie en `Date`.
- `.refine(...)` : règle métier croisée (la date de fin doit être ≥ date de début) avec un `path` qui pointe vers le champ pour afficher l'erreur sous le bon input.

#### Utilisation côté backend (NestJS)

**OGADE — `apps/api/src/reservations/reservations.controller.ts`** :
```ts
@Post()
async create(@Body() body: any, @CurrentUser() user: RequestUser | null) {
  const result = createReservationSchema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  // result.data est typé CreateReservationInput
  return this.service.create(result.data, user!.agentId);
}
```
- `safeParse` retourne `{ success: true, data }` ou `{ success: false, error }`.
- `result.error.flatten()` produit une réponse JSON lisible côté client.

#### Utilisation côté frontend (react-hook-form + zodResolver)

**OGADE — `apps/web/src/pages/MaquetteFormPage.tsx`** :
```ts
import { zodResolver } from "@hookform/resolvers/zod";

const { register, handleSubmit, formState: { errors } } = useForm<CreateMaquetteInput>({
  resolver: zodResolver(createMaquetteSchema),
});
```
La validation tourne **avant** la soumission. Si une règle Zod échoue, `errors.<champ>` est rempli automatiquement, et on peut afficher l'erreur dans le JSX.

#### Composition de schémas
**OGADE — `packages/shared/src/schemas/maquette.schema.ts`** :
```ts
export const createMaquetteSchema = z.object(baseFields);

export const updateMaquetteSchema = createMaquetteSchema.partial().extend({
  etat: z.enum([...]).optional(),
  emprunteurId: z.number().nullable().optional(),
  dateEmprunt: z.coerce.date().nullable().optional(),
});
```
- `.partial()` : tous les champs deviennent optionnels (utile pour `PATCH`).
- `.extend({...})` : ajoute de nouveaux champs.

### 13.7 React hooks — fonctions clés

Un *hook* est une fonction qui commence par `use` et permet d'attacher de l'**état** ou des **effets** à un composant fonction.

#### `useState` — état local
```tsx
const [valeur, setValeur] = useState<Type>(valeurInitiale);
```

**OGADE — `apps/web/src/pages/MaterielsListPage.tsx`** :
```tsx
const [search, setSearch] = useState("");
const [filterEtat, setFilterEtat] = useState("");
const [filterTypeEnd, setFilterTypeEnd] = useState("");
const [activeKpi, setActiveKpi] = useState<string | null>(null);
const [selectedId, setSelectedId] = useState<number | null>(null);
const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
```

**Setter fonctionnel** (utile quand on dépend de l'ancienne valeur) :
```tsx
setExpandedIds((s) => {
  const n = new Set(s);
  if (n.has(id)) n.delete(id); else n.add(id);
  return n;
});
```

#### `useEffect` — effet de bord (souscriptions, écouteurs, fetch en bas niveau)
```tsx
useEffect(() => {
  // code à exécuter…
  return () => { /* cleanup */ };
}, [deps]);
```

**OGADE — `apps/web/src/components/MaterielDrawer.tsx`** (Escape ferme le drawer) :
```tsx
useEffect(() => {
  if (isPage || !onClose) return;
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);  // cleanup
}, [onClose, isPage]);
```

**Génération d'URL d'image (avec libération mémoire)** :
```tsx
useEffect(() => {
  let revoke: string | null = null;
  api.fetchBlob(`/qrcode/maquette/${id}`).then((blob) => {
    const url = URL.createObjectURL(blob);
    revoke = url;
    setSrc(url);
  });
  return () => { if (revoke) URL.revokeObjectURL(revoke); };
}, [id]);
```

#### `useMemo` — mémoise un calcul coûteux
Recalculé **uniquement** si les dépendances changent.

**OGADE — `apps/web/src/components/GanttCalendar.tsx`** :
```tsx
const eventsByMateriel = useMemo(() => {
  const map = new Map<number, CalendarEvent[]>();
  materiels.forEach((m) => map.set(m.id, []));
  events.forEach((ev) => {
    if (!map.has(ev.materielId)) return;
    map.get(ev.materielId)!.push(ev);
  });
  return map;
}, [materiels, events]);
```
Sans `useMemo`, ce calcul tournerait à chaque re-render — coûteux pour un Gantt de 90 jours × 50 matériels.

#### `useCallback` — mémoise une **fonction**
**OGADE — `MaterielsListPage.tsx`** :
```tsx
const toggleExpand = useCallback(
  (id: number) =>
    setExpandedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    }),
  [],
);
```
Utile quand on passe la fonction en prop d'un enfant memoized.

#### `useRef` — référence mutable persistante
```tsx
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();
```

#### Hooks personnalisés OGADE

| Hook | Rôle |
|------|------|
| `usePagination` (`apps/web/src/hooks/use-pagination.ts`) | Lit `?page=&pageSize=` dans l'URL et expose `setPage` |
| `useReferentiel(type)` (`apps/web/src/hooks/use-referentiels.ts`) | Charge un référentiel typé (TYPE_END, MATIERE…) avec cache |
| `useSites()`, `useEntreprises(type?)` | Sucre syntaxique sur `useReferentiel` pour les listes Sites/Entreprises |
| `useAuth()` (`apps/web/src/lib/auth.tsx`) | Donne `{ user, login, logout, getAccessToken }` |

#### `useContext` — état global (consommation)
**OGADE — `apps/web/src/lib/auth.tsx`** :
```tsx
const AuthContext = createContext<AuthContextValue>({ user: null, ... });

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
```
Tout composant peut lire l'utilisateur courant : `const { user } = useAuth();`.

### 13.8 React Query + react-hook-form — fonctions clés

#### `useQuery` — récupérer + cacher
```ts
useQuery<T>({ queryKey, queryFn, enabled?, staleTime? })
```

**OGADE — `apps/web/src/pages/MaterielsListPage.tsx`** :
```tsx
const { data, isLoading } = useQuery<PaginatedResult<Materiel>>({
  queryKey: ["materiels", { ...queryParams, search, etat: filterEtat, scope }],
  queryFn: () => api.get("/materiels", {
    ...queryParams,
    search: search || undefined,
    etat: filterEtat || undefined,
    mes: scope === "mes" ? "true" : undefined,
  }),
});
```
- `queryKey` est un tableau qui sert d'**identifiant de cache**. Si une valeur change → nouvelle requête.
- `queryFn` retourne une `Promise`.

#### `useMutation` — créer / modifier / supprimer
```ts
const m = useMutation({ mutationFn, onSuccess, onError });
m.mutate(payload);   // lance la requête
m.isPending          // true tant que ça mouline
```

**OGADE — `apps/web/src/components/ReservationModal.tsx`** :
```tsx
const createMutation = useMutation({
  mutationFn: (payload: any) => api.post<Reservation>("/reservations", payload),
  onSuccess: (created) => {
    invalidateAfterMutation();             // rafraîchit les listes
    onCreated?.(created);
    onClose();
  },
  onError: (e: any) => setSubmitError(e?.message ?? "Erreur lors de la création"),
});
```

#### `useQueryClient().invalidateQueries`
Marque un cache comme "périmé" → les composants qui l'utilisent re-fetchent.

```tsx
const qc = useQueryClient();

const invalidateAfterMutation = () => {
  qc.invalidateQueries({ queryKey: ["reservations"] });
  qc.invalidateQueries({ queryKey: ["reservations-stats"] });
  qc.invalidateQueries({ queryKey: ["materiel-reservations"] });
  qc.invalidateQueries({ queryKey: ["reservation-conflicts"] });
};
```
Tout `queryKey` qui **commence par** ce préfixe est invalidé. Donc `["reservations", { …filtres }]` est aussi rafraîchi.

#### `staleTime: 0` + `refetch()` — forcer la fraîcheur
**OGADE — `ReservationModal.tsx`** (anti double-réservation) :
```tsx
const { data: conflicts = [], refetch: refetchConflicts } = useQuery<Conflict[]>({
  queryKey: ["reservation-conflicts", mat?.id, debut, fin, reservation?.id],
  queryFn: () => api.get("/reservations/conflicts", { ... }),
  enabled: !!mat && !!debut && !!fin,
  staleTime: 0,                                     // toujours considéré "périmé"
});

async function handleSubmit() {
  const fresh = await refetchConflicts();           // re-check synchrone juste avant
  if (fresh.data && fresh.data.length > 0) {
    setSubmitError("Conflit avec une réservation existante");
    return;
  }
  createMutation.mutate(payload);
}
```

#### `useForm` (react-hook-form) — formulaire React efficace
```ts
const {
  register,                 // câble un input au state
  handleSubmit,             // wrapper de submit
  formState: { errors },    // erreurs Zod
  watch,                    // lit la valeur courante d'un champ
  reset,                    // recharge avec de nouvelles valeurs
} = useForm({ resolver: zodResolver(schema), defaultValues: {...} });
```

**OGADE — `apps/web/src/pages/MaquetteFormPage.tsx`** :
```tsx
const { register, handleSubmit, formState: { errors }, watch, reset } =
  useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      reference: "",
      libelle: "",
      referenceASN: false,
      adressePays: "FR",
    },
  });

// JSX
<input type="text" className="oinput mono" {...register("reference")} />
<select className="oselect" {...register("typeMaquette")}>...</select>
<textarea className="otextarea" {...register("description")} />

<form onSubmit={handleSubmit(onSubmit)}>...</form>
```

`{...register("reference")}` injecte automatiquement `name`, `onChange`, `onBlur`, `ref` sur l'input.

#### `reset()` — préremplir le form en édition
```tsx
useEffect(() => {
  if (!isEdit || !existing) return;
  reset({
    reference: existing.reference,
    libelle: existing.libelle,
    typeMaquette: existing.typeMaquette ?? "",
    // …
  });
}, [existing, isEdit, reset]);
```

#### `watch()` — lire la valeur en direct (pour conditionner l'affichage)
```tsx
const wRef = watch("reference");
const wLib = watch("libelle");
{!wRef && <p className="field-error">Champ requis</p>}
```

### 13.9 NestJS — décorateurs principaux

#### `@Module({...})` — déclare un module
**OGADE — `apps/api/src/maquettes/maquettes.module.ts`** :
```ts
@Module({
  imports: [EvenementsModule],
  controllers: [MaquettesController],
  providers: [MaquettesService],
  exports: [MaquettesService],
})
export class MaquettesModule {}
```
- `imports` : les autres modules dont on dépend (leurs `exports` sont injectables ici).
- `controllers` : qui répond aux requêtes HTTP.
- `providers` : services injectables.
- `exports` : ce qu'on expose à d'autres modules.

#### `@Controller(prefix)` — préfixe d'URL
```ts
@Controller('api/v1/materiels')
export class MaterielsController { ... }
```

#### `@Get`, `@Post`, `@Patch`, `@Delete` — méthodes HTTP
**OGADE — `apps/api/src/reservations/reservations.controller.ts`** :
```ts
@Get('stats')                              // GET /api/v1/reservations/stats
async stats(@CurrentUser() user) { ... }

@Get(':id')                                // GET /api/v1/reservations/42
async findOne(@Param('id', ParseIntPipe) id: number) { ... }

@Post()                                    // POST /api/v1/reservations
@HttpCode(HttpStatus.CREATED)
async create(@Body() body: any) { ... }

@Patch(':id')                              // PATCH /api/v1/reservations/42
async update(...) { ... }

@Delete(':id')                             // DELETE /api/v1/reservations/42
@HttpCode(HttpStatus.NO_CONTENT)
async remove(@Param('id', ParseIntPipe) id: number) { ... }
```

#### Décorateurs de paramètres

| Décorateur | Rôle | Exemple |
|------------|------|---------|
| `@Param('id')` | Lit un param d'URL | `/users/:id` → `id` |
| `@Query('search')` | Lit un query param | `?search=foo` |
| `@Body()` | Body JSON de la requête | `POST {…}` |
| `@Res()` | Objet réponse Express bas niveau | pour les fichiers binaires |
| `@CurrentUser()` (custom OGADE) | Utilisateur courant via JWT | injecté par `auth.guard.ts` |

**OGADE — endpoint PDF** :
```ts
@Get(':id/pdf')
async pdf(
  @Param('id', ParseIntPipe) id: number,
  @Res() res: Response,
): Promise<void> {
  const buffer = await this.pdfService.materielPdf(id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="OGADE-${id}.pdf"`);
  res.end(buffer);
}
```

#### `@Injectable()` — service ou helper injectable
**OGADE — `materiels.service.ts`** :
```ts
@Injectable()
export class MaterielsService {
  constructor(
    private readonly prisma: PrismaService,    // injection auto
    private readonly evenements: EvenementsService,
  ) {}
}
```
NestJS appelle `new MaterielsService(prisma, evenements)` automatiquement. Pas besoin d'instancier à la main.

#### `@Public()` (custom OGADE) — bypass de l'auth
```ts
@Public()
@Post('login')
login(@Body() body: any) { ... }
```
Le `auth.guard.ts` vérifie ce décorateur via `Reflector` : si présent → on laisse passer sans token.

#### Pipes — transformation/validation des params
- `ParseIntPipe` : convertit un param string en number, sinon 400.
- `ParseUUIDPipe` (non utilisé ici), etc.

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) { ... }
```

#### Exceptions HTTP toutes prêtes

| Exception | Statut |
|-----------|--------|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |

**OGADE** :
```ts
if (!result.success) throw new BadRequestException(result.error.flatten());
if (!maquette)       throw new NotFoundException(`Maquette #${id} not found`);
```

### 13.10 CSS — variables et conventions OGADE

#### Variables CSS (custom properties)
Définies une fois sur `:root`, utilisables partout via `var(...)`.

**OGADE — `apps/web/src/ogade-design.css`** :
```css
:root {
  --bg:        oklch(0.985 0.003 80);
  --bg-panel:  oklch(1 0 0);
  --bg-sunken: oklch(0.945 0.005 80);
  --ink:       oklch(0.22 0.015 270);
  --ink-3:     oklch(0.55 0.015 270);
  --line:      oklch(0.90 0.006 270);

  --accent:        oklch(0.55 0.20 275);
  --accent-soft:   oklch(0.95 0.04 275);
  --emerald: oklch(0.60 0.16 155);
  --rose:    oklch(0.62 0.21 20);
  --amber:   oklch(0.72 0.17 75);

  --row-h: 50px;
  --pad-x: 12px;
}
```
On utilise `oklch(L C h)` (espace de couleurs perceptuel) plutôt que `hex` pour des nuances harmonieuses.

#### Composants nommés
**OGADE — bouton générique `obtn`** :
```css
.obtn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg-panel); color: var(--ink-2);
  font-size: 12.5px; font-weight: 500; cursor: default;
}
.obtn:hover { background: var(--bg-sunken); }
.obtn.accent { background: var(--accent); color: white; border-color: var(--accent); }
.obtn.ghost  { border-color: transparent; background: transparent; }
.obtn.sm     { padding: 4px 9px; font-size: 12px; }
```
Et côté JSX : `<button className="obtn accent sm">…</button>`.

#### Pills colorés (statuts)
```css
.pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 9px 2px 7px;
  border-radius: 999px;
  font-size: 11.5px; font-weight: 500;
}
.pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.pill.c-emerald { color: var(--emerald); background: var(--emerald-soft); }
.pill.c-rose    { color: var(--rose);    background: var(--rose-soft); }
.pill.c-sky     { color: var(--sky);     background: var(--sky-soft); }
```
**Côté JSX** :
```tsx
<span className="pill c-emerald"><span className="dot" />Correct</span>
```

#### Custom property dynamique depuis React
Astuce qu'on utilise pour le Gantt et les marqueurs de défauts :
```tsx
<div
  className="cal-bar reserv sky"
  style={{
    left: `${sPct}%`,
    width: `${ePct - sPct}%`,
  }}
/>
<div
  className="mq-plan-defect"
  style={{ ["--def-color" as string]: defautColor(d.typeDefaut) }}
/>
```

### 13.11 Dockerfile — commandes principales

| Instruction | Rôle |
|-------------|------|
| `FROM image` | Image de base |
| `WORKDIR /chemin` | Répertoire courant dans l'image |
| `COPY src dst` | Copie depuis le contexte de build vers l'image |
| `RUN cmd` | Exécute une commande pendant le build (résultat figé dans une couche) |
| `ENV NAME=value` | Variable d'environnement |
| `EXPOSE 8080` | Documente le port (info, pas obligatoire) |
| `CMD ["sh","start.sh"]` | Commande de démarrage du conteneur |
| `AS nom` | Multi-stage : nomme un stage |
| `--from=stage` | Copie depuis un stage précédent |

**OGADE — multi-stage** (recopie commentée) :
```dockerfile
# Stage 1 : on installe et on build
FROM node:20-slim AS builder
RUN corepack enable                           # active pnpm
WORKDIR /app
COPY pnpm-lock.yaml package.json ./           # 1) manifestes (cache)
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile            # 2) install (mis en cache)
COPY . .                                      # 3) reste du code
RUN pnpm run db:generate
RUN pnpm run build                            # 4) build TS → JS

# Stage 2 : image finale, légère
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /deploy .                 # uniquement l'output du build
EXPOSE 8080
CMD ["sh", "start.sh"]                        # prisma migrate deploy + node main.js
```

### 13.12 YAML — workflow GitHub Actions

YAML = format texte basé sur l'**indentation** (pas d'accolades). Utilisé par GitHub Actions, Docker Compose, Kubernetes…

**OGADE — `.github/workflows/deploy-azure.yml`** :
```yaml
name: Deploy to Azure App Service
on:
  push:
    branches: [main]                    # déclencheur

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest              # machine fournie par GitHub
    permissions:
      contents: read
      packages: write                   # pour pousser sur ghcr.io

    steps:
      - uses: actions/checkout@v4       # clone le repo

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/ogade:latest
            ghcr.io/${{ github.repository_owner }}/ogade:${{ github.sha }}
```

Concepts YAML :
- `name:`, `on:`, `jobs:` sont des clés ; l'indentation définit la hiérarchie.
- `[main]` est un tableau inline.
- `${{ ... }}` sont des **expressions** GitHub Actions qui interpolent secrets et contexte.
- `uses: org/action@version` réutilise une action publiée sur le marketplace.
