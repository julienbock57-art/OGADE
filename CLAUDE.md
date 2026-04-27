# CLAUDE.md — OGADE Project Reference

## Quick Start

```bash
pnpm install              # Install dependencies
pnpm run docker:up        # Start PostgreSQL (docker-compose)
pnpm run db:generate      # Generate Prisma client
pnpm run db:migrate       # Run migrations
pnpm run db:seed          # Seed database
pnpm run dev              # Start API + Web in parallel
```

- API: http://localhost:3000 — Swagger: http://localhost:3000/api/docs
- Web: http://localhost:5173
- Build: `pnpm run build` (shared → web → api)

## Architecture

pnpm monorepo with 3 packages:

| Package | Stack | Path |
|---------|-------|------|
| `@ogade/api` | NestJS 10 + Prisma 5 + PostgreSQL | `apps/api/` |
| `@ogade/web` | React 18 + Vite 5 + Tailwind 3 | `apps/web/` |
| `@ogade/shared` | Zod schemas + TypeScript types | `packages/shared/` |

Node ≥20, pnpm ≥9. Production: Docker → Azure App Service + PostgreSQL Flexible Server.

## Project Structure

```
apps/api/src/
├── agents/           # Agent CRUD + role assignment
├── auth/             # Microsoft + local JWT auth
│   ├── auth.guard.ts          # Global guard (Bearer + x-user-email fallback)
│   ├── auth.controller.ts     # /login, /config, /me, /validate
│   ├── local-auth.service.ts  # JWT HS256 signing + bcrypt passwords
│   ├── microsoft-token.service.ts  # JWKS verification (jose)
│   ├── public.decorator.ts    # @Public() skips auth
│   └── roles.decorator.ts     # @Roles() role-based access
├── demandes-envoi/   # Shipment requests + line items
├── entreprises/      # Company reference data
├── fichiers/         # File metadata (Azure Blob)
├── maquettes/        # Model/prototype management
├── materiels/        # Equipment/instrument management
├── prisma/           # PrismaService (global module)
├── qrcode/           # QR code generation
├── referentiels/     # Reference lists (dropdowns)
├── sites/            # Site reference data
├── main.ts           # Bootstrap: Helmet, CORS, Swagger, static assets, SPA fallback
├── app.module.ts     # Root module imports
├── health.controller.ts       # GET /api/health (@Public)
└── spa-fallback.filter.ts     # Serves index.html for non-API 404s

apps/web/src/
├── pages/            # 17 page components (see Routes below)
├── components/       # Badge, DataTable, Pagination
├── layouts/          # MainLayout (sidebar + topbar)
├── hooks/            # use-pagination, use-referentiels
├── lib/
│   ├── api.ts        # Typed fetch client with token injection
│   ├── auth.tsx      # AuthProvider (MSAL + local JWT + DEV_USER fallback)
│   └── msal-config.ts # fetchAuthConfig() from API + buildMsalConfig()
├── App.tsx           # QueryClient + AuthProvider + TokenBridge + Router
├── routes.tsx        # RequireAuth wrapper + all route definitions
└── main.tsx          # ReactDOM entry

packages/shared/src/
├── schemas/          # Zod: agent, materiel, maquette, demande-envoi, pagination
├── types/            # TS types: Agent, Role, Materiel, Maquette, DemandeEnvoi, etc.
└── index.ts          # Re-exports everything
```

## Database (Prisma)

**Schema**: `apps/api/prisma/schema.prisma`
**Migrations**: `apps/api/prisma/migrations/`
**Seed**: `apps/api/prisma/seed.ts`

### Models

| Model | Table | Key Fields | Notes |
|-------|-------|------------|-------|
| Agent | agents | email (unique), nom, prenom, passwordHash?, azureAdOid? | actif flag |
| Role | roles | code (unique), label | ADMIN, GESTIONNAIRE_MAGASIN, REFERENT_LOGISTIQUE, REFERENT_MAQUETTE, REFERENT_MATERIEL |
| AgentRole | agent_roles | agentId+roleId (PK), grantedBy? | |
| Materiel | materiels | reference (unique), libelle, etat, typeMateriel, typeEND, groupe | Soft delete (deletedAt) |
| Maquette | maquettes | reference (unique), libelle, etat, composant, categorie, forme | Hierarchy (maquetteMereId) |
| Defaut | defauts | maquetteId, typeDefaut, severite | MINEUR/MAJEUR/CRITIQUE |
| DemandeEnvoi | demandes_envoi | numero (unique), type, statut, demandeurId | BROUILLON→ENVOYEE→EN_TRANSIT→RECUE→CLOTUREE |
| DemandeEnvoiLigne | demande_envoi_lignes | demandeId, materielId?, maquetteId? | |
| Referentiel | referentiels | type+code (unique), label, position | 17 types (TYPE_END, TYPE_MATERIEL, etc.) |
| Site | ref_sites | code (unique), label, adresse, ville | |
| Entreprise | ref_entreprises | code (unique), label, type, siret? | |
| Fichier | fichiers | blobKey (unique), entityType, entityId | Azure Blob metadata |
| Evenement | evenements | entityType, entityId, eventType, payload | Audit trail |

