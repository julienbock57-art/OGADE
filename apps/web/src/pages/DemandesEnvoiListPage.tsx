/**
 * DemandesEnvoiListPage — Liste des demandes d'envoi.
 *
 * Reprend le design "OGADE" déjà appliqué à `MaterielsListPage` :
 *  - Page header (titre + sub + CTA)
 *  - Bandeau KPI cliquables (filtres rapides)
 *  - Toolbar sticky (recherche + bouton filtres + segments)
 *  - Filter panel collapsable
 *  - Chips de filtres actifs (effaçables)
 *  - Table dense avec statut pill, trajet, dates, actions
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DemandeEnvoi, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePagination } from "@/hooks/use-pagination";
import { useSites } from "@/hooks/use-referentiels";
import Pagination from "@/components/Pagination";

function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    plus:    "M12 4v16m8-8H4",
    search:  "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
    filter:  "M3 5h14M5 10h10M8 15h4",
    x:       "M5 5l10 10M15 5L5 15",
    eye:     "M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    arrow:   "M5 10h10M11 6l4 4-4 4",
    chev:    "M5 8l5 5 5-5",
    clock:   "M10 5v5l3 2 M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z",
  };
  const d = paths[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const statutPill: Record<string, { cls: string; label: string }> = {
  BROUILLON:               { cls: "pill c-neutral", label: "Brouillon" },
  SOUMISE:                 { cls: "pill c-sky",     label: "Soumise" },
  VALIDEE_PARTIELLEMENT:   { cls: "pill c-amber",   label: "Validée partiel." },
  VALIDEE:                 { cls: "pill c-emerald", label: "Validée" },
  REFUSEE:                 { cls: "pill c-rose",    label: "Refusée" },
  PRETE_A_EXPEDIER:        { cls: "pill c-sky",     label: "Prête à expédier" },
  EN_TRANSIT:              { cls: "pill c-amber",   label: "En transit" },
  RECUE:                   { cls: "pill c-emerald", label: "Reçue" },
  LIVREE_TITULAIRE:        { cls: "pill c-emerald", label: "Livrée" },
  EN_COURS:                { cls: "pill c-sky",     label: "En cours" },
  EN_RETOUR:               { cls: "pill c-amber",   label: "En retour" },
  RECUE_RETOUR:            { cls: "pill c-emerald", label: "Reçue retour" },
  CLOTUREE:                { cls: "pill c-violet",  label: "Clôturée" },
  ANNULEE:                 { cls: "pill c-rose",    label: "Annulée" },
};

const typeLabel: Record<string, string> = {
  MATERIEL: "Matériel",
  MAQUETTE: "Maquette",
  MUTUALISEE: "Mutualisée",
};

const typeEnvoiLabel: Record<string, string> = {
  INTERNE: "Interne",
  EXTERNE_TITULAIRE: "Titulaire",
  ETALONNAGE: "Étalonnage",
  PRET_INTERNE: "Prêt interne",
  PRET_EXTERNE: "Prêt externe",
};

const STATUT_OPTIONS: { code: string; label: string }[] = [
  { code: "BROUILLON",             label: "Brouillon" },
  { code: "SOUMISE",               label: "Soumise" },
  { code: "VALIDEE_PARTIELLEMENT", label: "Validée partiellement" },
  { code: "VALIDEE",               label: "Validée" },
  { code: "PRETE_A_EXPEDIER",      label: "Prête à expédier" },
  { code: "EN_TRANSIT",            label: "En transit" },
  { code: "RECUE",                 label: "Reçue" },
  { code: "LIVREE_TITULAIRE",      label: "Livrée" },
  { code: "EN_COURS",              label: "En cours" },
  { code: "EN_RETOUR",             label: "En retour" },
  { code: "RECUE_RETOUR",          label: "Reçue retour" },
  { code: "CLOTUREE",              label: "Clôturée" },
  { code: "REFUSEE",               label: "Refusée" },
  { code: "ANNULEE",               label: "Annulée" },
];

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

interface DemandeRow extends DemandeEnvoi {
  demandeur?: { id: number; prenom: string; nom: string; email: string } | null;
  _count?: { lignes: number };
  lignes?: { id: number; statut: string }[];
}

interface DemandeStats {
  total: number;
  brouillons: number;
  aValider: number;
  aTraiter: number;
  enTransit: number;
  cloturees: number;
  refusees: number;
}

type KpiKey =
  | null
  | "brouillons"
  | "aValider"
  | "aTraiter"
  | "enTransit"
  | "cloturees";

const KPI_TO_STATUTS: Record<Exclude<KpiKey, null>, string[]> = {
  brouillons: ["BROUILLON"],
  aValider: ["SOUMISE", "VALIDEE_PARTIELLEMENT"],
  aTraiter: ["VALIDEE", "PRETE_A_EXPEDIER"],
  enTransit: ["EN_TRANSIT", "EN_COURS", "LIVREE_TITULAIRE", "EN_RETOUR"],
  cloturees: ["CLOTUREE"],
};

const KPI_LABEL: Record<Exclude<KpiKey, null>, string> = {
  brouillons: "Brouillons",
  aValider: "À valider (réf.)",
  aTraiter: "À traiter (magasin)",
  enTransit: "En transit / cours",
  cloturees: "Clôturées",
};

function KpiCard({
  label,
  value,
  sub,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`kpi${active ? " kpi-active" : ""}`}
      style={{
        "--kpi-accent": accent,
        cursor: onClick ? "pointer" : undefined,
        borderColor: active ? accent : undefined,
        boxShadow: active ? `0 0 0 1px ${accent}, 0 2px 8px ${accent}22` : undefined,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

export default function DemandesEnvoiListPage() {
  const { user } = useAuth();
  const { page, setPage, queryParams } = usePagination();

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTypeEnvoi, setFilterTypeEnvoi] = useState("");
  const [filterUrgence, setFilterUrgence] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeKpi, setActiveKpi] = useState<KpiKey>(null);
  const [scope, setScope] = useState<"tous" | "mes">("tous");

  const { data: sites } = useSites();
  const siteOptions = useMemo(
    () => (sites ?? []).map((s) => ({ code: s.code, label: s.label })),
    [sites],
  );

  const { data: stats } = useQuery<DemandeStats>({
    queryKey: ["demandes-envoi", "stats"],
    queryFn: () => api.get("/demandes-envoi/stats"),
  });

  // Quand on clique un KPI, on filtre côté serveur via la liste de
  // statuts associés. Pour conserver la pagination serveur, on prend
  // le 1er statut du groupe (BROUILLON, SOUMISE, etc.). Les autres
  // statuts sont visibles via le panneau de filtres explicite.
  const kpiStatutFilter = activeKpi ? KPI_TO_STATUTS[activeKpi] : null;
  // Pour les KPIs multi-statuts on n'a pas de filtre OR côté API → on
  // récupère donc tout et on filtre côté client. Compromis acceptable
  // tant que la page reste à pageSize=20 par requête.
  const effectiveStatut = filterStatut || (kpiStatutFilter?.length === 1 ? kpiStatutFilter[0] : "");

  const { data, isLoading, isError } = useQuery<PaginatedResult<DemandeRow>>({
    queryKey: [
      "demandes-envoi",
      "list",
      {
        ...queryParams,
        search,
        filterStatut,
        filterType,
        filterTypeEnvoi,
        filterUrgence,
        filterSite,
        activeKpi,
        scope,
      },
    ],
    queryFn: () =>
      api.get("/demandes-envoi", {
        ...queryParams,
        // Si plusieurs statuts (KPI multi), on ne filtre pas côté serveur ;
        // sinon on envoie le statut sélectionné.
        statut: effectiveStatut || undefined,
        type: filterType || undefined,
        typeEnvoi: filterTypeEnvoi || undefined,
        urgence: filterUrgence || undefined,
        site: filterSite || undefined,
        search: search.trim() || undefined,
      }),
  });

  const rowsRaw = data?.data ?? [];
  // Filtrage client pour les KPI multi-statuts ou le scope "mes demandes"
  const rows = rowsRaw.filter((r) => {
    if (kpiStatutFilter && kpiStatutFilter.length > 1) {
      if (!kpiStatutFilter.includes(r.statut)) return false;
    }
    if (scope === "mes" && user) {
      if (r.demandeur?.email !== user.email) return false;
    }
    return true;
  });

  const activeFilterCount = [
    filterStatut,
    filterType,
    filterTypeEnvoi,
    filterUrgence,
    filterSite,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterStatut("");
    setFilterType("");
    setFilterTypeEnvoi("");
    setFilterUrgence("");
    setFilterSite("");
    setSearch("");
    setActiveKpi(null);
    setPage(1);
  };

  const handleKpiClick = (key: KpiKey) => {
    setActiveKpi((prev) => (prev === key ? null : key));
    setFilterStatut("");
    setPage(1);
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
            Envois & retours
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2, marginBottom: 0 }}>
            Demandes d'envoi, validation référent, expédition magasin et clôture
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to="/demandes-envoi/nouveau"
            className="obtn accent"
            style={{ textDecoration: "none" }}
          >
            <Icon name="plus" size={14} />
            Nouvelle demande
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="kpi-grid">
          <KpiCard
            label="Total"
            value={stats.total}
            sub="toutes demandes confondues"
            accent="var(--accent)"
            active={activeKpi === null && !filterStatut}
            onClick={() => handleKpiClick(null)}
          />
          <KpiCard
            label="Brouillons"
            value={stats.brouillons}
            sub="à compléter / soumettre"
            accent="var(--ink-3)"
            active={activeKpi === "brouillons"}
            onClick={() => handleKpiClick("brouillons")}
          />
          <KpiCard
            label="À valider"
            value={stats.aValider}
            sub="en attente référent"
            accent="var(--amber)"
            active={activeKpi === "aValider"}
            onClick={() => handleKpiClick("aValider")}
          />
          <KpiCard
            label="À traiter"
            value={stats.aTraiter}
            sub="à expédier (magasin)"
            accent="var(--sky)"
            active={activeKpi === "aTraiter"}
            onClick={() => handleKpiClick("aTraiter")}
          />
          <KpiCard
            label="En transit / cours"
            value={stats.enTransit}
            sub="livraison / retour"
            accent="var(--violet)"
            active={activeKpi === "enTransit"}
            onClick={() => handleKpiClick("enTransit")}
          />
          <KpiCard
            label="Clôturées"
            value={stats.cloturees}
            sub={`${stats.refusees} refusée${stats.refusees > 1 ? "s" : ""}`}
            accent="var(--emerald)"
            active={activeKpi === "cloturees"}
            onClick={() => handleKpiClick("cloturees")}
          />
        </div>
      )}

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
        <div className="search-bar">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Recherche — n° DE, destinataire, motif, BL…"
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
          <Icon name="filter" size={14} />
          Filtres
          {activeFilterCount > 0 && (
            <span
              style={{
                background: "white",
                color: "var(--accent)",
                borderRadius: 999,
                padding: "0 6px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="seg">
          <button
            className={scope === "tous" ? "on" : ""}
            onClick={() => {
              setScope("tous");
              setPage(1);
            }}
          >
            Toutes
          </button>
          <button
            className={scope === "mes" ? "on" : ""}
            onClick={() => {
              setScope("mes");
              setPage(1);
            }}
          >
            Mes demandes
          </button>
        </div>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--ink-4)", whiteSpace: "nowrap" }}>
          {data ? `${rows.length} affichée${rows.length > 1 ? "s" : ""} / ${data.total} total` : ""}
        </span>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--line)", padding: "12px 24px" }}>
          <div className="filter-grid">
            <select
              value={filterStatut}
              onChange={(e) => {
                setFilterStatut(e.target.value);
                setActiveKpi(null);
                setPage(1);
              }}
              className="oselect"
            >
              <option value="">Statut — Tous</option>
              {STATUT_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="oselect"
            >
              <option value="">Type — Tous</option>
              {Object.entries(typeLabel).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <select
              value={filterTypeEnvoi}
              onChange={(e) => {
                setFilterTypeEnvoi(e.target.value);
                setPage(1);
              }}
              className="oselect"
            >
              <option value="">Type d'envoi — Tous</option>
              {Object.entries(typeEnvoiLabel).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <select
              value={filterUrgence}
              onChange={(e) => {
                setFilterUrgence(e.target.value);
                setPage(1);
              }}
              className="oselect"
            >
              <option value="">Urgence — Toutes</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Tres urgent">Très urgent</option>
            </select>
            <select
              value={filterSite}
              onChange={(e) => {
                setFilterSite(e.target.value);
                setPage(1);
              }}
              className="oselect"
            >
              <option value="">Site — Tous</option>
              {siteOptions.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="obtn ghost" style={{ marginTop: 10, fontSize: 12 }}>
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {(activeFilterCount > 0 || activeKpi) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            padding: "10px 24px 4px",
            background: "var(--bg-panel)",
            borderBottom: "1px solid var(--line-2)",
          }}
        >
          <span style={{ color: "var(--ink-3)", fontSize: 11 }}>
            {rows.length} demande{rows.length > 1 ? "s" : ""} ·
          </span>
          {activeKpi && (
            <span className="chip" style={{ background: "var(--accent)", color: "white" }}>
              <span style={{ fontSize: 11 }}>{KPI_LABEL[activeKpi]}</span>
              <button
                onClick={() => setActiveKpi(null)}
                style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          )}
          {filterStatut && (
            <span className="chip">
              <span style={{ opacity: 0.7, fontSize: 11 }}>Statut:</span>{" "}
              {STATUT_OPTIONS.find((o) => o.code === filterStatut)?.label ?? filterStatut}
              <button
                onClick={() => setFilterStatut("")}
                style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          )}
          {filterType && (
            <span className="chip">
              <span style={{ opacity: 0.7, fontSize: 11 }}>Type:</span> {typeLabel[filterType] ?? filterType}
              <button
                onClick={() => setFilterType("")}
                style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          )}
          {filterTypeEnvoi && (
            <span className="chip">
              <span style={{ opacity: 0.7, fontSize: 11 }}>Envoi:</span> {typeEnvoiLabel[filterTypeEnvoi] ?? filterTypeEnvoi}
              <button
                onClick={() => setFilterTypeEnvoi("")}
                style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          )}
          {filterUrgence && (
            <span className="chip">
              <span style={{ opacity: 0.7, fontSize: 11 }}>Urgence:</span> {filterUrgence}
              <button
                onClick={() => setFilterUrgence("")}
                style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          )}
          {filterSite && (
            <span className="chip">
              <span style={{ opacity: 0.7, fontSize: 11 }}>Site:</span>{" "}
              {siteOptions.find((o) => o.code === filterSite)?.label ?? filterSite}
              <button
                onClick={() => setFilterSite("")}
                style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          )}
          <button className="obtn sm ghost" onClick={clearFilters} style={{ marginLeft: 4 }}>
            Tout effacer
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--line)", overflow: "auto" }}>
        {isLoading ? (
          <div style={{ padding: "32px 24px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: 44,
                  background: "var(--bg-sunken)",
                  borderRadius: 6,
                  marginBottom: 10,
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : isError ? (
          <p style={{ padding: "32px 24px", color: "var(--rose)", fontSize: 13 }}>
            Erreur lors du chargement des demandes.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--ui-fs)" }}>
            <thead>
              <tr>
                {[
                  "N°",
                  "Type",
                  "Envoi",
                  "Trajet",
                  "Demandeur",
                  "Lignes",
                  "Statut",
                  "Souhaité",
                  "Envoi",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--ink-3)",
                      background: "var(--bg-panel)",
                      borderBottom: "1px solid var(--line)",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: "48px 14px",
                      textAlign: "center",
                      color: "var(--ink-3)",
                      fontSize: 13,
                    }}
                  >
                    Aucune demande ne correspond aux critères.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const pill = statutPill[row.statut] ?? { cls: "pill c-neutral", label: row.statut };
                  const lignesCount = row._count?.lignes ?? row.lignes?.length ?? 0;
                  const trajet =
                    (row.siteOrigine ?? "—") +
                    " → " +
                    (row.siteDestinataire ?? row.destinataire ?? "—");
                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: "1px solid var(--line-2)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sunken)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "0 14px", height: 50, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {row.numero}
                      </td>
                      <td style={{ padding: "0 14px", height: 50 }}>
                        <span className="tag" style={{ fontSize: 10 }}>
                          {typeLabel[row.type] ?? row.type}
                        </span>
                      </td>
                      <td style={{ padding: "0 14px", height: 50 }}>
                        {row.typeEnvoi ? (
                          <span className="tag c-accent" style={{ fontSize: 10 }}>
                            {typeEnvoiLabel[row.typeEnvoi] ?? row.typeEnvoi}
                          </span>
                        ) : (
                          <span style={{ color: "var(--ink-4)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)", fontSize: 12.5 }}>
                        {trajet}
                      </td>
                      <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>
                        {row.demandeur ? (
                          <span>
                            {row.demandeur.prenom} {row.demandeur.nom}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)", textAlign: "center" }}>
                        {lignesCount}
                      </td>
                      <td style={{ padding: "0 14px", height: 50 }}>
                        <span className={pill.cls}>
                          <span className="dot" />
                          {pill.label}
                        </span>
                      </td>
                      <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>
                        {formatDate(row.dateSouhaitee)}
                      </td>
                      <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>
                        {formatDate(row.dateEnvoi)}
                      </td>
                      <td style={{ padding: "0 14px", height: 50 }}>
                        <Link
                          to={`/demandes-envoi/${row.id}`}
                          className="obtn sm"
                          style={{ textDecoration: "none" }}
                        >
                          <Icon name="eye" size={12} />
                          Détail
                        </Link>
                      </td>
                    </tr>
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
