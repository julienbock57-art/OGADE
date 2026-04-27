import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import { useReferentiel, useSites, useEntreprises } from "@/hooks/use-referentiels";
import Pagination from "@/components/Pagination";
import MaterielDrawer from "@/components/MaterielDrawer";

type Stats = { total: number; echus: number; prochains: number; enPret: number; hs: number; incomplets: number };

// ─── LOCAL ICON ────────────────────────────────────────────────────────────────
function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const paths: Record<string, string> = {
    search: "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
    filter: "M3 5h14M6 10h8M9 15h2",
    plus:   "M10 4v12M4 10h12",
    pin:    "M10 18s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z M10 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    edit:   "M12 4l4 4-8 8H4v-4l8-8z",
    x:      "M5 5l10 10M15 5L5 15",
  };
  const d = paths[name] ?? "";
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
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i === 0 ? p : "M" + p} />
      ))}
    </svg>
  );
}

// ─── ETAT CONFIG ───────────────────────────────────────────────────────────────
const etatPillClass: Record<string, string> = {
  CORRECT:      "c-emerald",
  LEGER_DEFAUT: "c-amber",
  HS:           "c-rose",
  PERDU:        "c-neutral",
};
const etatLabel: Record<string, string> = {
  CORRECT:      "Correct",
  LEGER_DEFAUT: "Léger défaut",
  HS:           "HS",
  PERDU:        "Perdu",
};

const completudePillClass: Record<string, string> = {
  COMPLET:   "c-emerald",
  INCOMPLET: "c-amber",
};
const completudeLabel: Record<string, string> = {
  COMPLET:   "Complet",
  INCOMPLET: "Incomplet",
};

