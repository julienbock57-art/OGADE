/**
 * DemandesEnvoiListPage — Espace END / Mouvements & Transferts.
 *
 * Reproduit le design de la maquette OGADE pour cette page :
 *  - Header avec titre + sous-titre + actions raccourcies (calendrier,
 *    réservations, + Nouveau mouvement).
 *  - Bandeau 5 KPI avec sparklines (total actifs, en transit,
 *    étalonnages, prêts, retards).
 *  - Toolbar : recherche + filtres + onglets de scope (Tous /
 *    Brouillons / À valider / Actifs / Clôturés) + compteur.
 *  - Table dense avec :
 *      • avatar bulle pour le demandeur
 *      • badge typeEnvoi avec icône
 *      • trajet origine → destination
 *      • barre de progression (étape X/10)
 *      • ligne dépliable (matériels concernés + documents/actions
 *        rapides : Bon transport, Photo colis, Détail, Confirmer
 *        réception).
 */
import { useMemo, useState, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DemandeEnvoi, PaginatedResult, Fichier } from "@ogade/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePagination } from "@/hooks/use-pagination";
import { useSites } from "@/hooks/use-referentiels";
import { openFichier, downloadFichier } from "@/lib/fichiers";
import Pagination from "@/components/Pagination";

// ── Icons inline ────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  cal:        "M4 5h12v12H4z M4 8h12 M7 3v4 M13 3v4",
  star:       "M10 3l2.3 4.6 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.4l5.2-.8L10 3z",
  plus:       "M10 4v12M4 10h12",
  search:     "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
  filter:     "M3 5h14M5 10h10M8 15h4",
  x:          "M5 5l10 10M15 5L5 15",
  chev_d:     "M5 8l5 5 5-5",
  chev_r:     "M8 5l5 5-5 5",
  eye:        "M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  check:      "M4 10l4 4 8-8",
  paperclip:  "M16 6l-7 7a3 3 0 0 0 4.2 4.2l7-7a5 5 0 0 0-7-7l-7 7a7 7 0 0 0 9.9 9.9L16 11",
  swap:       "M5 7h11l-3-3 M15 13H4l3 3",
  flask:      "M8 3h4 M9 3v5l-4 8a2 2 0 0 0 2 3h6a2 2 0 0 0 2-3l-4-8V3",
  loop:       "M4 8a6 6 0 0 1 11-2 M16 12a6 6 0 0 1-11 2 M14 6h2V4 M6 14H4v2",
  truck:      "M2 5h10v9H2z M12 8h4l2 3v3h-6 M5 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3 M14 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
  dots:       "M5 10h.01 M10 10h.01 M15 10h.01",
  alert:      "M10 7v4m0 2v.01 M2 16L10 3l8 13H2z",
};
function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const d = ICONS[name] ?? "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-2px" }}
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i === 0 ? p : "M" + p} />
      ))}
    </svg>
  );
}

// ── Mappings ────────────────────────────────────────────────────
const statutPill: Record<string, { cls: string; label: string }> = {
  BROUILLON:               { cls: "pill c-neutral", label: "Brouillon" },
  SOUMISE:                 { cls: "pill c-sky",     label: "Soumise" },
  VALIDEE_PARTIELLEMENT:   { cls: "pill c-amber",   label: "Val. partielle" },
  VALIDEE:                 { cls: "pill c-emerald", label: "Validée" },
  REFUSEE:                 { cls: "pill c-rose",    label: "Refusée" },
  PRETE_A_EXPEDIER:        { cls: "pill c-amber",   label: "Prête à expédier" },
  EN_TRANSIT:              { cls: "pill c-amber",   label: "En transit" },
  RECUE:                   { cls: "pill c-emerald", label: "Reçue" },
  LIVREE_TITULAIRE:        { cls: "pill c-emerald", label: "Livrée" },
  EN_COURS:                { cls: "pill c-sky",     label: "En cours" },
  EN_RETOUR:               { cls: "pill c-amber",   label: "Retour en transit" },
  RECUE_RETOUR:            { cls: "pill c-emerald", label: "Reçue retour" },
  CLOTUREE:                { cls: "pill c-violet",  label: "Clôturée" },
  ANNULEE:                 { cls: "pill c-rose",    label: "Annulée" },
};