### Migrations

| Migration | Description |
|-----------|-------------|
| 20260422090000_init | Initial schema |
| 20260424180000_add_powerapps_fields | PowerApps classification fields |
| 20260425120000_add_referentiels | Sites + Entreprises tables |
| 20260425200000_update_roles | Rename roles, seed admin user |
| 20260426100000_add_password_hash | Local auth password field |

## API Routes

All prefixed with `/api/v1/`. Auth guard is global; `@Public()` endpoints skip auth.

```
# Auth (public)
POST   /auth/login              # Local email/password → JWT
GET    /auth/config             # { microsoftAuth, localAuth, clientId, tenantId }
POST   /auth/validate           # Validate Microsoft token
# Auth (authenticated)
GET    /auth/me                 # Current user + roles

# Agents
GET    /agents                  # List (paginated: ?page=&pageSize=)
GET    /agents/:id
POST   /agents                  # { email, nom, prenom }
PATCH  /agents/:id              # { email?, nom?, prenom?, actif? }
POST   /agents/:id/roles        # { roleCode }
DELETE /agents/:id/roles/:code
PATCH  /agents/:id/password     # { password } (admin sets password)
DELETE /agents/:id/password     # Remove local password

# Materiels
GET    /materiels               # Filters: ?etat=&site=&typeEND=&typeMateriel=&groupe=&search=&page=&pageSize=
GET    /materiels/:id
POST   /materiels
PATCH  /materiels/:id
DELETE /materiels/:id           # Soft delete

# Maquettes
GET    /maquettes               # Paginated
GET    /maquettes/:id
POST   /maquettes
PATCH  /maquettes/:id
DELETE /maquettes/:id           # Soft delete
POST   /maquettes/:id/emprunter # Borrow
POST   /maquettes/:id/retourner # Return

# Demandes d'envoi
GET    /demandes-envoi          # Paginated
GET    /demandes-envoi/:id
POST   /demandes-envoi
PATCH  /demandes-envoi/:id
DELETE /demandes-envoi/:id
POST   /demandes-envoi/:id/lignes            # Add line
DELETE /demandes-envoi/:demandeId/lignes/:id  # Remove line

# Referentiels
GET    /referentiels/types      # List distinct types
GET    /referentiels?type=X     # List entries for type
POST   /referentiels            # { type, code, label }
PATCH  /referentiels/:id        # { label?, position?, actif? }
DELETE /referentiels/:id        # Soft delete (actif=false)

# Sites
GET    /sites
GET    /sites/:id
POST   /sites                   # { code, label, adresse?, ... }
PATCH  /sites/:id

# Entreprises
GET    /entreprises             # ?type= filter
GET    /entreprises/:id
POST   /entreprises
PATCH  /entreprises/:id

# Other
GET    /qrcode/:id              # QR code image
POST   /fichiers                # Upload file metadata
GET    /fichiers/:id
DELETE /fichiers/:id
GET    /api/health              # Health check (public, note: no /v1/)
```

## Frontend Routes

```
/                              → HomePage (dashboard KPIs)
/materiels                     → MaterielsListPage (filters, sort, badges)
/materiels/nouveau             → MaterielFormPage (create)
/materiels/:id                 → MaterielDetailPage (sectioned view)
/materiels/:id/edit            → MaterielFormPage (edit)
/maquettes                     → MaquettesListPage
/maquettes/nouveau             → MaquetteFormPage
/maquettes/:id                 → MaquetteDetailPage
/maquettes/:id/edit            → MaquetteFormPage
/demandes-envoi                → DemandesEnvoiListPage
/demandes-envoi/nouveau        → DemandeEnvoiFormPage
/demandes-envoi/:id            → DemandeEnvoiDetailPage
/agents                        → AgentsListPage
/admin/referentiels            → AdminReferentielsPage (gallery of 17 types + Sites + Entreprises)
/admin/referentiels/:type      → AdminReferentielTypePage (CRUD table)
/admin/sites                   → AdminSitesPage
/admin/entreprises             → AdminEntreprisesPage
/admin/agents                  → AdminAgentsPage (roles, passwords)
```

