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