// Étape sur 10 dérivée du statut, pour la barre de progression
const STATUT_STEP: Record<string, number> = {
  BROUILLON: 1,
  SOUMISE: 2,
  VALIDEE_PARTIELLEMENT: 3,
  VALIDEE: 3,
  REFUSEE: 0,
  PRETE_A_EXPEDIER: 4,
  EN_TRANSIT: 5,
  LIVREE_TITULAIRE: 6,
  RECUE: 7,
  EN_COURS: 7,
  EN_RETOUR: 8,
  RECUE_RETOUR: 9,
  CLOTUREE: 10,
  ANNULEE: 0,
};
const TOTAL_STEPS = 10;

type TypeEnvoiKey = "INTERNE" | "EXTERNE_TITULAIRE" | "ETALONNAGE" | "PRET_INTERNE" | "PRET_EXTERNE";

const typeEnvoiBadge: Record<TypeEnvoiKey, { label: string; icon: string; bg: string; fg: string }> = {
  INTERNE:           { label: "TRANSFERT SITE",    icon: "swap",  bg: "color-mix(in oklch, var(--emerald, #10b981) 14%, transparent)", fg: "var(--emerald, #047857)" },
  EXTERNE_TITULAIRE: { label: "ENVOI TITULAIRE",   icon: "truck", bg: "color-mix(in oklch, var(--sky, #0ea5e9) 14%, transparent)",     fg: "var(--sky, #0369a1)" },
  ETALONNAGE:        { label: "ÉTALONNAGE",        icon: "flask", bg: "color-mix(in oklch, var(--amber, #f59e0b) 16%, transparent)",   fg: "var(--amber, #b45309)" },
  PRET_INTERNE:      { label: "PRÊT INTERNE",      icon: "loop",  bg: "color-mix(in oklch, var(--emerald, #10b981) 14%, transparent)", fg: "var(--emerald, #047857)" },
  PRET_EXTERNE:      { label: "PRÊT EXTERNE",      icon: "loop",  bg: "color-mix(in oklch, var(--violet, #8b5cf6) 14%, transparent)",  fg: "var(--violet, #6d28d9)" },
};

const typeDemandeLabel: Record<string, string> = {
  MATERIEL: "Matériel",
  MAQUETTE: "Maquette",
  MUTUALISEE: "Mutualisée",
};