All wrapped in `RequireAuth` → shows `LoginPage` when auth is configured and user is null.

## Authentication Flow

### Dual auth: Microsoft + Local email/password

**Frontend startup** (`auth.tsx`):
1. Fetch `GET /api/v1/auth/config` → `{ microsoftAuth, localAuth, clientId, tenantId }`
2. If no auth configured → set DEV_USER (julien.bock57@gmail.com, ADMIN role)
3. Check localStorage for saved local JWT → validate via `GET /auth/me`
4. If Microsoft configured → initialize MSAL, handle redirect, check accounts
5. LoginPage shows both options: Microsoft button + email/password form

**Backend guard** (`auth.guard.ts`):
1. Check `@Public()` → skip auth
2. Try Bearer token: local JWT first (HS256, fast), then Microsoft JWKS
3. Fallback: `x-user-email` header (only when MSAL not configured = dev mode)
4. Lookup agent by email → must exist and be `actif: true`
5. Populate `request.user: RequestUser { agentId, email, nom, prenom, roles }`

**Security**:
- Passwords: bcryptjs, 12 salt rounds
- Local JWT: HS256, 7-day expiry, signed with `JWT_SECRET`
- `passwordHash` never exposed in API responses → returns `hasPassword: boolean`

## Environment Variables

### Required in production (Azure App Service)

```bash
DATABASE_URL="postgresql://..."
AZURE_AD_CLIENT_ID="c8151b03-b9a3-497c-97d2-6051dfa624cd"
AZURE_AD_TENANT_ID="common"
JWT_SECRET="<random 32+ char string>"
```

### Optional

```bash
PORT=8080                            # Default: 3000
CORS_ORIGIN="*"                      # Default: http://localhost:5173
AZURE_STORAGE_ACCOUNT_NAME="..."     # Azure Blob (file uploads)
AZURE_STORAGE_ACCOUNT_KEY="..."
AZURE_STORAGE_CONTAINER_NAME="..."
```

### Dev only (auto-configured)

```bash
DATABASE_URL="file:./ogade.db"       # SQLite
# No AZURE_AD_* → app uses DEV_USER fallback
```

**Note**: `VITE_*` variables are NOT needed — frontend fetches auth config from `/api/v1/auth/config` at runtime.

## Styling

Tailwind CSS 3.4 with custom EDF branding:

```js
// tailwind.config.js
colors: {
  "edf-blue": "#183F80",   // Primary brand color
  "edf-light": "#7DA8C9",  // Secondary
}
```

Usage: `bg-edf-blue`, `text-edf-blue`, `bg-edf-blue/10`, etc.

## Referentiel Types (dropdown values)

17 types in the `referentiels` table, used across materiel and maquette forms:

**Matériels**: TYPE_END, TYPE_MATERIEL, TYPE_TRADUCTEUR, GROUPE, ETAT_MATERIEL, COMPLETUDE, MOTIF_PRET
**Maquettes**: TYPE_MAQUETTE, COMPOSANT, CATEGORIE, FORME, TYPE_ASSEMBLAGE, MATIERE, PROCEDURE, TYPE_CONTROLE, ETAT_MAQUETTE, URGENCE

## Docker & CI/CD

- **Dockerfile**: Multi-stage (Node 20 slim). Builds all, copies dist, runs migrations at startup.
- **docker-compose.yml**: PostgreSQL 15 Alpine (ogade:ogade@localhost:5432/ogade)
- **CI/CD**: `.github/workflows/deploy-azure.yml` — push to main → build Docker image → push to ghcr.io → deploy to Azure App Service

## Key Conventions

- API base path: `/api/v1/`
- Soft deletes: `deletedAt` (materiels, maquettes) or `actif: false` (referentiels, agents)
- Pagination: `{ data: [...], total, page, pageSize, totalPages }`
- Reference fields stored as string codes (e.g. `typeEND: "UT"`)
- Prisma column mapping: camelCase in code → snake_case in DB (`@map()`)
- Frontend API client: `apps/web/src/lib/api.ts` — `api.get()`, `api.post()`, `api.patch()`, `api.delete()`
- Form components use react-hook-form + Zod resolvers
- TanStack React Query for all data fetching (staleTime: 30s, retry: 1)

## Admin User (seed)

- **julien.bock57@gmail.com** — Admin role, seeded via migration + seed.ts
- **admin@ogade.test** — Dev user with all roles (seed only)