// ─── PILL ──────────────────────────────────────────────────────────────────────
function Pill({ label, variant }: { label: string; variant: string }) {
  return (
    <span className={`pill ${variant}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

// ─── VALIDITY BAR ──────────────────────────────────────────────────────────────
function ValidityBar({ m }: { m: Materiel }) {
  if (!m.soumisVerification) {
    return <span style={{ fontSize: 11, color: "var(--ink-4)" }}>Non soumis</span>;
  }
  if (!m.dateProchainEtalonnage) {
    return <span style={{ fontSize: 11, color: "var(--ink-4)" }}>Non renseigné</span>;
  }

  const echeance = new Date(m.dateProchainEtalonnage);
  const now = new Date();
  const jours = Math.round((echeance.getTime() - now.getTime()) / 86400000);
  const totalDays = (m.validiteEtalonnage ?? 12) * 30;
  const pct = Math.max(0, Math.min(100, 100 - (jours / totalDays) * 100));

  let restCls = "validity-rest ok";
  let fill = "var(--emerald)";
  let label = `dans ${jours} j`;
  if (jours < 0) {
    restCls = "validity-rest late";
    fill = "var(--rose)";
    label = `${-jours} j retard`;
  } else if (jours <= 30) {
    restCls = "validity-rest warn";
    fill = "oklch(0.72 0.17 75)";
  }

  const fmt = echeance.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="validity">
      <div className="validity-top">
        <span className="validity-date">{fmt}</span>
        <span className={restCls}>{label}</span>
      </div>
      <div className="validity-bar">
        <div style={{ width: `${pct}%`, background: fill }} />
      </div>
    </div>
  );
}

// ─── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }: { label: string; value: number; sub: string; accent: string }) {
  return (
    <div className="kpi" style={{ "--kpi-accent": accent } as React.CSSProperties}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

// ─── FILTER CHIP ───────────────────────────────────────────────────────────────
function FilterChip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <span className="chip">
      <span style={{ opacity: 0.7, fontSize: 11 }}>{label}:</span>
      {" "}{value}
      <button
        onClick={onClear}
        style={{ display: "inline-flex", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", opacity: 0.7, marginLeft: 2 }}
      >
        <Icon name="x" size={11} stroke={2} />
      </button>
    </span>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function MaterielsListPage() {
  const [search, setSearch] = useState("");
  const [filterEtat, setFilterEtat] = useState("");
  const [filterTypeEnd, setFilterTypeEnd] = useState("");
  const [filterTypeMat, setFilterTypeMat] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterGroupe, setFilterGroupe] = useState("");
  const [filterCompletude, setFilterCompletude] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { page, setPage, queryParams } = usePagination();

  const { data: etats } = useReferentiel("ETAT_MATERIEL");
  const { data: typesEnd } = useReferentiel("TYPE_END");
  const { data: typesMat } = useReferentiel("TYPE_MATERIEL");
  const { data: groupes } = useReferentiel("GROUPE");
  const { data: completudes } = useReferentiel("COMPLETUDE");
  const { data: sites } = useSites();

  const siteOptions = useMemo(
    () => (sites ?? []).map((s) => ({ code: s.code, label: s.label })),
    [sites]
  );

  const { data: stats } = useQuery<Stats>({
    queryKey: ["materiels-stats"],
    queryFn: () => api.get("/materiels/stats"),
  });

  const { data, isLoading } = useQuery<PaginatedResult<Materiel>>({
    queryKey: ["materiels", { ...queryParams, search, etat: filterEtat, typeEND: filterTypeEnd, typeMateriel: filterTypeMat, site: filterSite, groupe: filterGroupe, completude: filterCompletude }],
    queryFn: () =>
      api.get("/materiels", {
        ...queryParams,
        search: search || undefined,
        etat: filterEtat || undefined,
        typeEND: filterTypeEnd || undefined,
        typeMateriel: filterTypeMat || undefined,
        site: filterSite || undefined,
        groupe: filterGroupe || undefined,
        completude: filterCompletude || undefined,
      }),
  });

  const activeFilterCount = [filterEtat, filterTypeEnd, filterTypeMat, filterSite, filterGroupe, filterCompletude].filter(Boolean).length;

  const clearFilters = () => {
    setFilterEtat(""); setFilterTypeEnd(""); setFilterTypeMat("");
    setFilterSite(""); setFilterGroupe(""); setFilterCompletude("");
    setSearch(""); setPage(1);
  };

  const rows = data?.data ?? [];
  const selectedMat = selectedId ? rows.find((r) => r.id === selectedId) : null;

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ padding: "22px 24px 18px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--ink)", lineHeight: 1.2 }}>
            Gestion du matériel END
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4, marginBottom: 0 }}>
            Inventaire, étalonnage et traçabilité
          </p>
        </div>
        <div>
          <Link
            to="/materiels/nouveau"
            className="obtn accent"
            style={{ textDecoration: "none" }}
          >
            <Icon name="plus" size={14} />
            Ajouter matériel
          </Link>
        </div>
      </div>

      {/* ── KPI cards ── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, padding: "0 24px 18px" }}>
          <KpiCard label="Matériels actifs"  value={stats.total}                      sub="inventaire complet"                               accent="var(--accent)" />
          <KpiCard label="Étalonnages échus" value={stats.echus}                      sub="à régulariser"                                   accent="var(--rose)" />
          <KpiCard label="Échéance < 30 j"   value={stats.prochains}                  sub="à planifier"                                     accent="var(--amber)" />
          <KpiCard label="En prêt / mission" value={stats.enPret}                     sub="hors magasin"                                    accent="var(--sky)" />
          <KpiCard label="HS · Incomplets"   value={stats.hs + stats.incomplets}      sub={`${stats.hs} HS · ${stats.incomplets} incomplets`} accent="var(--violet)" />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-panel)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search */}
        <div className="search-bar">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Recherche — ID, type, modèle, fournisseur, FIEC…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Filter button */}
        <button
          className={`obtn${showFilters || activeFilterCount > 0 ? " accent" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter" size={14} />
          Filtres
          {activeFilterCount > 0 && (
            <span style={{ background: "white", color: "var(--accent)", borderRadius: 999, padding: "0 6px", fontSize: 11, fontWeight: 600 }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Scope segment */}
        <div className="seg">
          <button className="on">Tous</button>
        </div>

        {/* Spacer */}
        <span style={{ flex: 1 }} />

        {/* Result count */}
        <span style={{ fontSize: 12, color: "var(--ink-4)", whiteSpace: "nowrap" }}>
          {data ? `${data.total} résultat${data.total > 1 ? "s" : ""}` : ""}
        </span>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--line)", padding: "12px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            <select
              value={filterEtat}
              onChange={(e) => { setFilterEtat(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">État — Tous</option>
              {(etats ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select
              value={filterTypeEnd}
              onChange={(e) => { setFilterTypeEnd(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">Type END — Tous</option>
              {(typesEnd ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select
              value={filterTypeMat}
              onChange={(e) => { setFilterTypeMat(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">Type matériel — Tous</option>
              {(typesMat ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select
              value={filterGroupe}
              onChange={(e) => { setFilterGroupe(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">Groupe — Tous</option>
              {(groupes ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select
              value={filterSite}
              onChange={(e) => { setFilterSite(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">Site — Tous</option>
              {siteOptions.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select
              value={filterCompletude}
              onChange={(e) => { setFilterCompletude(e.target.value); setPage(1); }}
              className="oselect"
            >
              <option value="">Complétude — Tous</option>
              {(completudes ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="obtn ghost"
              style={{ marginTop: 10, fontSize: 12 }}
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "10px 24px 4px" }}>
          {filterEtat      && <FilterChip label="État"       value={(etats ?? []).find(e => e.code === filterEtat)?.label ?? filterEtat}                 onClear={() => setFilterEtat("")} />}
          {filterTypeEnd   && <FilterChip label="Type END"   value={(typesEnd ?? []).find(e => e.code === filterTypeEnd)?.label ?? filterTypeEnd}         onClear={() => setFilterTypeEnd("")} />}
          {filterTypeMat   && <FilterChip label="Type"       value={(typesMat ?? []).find(e => e.code === filterTypeMat)?.label ?? filterTypeMat}         onClear={() => setFilterTypeMat("")} />}
          {filterGroupe    && <FilterChip label="Groupe"     value={(groupes ?? []).find(e => e.code === filterGroupe)?.label ?? filterGroupe}             onClear={() => setFilterGroupe("")} />}
          {filterSite      && <FilterChip label="Site"       value={siteOptions.find(e => e.code === filterSite)?.label ?? filterSite}                   onClear={() => setFilterSite("")} />}
          {filterCompletude && <FilterChip label="Complétude" value={(completudes ?? []).find(e => e.code === filterCompletude)?.label ?? filterCompletude} onClear={() => setFilterCompletude("")} />}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background: "var(--bg-panel)", margin: "0 0" }}>
        {isLoading ? (
          <div style={{ padding: "32px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ height: 44, background: "var(--bg-sunken)", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "100%", borderCollapse: "collapse", fontSize: "var(--ui-fs)" }}>
              <thead>
                <tr>
                  {["Réf · Type", "Modèle", "Localisation", "Responsable", "Validité", "État · Complétude", "Prêt", ""].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--ink-3)",
                        borderBottom: "1px solid var(--line)",
                        whiteSpace: "nowrap",
                        width: i === 7 ? 56 : undefined,
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
                    <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "var(--ink-4)", fontSize: 13 }}>
                      Aucun matériel trouvé
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearFilters}
                          style={{ display: "block", margin: "8px auto 0", fontSize: 12, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Effacer les filtres
                        </button>
                      )}
                    </td>
                  </tr>
                ) : rows.map((m) => {
                  const pillVariant    = etatPillClass[m.etat] ?? "c-neutral";
                  const pillLbl        = etatLabel[m.etat] ?? m.etat;
                  const compVariant    = m.completude ? completudePillClass[m.completude] : null;
                  const compLbl        = m.completude ? completudeLabel[m.completude] : null;
                  const typeEndRef     = (typesEnd ?? []).find((t) => t.code === m.typeEND);
                  const typeMatRef     = (typesMat ?? []).find((t) => t.code === m.typeMateriel);
                  const siteRef        = (sites ?? []).find((s) => s.code === m.site);
                  const resp           = m.responsable as { prenom: string; nom: string } | null | undefined;
                  const isSelected     = selectedId === m.id;

                  // Deterministic avatar color from initials
                  const initials = resp ? `${resp.prenom?.[0] ?? ""}${resp.nom?.[0] ?? ""}` : "";
                  const avatarColors = ["oklch(0.62 0.14 235)", "oklch(0.55 0.20 275)", "oklch(0.60 0.16 155)", "oklch(0.62 0.21 20)", "oklch(0.72 0.17 75)", "oklch(0.70 0.15 30)"];
                  const avatarColor  = avatarColors[(initials.charCodeAt(0) ?? 0) % avatarColors.length];

                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      style={{
                        borderBottom: "1px solid var(--line-2)",
                        background: isSelected ? "var(--accent-soft)" : undefined,
                        height: "var(--row-h)",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--bg-sunken)"; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      {/* Réf · Type */}
                      <td style={{ padding: "0 12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span className="mono" style={{ fontWeight: 500, color: "var(--ink)", fontSize: 12 }}>{m.reference}</span>
                          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                            {typeMatRef?.label ?? m.typeMateriel ?? "—"}
                            {m.fournisseur ? ` · ${m.fournisseur}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Modèle */}
                      <td style={{ padding: "0 12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontWeight: 500, color: "var(--ink)" }}>{m.modele ?? "—"}</span>
                          {m.typeEND && (
                            <span className="tag mono">{typeEndRef?.label ?? m.typeEND}</span>
                          )}
                        </div>
                      </td>

                      {/* Localisation */}
                      <td style={{ padding: "0 12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 500, color: "var(--ink-2)" }}>
                            <Icon name="pin" size={12} />
                            {siteRef?.label ?? m.site ?? "—"}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                            {m.groupe ?? ""}
                            {m.enPret ? (m.groupe ? " · En prêt" : "En prêt") : ""}
                          </span>
                        </div>
                      </td>

                      {/* Responsable */}
                      <td style={{ padding: "0 12px" }}>
                        {resp ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 22, height: 22, borderRadius: "50%", background: avatarColor, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                              {initials}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{resp.prenom} {resp.nom}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>—</span>
                        )}
                      </td>

                      {/* Validité */}
                      <td style={{ padding: "0 12px" }}>
                        <ValidityBar m={m} />
                      </td>

                      {/* État · Complétude */}
                      <td style={{ padding: "0 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Pill label={pillLbl} variant={pillVariant} />
                          {compVariant && compLbl && <Pill label={compLbl} variant={compVariant} />}
                        </div>
                      </td>

                      {/* Prêt */}
                      <td style={{ padding: "0 12px" }}>
                        {m.enPret ? (
                          <Pill label="En prêt" variant="c-sky" />
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0 12px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/materiels/${m.id}/edit`}
                          className="icon-btn"
                          title="Modifier"
                          style={{ textDecoration: "none" }}
                        >
                          <Icon name="edit" size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {data && data.totalPages > 1 && (
        <div style={{ padding: "16px 24px" }}>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {selectedMat && (
        <MaterielDrawer materiel={selectedMat} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