// Onglets de scope (filtrage par sous-ensemble de statuts)
type TabKey = "tous" | "brouillons" | "a-valider" | "actifs" | "clotures";
const TAB_LABEL: Record<TabKey, string> = {
  tous: "Tous",
  brouillons: "Brouillons",
  "a-valider": "À valider",
  actifs: "Actifs",
  clotures: "Clôturés",
};
const TAB_STATUTS: Record<TabKey, string[] | null> = {
  tous: null,
  brouillons: ["BROUILLON"],
  "a-valider": ["SOUMISE", "VALIDEE_PARTIELLEMENT"],
  actifs: [
    "VALIDEE",
    "PRETE_A_EXPEDIER",
    "EN_TRANSIT",
    "RECUE",
    "LIVREE_TITULAIRE",
    "EN_COURS",
    "EN_RETOUR",
    "RECUE_RETOUR",
  ],
  clotures: ["CLOTUREE", "REFUSEE", "ANNULEE"],
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
function isLate(d?: string | Date | null): boolean {
  if (!d) return false;
  return new Date(d).getTime() < Date.now();
}

// ── Sparkline ───────────────────────────────────────────────────
function Sparkline({ values, color, fillOpacity = 0.18 }: { values: number[]; color: string; fillOpacity?: number }) {
  if (values.length < 2) return null;
  const w = 200;
  const h = 38;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const step = w / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return [x, y] as const;
  });

  // smooth path with quadratic curves
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d += ` Q ${cx} ${y0}, ${cx} ${(y0 + y1) / 2} T ${x1} ${y1}`;
  }
  const fill = `${d} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={fill} fill={color} fillOpacity={fillOpacity} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Génère une mini-série déterministe à partir d'une valeur (pour décor)
function fakeSeries(seed: number, points = 10): number[] {
  const out: number[] = [];
  let s = seed * 9301 + 49297;
  for (let i = 0; i < points; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(Math.max(0, Math.round((s / 233280) * 10 + (Math.sin(i + seed) * 3))));
  }
  return out;
}

// ── KPI card with sparkline ─────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-panel)",
        border: `1px solid ${active ? color : "var(--line)"}`,
        borderRadius: 12,
        padding: "14px 16px 8px",
        cursor: onClick ? "pointer" : undefined,
        boxShadow: active ? `0 0 0 1px ${color}, 0 4px 14px ${color}22` : undefined,
        transition: "border-color 0.12s, box-shadow 0.12s",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minHeight: 130,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-3)" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ flex: 1, minHeight: 36, marginTop: 2 }}>
        <Sparkline values={fakeSeries(value + label.length)} color={color} />
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{sub}</div>
    </div>
  );
}

// ── Avatar ──────────────────────────────────────────────────────
function Avatar({ prenom, nom, color = "var(--accent)" }: { prenom?: string; nom?: string; color?: string }) {
  const initials = `${(prenom?.[0] ?? "").toUpperCase()}${(nom?.[0] ?? "").toUpperCase()}` || "?";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: `color-mix(in oklch, ${color} 18%, transparent)`,
        color,
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

// ── Progression bar ─────────────────────────────────────────────
function ProgressBar({ statut }: { statut: string }) {
  const step = STATUT_STEP[statut] ?? 0;
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  const isCloturee = statut === "CLOTUREE";
  const isRefusee = statut === "REFUSEE" || statut === "ANNULEE";
  const color = isCloturee
    ? "var(--emerald, #10b981)"
    : isRefusee
      ? "var(--rose, #ef4444)"
      : "var(--accent)";
  return (
    <div style={{ minWidth: 120 }}>
      <div
        style={{
          width: "100%",
          height: 5,
          background: "var(--line-2, #e5e7eb)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            transition: "width 0.3s",
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
        {pct}% · étape {step}/{TOTAL_STEPS}
      </div>
    </div>
  );
}

// ── Type badge with icon ────────────────────────────────────────
function TypeEnvoiBadge({ typeEnvoi }: { typeEnvoi?: string | null }) {
  if (!typeEnvoi || !(typeEnvoi in typeEnvoiBadge)) {
    return <span className="tag" style={{ fontSize: 10 }}>—</span>;
  }
  const b = typeEnvoiBadge[typeEnvoi as TypeEnvoiKey];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 6,
        background: b.bg,
        color: b.fg,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <Icon name={b.icon} size={11} />
      {b.label}
    </span>
  );
}

// ── Expanded row content ────────────────────────────────────────
interface ExpandedProps {
  demande: DemandeRow;
  onClose: () => void;
}

function ExpandedRow({ demande }: ExpandedProps) {
  const navigate = useNavigate();

  const { data: photos = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demande.id, "PHOTO", "expanded"],
    queryFn: () =>
      api.get<Fichier[]>(`/fichiers/entity/DEMANDE_ENVOI/${demande.id}`, { typeFichier: "PHOTO" }),
  });
  const { data: docs = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demande.id, "DOCUMENT", "expanded"],
    queryFn: () =>
      api.get<Fichier[]>(`/fichiers/entity/DEMANDE_ENVOI/${demande.id}`, { typeFichier: "DOCUMENT" }),
  });

  const photosCount = photos.length;
  const bonTransport = docs.find((d) => d.context === "bon-transport");
  const canConfirmReception = demande.statut === "EN_TRANSIT";

  return (
    <td colSpan={9} style={{ padding: 0, background: "var(--bg-sunken, #f9fafb)", borderTop: "1px solid var(--line-2)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, padding: "16px 24px" }}>
        {/* Matériels concernés */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginBottom: 8 }}>
            Matériels concernés ({demande.lignes?.length ?? 0})
          </div>
          <div className="vstack" style={{ gap: 6 }}>
            {(demande.lignes ?? []).map((l) => {
              const item = l.materiel ?? l.maquette;
              return (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 0",
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)", minWidth: 60 }}>
                    {item?.reference ?? "—"}
                  </span>
                  <span style={{ fontWeight: 600 }}>{(item?.libelle ?? "").toUpperCase()}</span>
                  {l.materiel?.typeMateriel && (
                    <span style={{ color: "var(--ink-3)" }}>· {l.materiel.typeMateriel}</span>
                  )}
                  {l.maquette?.typeMaquette && (
                    <span style={{ color: "var(--ink-3)" }}>· {l.maquette.typeMaquette}</span>
                  )}
                  <span style={{ flex: 1 }} />
                  {(l.materiel?.site || l.maquette?.site) && (
                    <span className="tag" style={{ fontSize: 9 }}>
                      {l.materiel?.site ?? l.maquette?.site}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents & actions */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginBottom: 8 }}>
            Documents & actions
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {bonTransport && (
              <button
                type="button"
                className="obtn sm"
                onClick={() => downloadFichier(bonTransport.id, bonTransport.nomOriginal ?? "bon-transport")}
                title="Télécharger le bon de transport"
              >
                <Icon name="paperclip" size={11} />
                Bon transport
              </button>
            )}
            {photosCount > 0 && (
              <button
                type="button"
                className="obtn sm"
                onClick={() => photos[0] && openFichier(photos[0].id)}
                title="Ouvrir les photos colis"
              >
                <Icon name="paperclip" size={11} />
                Photo colis ({photosCount})
              </button>
            )}
            <button
              type="button"
              className="obtn sm"
              onClick={() => navigate(`/demandes-envoi/${demande.id}`)}
            >
              <Icon name="eye" size={11} />
              Détail
            </button>
            {canConfirmReception && (
              <button
                type="button"
                className="obtn accent sm"
                onClick={() => navigate(`/demandes-envoi/${demande.id}`)}
              >
                <Icon name="check" size={11} />
                Confirmer réception
              </button>
            )}
          </div>
        </div>
      </div>
    </td>
  );
}

// ── Types ───────────────────────────────────────────────────────
interface DemandeRow extends DemandeEnvoi {
  demandeur?: { id: number; prenom: string; nom: string; email: string } | null;
  _count?: { lignes: number };
  lignes?: {
    id: number;
    statut: string;
    materielId?: number | null;
    maquetteId?: number | null;
    materiel?: { id: number; reference: string; libelle: string; site?: string | null; typeMateriel?: string | null } | null;
    maquette?: { id: number; reference: string; libelle: string; site?: string | null; typeMaquette?: string | null } | null;
  }[];
}

interface DemandeStats {
  total: number;
  brouillons: number;
  aValider: number;
  aTraiter: number;
  enTransit: number;
  cloturees: number;
  refusees: number;
  byStatut: Record<string, number>;
}

// ── Page ────────────────────────────────────────────────────────
export default function DemandesEnvoiListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { page, setPage, queryParams } = usePagination();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("tous");
  const [filterTypeEnvoi, setFilterTypeEnvoi] = useState("");
  const [filterUrgence, setFilterUrgence] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [scope, setScope] = useState<"tous" | "mes">("tous");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: sites } = useSites();
  const siteOptions = useMemo(
    () => (sites ?? []).map((s) => ({ code: s.code, label: s.label })),
    [sites],
  );

  const { data: stats } = useQuery<DemandeStats>({
    queryKey: ["demandes-envoi", "stats"],
    queryFn: () => api.get("/demandes-envoi/stats"),
  });

  // Pour les onglets multi-statuts on filtre client-side. Si l'onglet
  // ne contient qu'un seul statut, on l'envoie au serveur pour bénéficier
  // de la pagination.
  const tabStatuts = TAB_STATUTS[tab];
  const serverStatut = tabStatuts && tabStatuts.length === 1 ? tabStatuts[0] : "";

  const { data, isLoading, isError } = useQuery<PaginatedResult<DemandeRow>>({
    queryKey: [
      "demandes-envoi",
      "list",
      { ...queryParams, search, tab, filterTypeEnvoi, filterUrgence, filterSite, scope },
    ],
    queryFn: () =>
      api.get("/demandes-envoi", {
        ...queryParams,
        statut: serverStatut || undefined,
        typeEnvoi: filterTypeEnvoi || undefined,
        urgence: filterUrgence || undefined,
        site: filterSite || undefined,
        search: search.trim() || undefined,
      }),
  });

  const rowsRaw = data?.data ?? [];
  // Filtrage côté client pour onglets multi-statuts + scope "mes"
  const rows = rowsRaw.filter((r) => {
    if (tabStatuts && tabStatuts.length > 1 && !tabStatuts.includes(r.statut)) return false;
    if (scope === "mes" && user && r.demandeur?.email !== user.email) return false;
    return true;
  });

  // Compteurs par onglet (sur les stats globales)
  const tabCounts: Record<TabKey, number> = {
    tous: stats?.total ?? 0,
    brouillons: stats?.brouillons ?? 0,
    "a-valider": stats?.aValider ?? 0,
    actifs:
      ((stats?.byStatut?.VALIDEE ?? 0) +
        (stats?.byStatut?.PRETE_A_EXPEDIER ?? 0) +
        (stats?.byStatut?.EN_TRANSIT ?? 0) +
        (stats?.byStatut?.RECUE ?? 0) +
        (stats?.byStatut?.LIVREE_TITULAIRE ?? 0) +
        (stats?.byStatut?.EN_COURS ?? 0) +
        (stats?.byStatut?.EN_RETOUR ?? 0) +
        (stats?.byStatut?.RECUE_RETOUR ?? 0)),
    clotures:
      (stats?.cloturees ?? 0) + (stats?.refusees ?? 0),
  };

  // KPIs spécifiques aux mouvements (typeEnvoi)
  const kpiTotalActifs =
    (stats?.byStatut?.VALIDEE ?? 0) +
    (stats?.byStatut?.PRETE_A_EXPEDIER ?? 0) +
    (stats?.byStatut?.EN_TRANSIT ?? 0) +
    (stats?.byStatut?.RECUE ?? 0) +
    (stats?.byStatut?.LIVREE_TITULAIRE ?? 0) +
    (stats?.byStatut?.EN_COURS ?? 0) +
    (stats?.byStatut?.EN_RETOUR ?? 0) +
    (stats?.byStatut?.RECUE_RETOUR ?? 0);
  const kpiEnTransit =
    (stats?.byStatut?.EN_TRANSIT ?? 0) + (stats?.byStatut?.EN_RETOUR ?? 0);
  // Étalonnages / prêts ne se déduisent pas des stats par statut → on
  // les compte sur la page courante (best-effort).
  const kpiEtalonnages = rowsRaw.filter((r) => r.typeEnvoi === "ETALONNAGE" && r.statut !== "CLOTUREE" && r.statut !== "ANNULEE").length;
  const kpiPrets = rowsRaw.filter((r) => (r.typeEnvoi === "PRET_INTERNE" || r.typeEnvoi === "PRET_EXTERNE") && r.statut !== "CLOTUREE" && r.statut !== "ANNULEE").length;
  const kpiRetards = rowsRaw.filter((r) => isLate(r.dateRetourEstimee) && r.statut !== "CLOTUREE" && r.statut !== "ANNULEE" && r.statut !== "RECUE_RETOUR").length;

  const activeFilterCount = [filterTypeEnvoi, filterUrgence, filterSite].filter(Boolean).length;
  const clearFilters = () => {
    setFilterTypeEnvoi("");
    setFilterUrgence("");
    setFilterSite("");
    setSearch("");
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
            Espace END / Mouvements & transferts
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
            Mouvements & Transferts
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2, marginBottom: 0 }}>
            Suivi des envois, étalonnages, prêts internes et externes
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/calendrier" className="obtn" style={{ textDecoration: "none" }}>
            <Icon name="cal" size={13} />
            Vue calendrier
          </Link>
          <Link to="/reservations" className="obtn" style={{ textDecoration: "none" }}>
            <Icon name="star" size={13} />
            Réservations
          </Link>
          <Link to="/demandes-envoi/nouveau" className="obtn accent" style={{ textDecoration: "none" }}>
            <Icon name="plus" size={13} />
            Nouveau mouvement
          </Link>
        </div>
      </div>

      {/* KPIs avec sparklines */}
      <div
        className="kpi-grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          padding: "0 24px",
          marginBottom: 16,
        }}
      >
        <KpiCard label="Total actifs"        value={kpiTotalActifs}  sub="mouvements en cours"   color="var(--accent, #6366f1)"     active={tab === "actifs"}    onClick={() => setTab("actifs")} />
        <KpiCard label="En transit"           value={kpiEnTransit}    sub="aller + retour"        color="var(--sky, #0ea5e9)" />
        <KpiCard label="Étalonnages en cours" value={kpiEtalonnages}  sub="chez prestataire"      color="var(--violet, #8b5cf6)" />
        <KpiCard label="Prêts en cours"       value={kpiPrets}        sub="internes + externes"   color="var(--amber, #f59e0b)" />
        <KpiCard label="Retards"              value={kpiRetards}      sub="retour dépassé"        color="var(--rose, #ef4444)" />
      </div>

      {/* Toolbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-panel)",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div className="search-bar" style={{ flex: 1, minWidth: 280, maxWidth: 480 }}>
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Recherche — N°, demandeur, destinataire, matériel…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button
          className={`obtn${showFilters || activeFilterCount > 0 ? " accent" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter" size={13} />
          Filtres
          {activeFilterCount > 0 && (
            <span style={{ background: "white", color: "var(--accent)", borderRadius: 999, padding: "0 6px", fontSize: 11, fontWeight: 600 }}>
              {activeFilterCount}
            </span>
          )}
        </button>
        <span style={{ flex: 1 }} />
        {/* Onglets de scope */}
        <div className="seg" role="tablist">
          {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
            <button
              key={k}
              role="tab"
              className={tab === k ? "on" : ""}
              onClick={() => {
                setTab(k);
                setPage(1);
              }}
            >
              {TAB_LABEL[k]}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-4)", whiteSpace: "nowrap" }}>
          {rows.length} résultat{rows.length > 1 ? "s" : ""}
          {tabCounts[tab] !== undefined && rows.length !== tabCounts[tab] ? ` / ${tabCounts[tab]}` : ""}
        </span>
      </div>

      {/* Filter panel collapsable */}
      {showFilters && (
        <div style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--line)", padding: "12px 24px" }}>
          <div className="filter-grid">
            <select
              value={filterTypeEnvoi}
              onChange={(e) => { setFilterTypeEnvoi(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">Type d'envoi — Tous</option>
              {Object.entries(typeEnvoiBadge).map(([code, b]) => (
                <option key={code} value={code}>{b.label}</option>
              ))}
            </select>
            <select
              value={filterUrgence}
              onChange={(e) => { setFilterUrgence(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">Urgence — Toutes</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Tres urgent">Très urgent</option>
            </select>
            <select
              value={filterSite}
              onChange={(e) => { setFilterSite(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">Site — Tous</option>
              {siteOptions.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
            <div className="seg">
              <button className={scope === "tous" ? "on" : ""} onClick={() => setScope("tous")}>Toutes</button>
              <button className={scope === "mes" ? "on" : ""} onClick={() => setScope("mes")}>Mes demandes</button>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="obtn ghost" style={{ marginTop: 10, fontSize: 12 }}>
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--line)", overflow: "auto" }}>
        {isLoading ? (
          <div style={{ padding: "32px 24px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 56, background: "var(--bg-sunken)", borderRadius: 6, marginBottom: 10, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : isError ? (
          <p style={{ padding: "32px 24px", color: "var(--rose)", fontSize: 13 }}>
            Erreur lors du chargement des mouvements.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--ui-fs)" }}>
            <thead>
              <tr>
                <th style={{ width: 32, padding: 0, background: "var(--bg-panel)", borderBottom: "1px solid var(--line)" }} />
                {[
                  "N° / TYPE",
                  "DEMANDEUR",
                  "ORIGINE → DESTINATION",
                  "MATÉRIELS",
                  "STATUT",
                  "DATES CLÉS",
                  "PROGRESSION",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: "var(--ink-3)",
                      background: "var(--bg-panel)",
                      borderBottom: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
                <th style={{ width: 32, background: "var(--bg-panel)", borderBottom: "1px solid var(--line)" }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 14px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                    Aucune demande ne correspond aux critères.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const pill = statutPill[row.statut] ?? { cls: "pill c-neutral", label: row.statut };
                  const lignesCount = row._count?.lignes ?? row.lignes?.length ?? 0;
                  const expanded = expandedId === row.id;
                  const lateRetour = isLate(row.dateRetourEstimee) && row.statut !== "CLOTUREE" && row.statut !== "RECUE_RETOUR";
                  return (
                    <Fragment key={row.id}>
                      <tr
                        style={{
                          borderBottom: expanded ? "none" : "1px solid var(--line-2)",
                          background: expanded ? "var(--bg-sunken, #f9fafb)" : undefined,
                          transition: "background 0.1s",
                        }}
                      >
                        {/* Chevron expand */}
                        <td style={{ padding: 0, textAlign: "center" }}>
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ color: "var(--ink-3)", padding: 4 }}
                            onClick={() => setExpandedId(expanded ? null : row.id)}
                            aria-label={expanded ? "Réduire" : "Déplier"}
                          >
                            <Icon name={expanded ? "chev_d" : "chev_r"} size={14} />
                          </button>
                        </td>
                        {/* N° / TYPE */}
                        <td style={{ padding: "10px 14px", height: 56 }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12.5 }}>
                            {row.numero}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <TypeEnvoiBadge typeEnvoi={row.typeEnvoi} />
                          </div>
                        </td>
                        {/* DEMANDEUR */}
                        <td style={{ padding: "10px 14px" }}>
                          {row.demandeur ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Avatar prenom={row.demandeur.prenom} nom={row.demandeur.nom} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                                  {(row.demandeur.nom ?? "").toUpperCase()} {row.demandeur.prenom}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                                  CND · DEA
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--ink-4)" }}>—</span>
                          )}
                        </td>
                        {/* TRAJET */}
                        <td style={{ padding: "10px 14px", fontSize: 12.5 }}>
                          <span style={{ fontFamily: "var(--font-mono)" }}>{row.siteOrigine ?? "—"}</span>
                          <Icon name="chev_r" size={11} />
                          <span style={{ fontFamily: "var(--font-mono)" }}>{row.siteDestinataire ?? row.destinataire ?? "—"}</span>
                        </td>
                        {/* MATÉRIELS */}
                        <td style={{ padding: "10px 14px" }}>
                          <span className="tag" style={{ fontSize: 10 }}>
                            {lignesCount} {typeDemandeLabel[row.type]?.slice(0, 3).toLowerCase() ?? "mat"}.
                          </span>
                        </td>
                        {/* STATUT */}
                        <td style={{ padding: "10px 14px" }}>
                          <span className={pill.cls}>
                            <span className="dot" />
                            {pill.label}
                          </span>
                        </td>
                        {/* DATES CLÉS */}
                        <td style={{ padding: "10px 14px", fontSize: 12, lineHeight: 1.4 }}>
                          <div>Envoi : <strong>{formatDate(row.dateEnvoi ?? row.dateSouhaitee)}</strong></div>
                          {row.dateRetourEstimee && (
                            <div style={{ color: lateRetour ? "var(--rose)" : "var(--ink-3)" }}>
                              Retour : <strong>{formatDate(row.dateRetourEstimee)}</strong>
                              {lateRetour && " · retard"}
                            </div>
                          )}
                        </td>
                        {/* PROGRESSION */}
                        <td style={{ padding: "10px 14px" }}>
                          <ProgressBar statut={row.statut} />
                        </td>
                        {/* Action menu */}
                        <td style={{ padding: 0, textAlign: "center" }}>
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ color: "var(--ink-3)", padding: 4 }}
                            onClick={() => navigate(`/demandes-envoi/${row.id}`)}
                            aria-label="Détail"
                            title="Détail"
                          >
                            <Icon name="dots" size={14} />
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr style={{ borderBottom: "1px solid var(--line-2)" }}>
                          <td />
                          <ExpandedRow demande={row} onClose={() => setExpandedId(null)} />
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
