import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Maquette, MaquetteStats, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { useReferentiel, useSites } from "@/hooks/use-referentiels";
import { usePagination } from "@/hooks/use-pagination";
import Pagination from "@/components/Pagination";
import MaquetteDrawer, { FormeIcon } from "@/components/MaquetteDrawer";
import {
  MQ_ETAT_PILL,
  defautColor,
  mqIconPaths,
  mqTypeClass,
} from "@/lib/maquette-helpers";

function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const segments = mqIconPaths(name);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {segments.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

function KpiCard({ label, value, sub, accent, active, onClick }: {
  label: string; value: number; sub: string; accent: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div
      className={`kpi${active ? " kpi-active" : ""}`}
      style={{
        ["--kpi-accent" as string]: accent,
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

function Avatar({ nom, prenom, size = 22 }: { nom?: string; prenom?: string; size?: number }) {
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  const palette = ["oklch(0.70 0.15 30)", "oklch(0.70 0.15 150)", "oklch(0.70 0.15 210)", "oklch(0.70 0.15 275)", "oklch(0.70 0.15 340)", "oklch(0.70 0.15 60)"];
  const c = palette[(initials.charCodeAt(0) || 0) % palette.length];
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: c, color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.42), fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </span>
  );
}

type ActiveKpi = null | "stock" | "empruntees" | "asn" | "requalifier" | "hs";

export default function MaquettesListPage() {
  const [search, setSearch] = useState("");
  const [filterEtat, setFilterEtat] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [filterForme, setFilterForme] = useState("");
  const [filterMatiere, setFilterMatiere] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeKpi, setActiveKpi] = useState<ActiveKpi>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const { page, setPage, queryParams } = usePagination();

  const { data: typesMq } = useReferentiel("TYPE_MAQUETTE");
  const { data: categories } = useReferentiel("CATEGORIE");
  const { data: formes } = useReferentiel("FORME");
  const { data: matieres } = useReferentiel("MATIERE");
  const { data: sites } = useSites();

  const kpiFilters = useMemo(() => {
    if (activeKpi === "stock") return { etat: "STOCK" };
    if (activeKpi === "empruntees") return { etat: "EMPRUNTEE" };
    if (activeKpi === "asn") return { referenceASN: "true" };
    if (activeKpi === "requalifier") return { etat: "EN_REPARATION" };
    if (activeKpi === "hs") return { etat: "REBUT" };
    return {};
  }, [activeKpi]);

  const { data: stats } = useQuery<MaquetteStats>({
    queryKey: ["maquettes-stats"],
    queryFn: () => api.get("/maquettes/stats"),
  });

  const { data, isLoading } = useQuery<PaginatedResult<Maquette>>({
    queryKey: [
      "maquettes",
      {
        ...queryParams,
        search,
        etat: filterEtat,
        typeMaquette: filterType,
        categorie: filterCategorie,
        forme: filterForme,
        matiere: filterMatiere,
        site: filterSite,
        ...kpiFilters,
      },
    ],
    queryFn: () =>
      api.get("/maquettes", {
        ...queryParams,
        search: search || undefined,
        etat: filterEtat || undefined,
        typeMaquette: filterType || undefined,
        categorie: filterCategorie || undefined,
        forme: filterForme || undefined,
        matiere: filterMatiere || undefined,
        site: filterSite || undefined,
        ...kpiFilters,
      }),
  });

  const handleKpi = (k: ActiveKpi) => {
    setActiveKpi((prev) => (prev === k ? null : k));
    setFilterEtat("");
    setPage(1);
  };

  const activeFilterCount = [filterEtat, filterType, filterCategorie, filterForme, filterMatiere, filterSite].filter(Boolean).length;
  const clearFilters = () => {
    setFilterEtat(""); setFilterType(""); setFilterCategorie(""); setFilterForme(""); setFilterMatiere(""); setFilterSite("");
    setSearch(""); setActiveKpi(null); setPage(1);
  };

  const rows = data?.data ?? [];
  const selected = selectedId ? rows.find((r) => r.id === selectedId) : null;
  const toggleExpand = (id: number) =>
    setExpandedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Maquettes</h1>
          <p className="page-sub">Maquettes physiques utilisées en formation et qualification CND</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/maquettes/nouveau" className="obtn accent" style={{ textDecoration: "none" }}>
            <Icon name="plus" />
            Nouvelle maquette
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="kpi-grid">
          <KpiCard label="Total" value={stats.total} sub="inventaire complet" accent="var(--accent)" active={activeKpi === null && filterEtat === ""} onClick={() => handleKpi(null)} />
          <KpiCard label="En stock" value={stats.stock} sub={stats.total ? `${Math.round((stats.stock * 100) / stats.total)}% du parc` : ""} accent="var(--emerald)" active={activeKpi === "stock"} onClick={() => handleKpi("stock")} />
          <KpiCard label="Empruntées / transit" value={stats.empruntesOuTransit} sub="engagées sur sites" accent="var(--sky)" active={activeKpi === "empruntees"} onClick={() => handleKpi("empruntees")} />
          <KpiCard label="Référencées ASN" value={stats.asn} sub="maquettes certifiées" accent="oklch(0.55 0.20 280)" active={activeKpi === "asn"} onClick={() => handleKpi("asn")} />
          <KpiCard label="À requalifier" value={stats.requalifier} sub="en réparation / défauts" accent="var(--amber)" active={activeKpi === "requalifier"} onClick={() => handleKpi("requalifier")} />
          <KpiCard label="Hors service" value={stats.hs} sub="indisponibles" accent="var(--rose)" active={activeKpi === "hs"} onClick={() => handleKpi("hs")} />
        </div>
      )}

      {/* Toolbar */}
      <div className="rs-toolbar">
        <div className="search-bar">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Recherche — référence, libellé, matière, composant…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button
          className={`obtn${showFilters || activeFilterCount > 0 ? " accent" : ""}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <Icon name="filter" />
          Filtres
          {activeFilterCount > 0 && (
            <span style={{ background: "white", color: "var(--accent)", borderRadius: 999, padding: "0 6px", fontSize: 11, fontWeight: 600 }}>
              {activeFilterCount}
            </span>
          )}
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--ink-4)", whiteSpace: "nowrap" }}>
          {data ? `${data.total} maquette${data.total > 1 ? "s" : ""}` : ""}
        </span>
      </div>

      {showFilters && (
        <div style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--line)", padding: "12px 24px" }}>
          <div className="filter-grid">
            <select value={filterEtat} onChange={(e) => { setFilterEtat(e.target.value); setActiveKpi(null); setPage(1); }} className="oselect">
              <option value="">État — Tous</option>
              {Object.entries(MQ_ETAT_PILL).map(([code, p]) => (
                <option key={code} value={code}>{p.label}</option>
              ))}
            </select>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="oselect">
              <option value="">Type — Tous</option>
              {(typesMq ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select value={filterCategorie} onChange={(e) => { setFilterCategorie(e.target.value); setPage(1); }} className="oselect">
              <option value="">Catégorie — Toutes</option>
              {(categories ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select value={filterForme} onChange={(e) => { setFilterForme(e.target.value); setPage(1); }} className="oselect">
              <option value="">Forme — Toutes</option>
              {(formes ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select value={filterMatiere} onChange={(e) => { setFilterMatiere(e.target.value); setPage(1); }} className="oselect">
              <option value="">Matière — Toutes</option>
              {(matieres ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
            <select value={filterSite} onChange={(e) => { setFilterSite(e.target.value); setPage(1); }} className="oselect">
              <option value="">Site — Tous</option>
              {(sites ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="obtn ghost" style={{ marginTop: 10, fontSize: 12 }}>
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", flex: 1, overflow: "auto", borderTop: "1px solid var(--line)" }}>
        {isLoading ? (
          <div style={{ padding: "32px 24px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 50, background: "var(--bg-sunken)", borderRadius: 6, marginBottom: 8, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : (
          <table className="list">
            <thead>
              <tr>
                <th className="exp-col" />
                <th>Référence</th>
                <th>Type · Forme</th>
                <th>Matière · Composant</th>
                <th>Dimensions</th>
                <th>CND</th>
                <th>Localisation</th>
                <th>Référent</th>
                <th>Défauts</th>
                <th>Statut</th>
                <th className="actions-col" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: "60px 24px", textAlign: "center", color: "var(--ink-3)" }}>
                    Aucune maquette ne correspond aux filtres actifs.
                  </td>
                </tr>
              ) : (
                rows.map((m) => {
                  const expanded = expandedIds.has(m.id);
                  const etat = MQ_ETAT_PILL[m.etat] ?? { cls: "pill c-neutral", label: m.etat };
                  const typesCnd = (m.typeControle ?? "").split(/[,;\s]+/).filter(Boolean);
                  const dCount = m._count?.defauts ?? m.defauts?.length ?? 0;
                  const dTypes = m.defauts ? new Set(m.defauts.map((d) => d.typeDefaut)).size : 0;
                  return (
                    <>
                      <tr key={m.id} className={`row${expanded ? " expanded" : ""}`} onClick={() => setSelectedId(m.id)}>
                        <td className="exp-col" onClick={(e) => { e.stopPropagation(); toggleExpand(m.id); }}>
                          <button className="icon-btn" style={{ padding: 4, border: 0 }} type="button" aria-label="Détails">
                            <Icon name={expanded ? "chevD" : "chevR"} size={13} />
                          </button>
                        </td>
                        <td>
                          <div className="hstack" style={{ gap: 8 }}>
                            <span className="forme-box"><FormeIcon forme={m.forme} size={16} /></span>
                            <div className="vstack" style={{ gap: 1 }}>
                              <span className="mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{m.reference}</span>
                              <span className="muted xs">{m.libelle}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="vstack" style={{ gap: 2 }}>
                            <span className={`mq-type ${mqTypeClass(m.typeMaquette)}`}>
                              {m.typeMaquette ?? "—"}
                            </span>
                            <span className="xs" style={{ color: "var(--ink-2)" }}>{m.forme ?? ""}</span>
                          </div>
                        </td>
                        <td>
                          <div className="vstack" style={{ gap: 1 }}>
                            <span style={{ fontSize: 12.5 }}>{m.matiere ?? "—"}</span>
                            <span className="muted xs">{m.composant ?? ""}</span>
                          </div>
                        </td>
                        <td>
                          <div className="dim-cell">
                            {m.longueur != null && (
                              <span className="dim">
                                <b>L</b> {m.longueur}
                                {m.largeur != null ? ` × ${m.largeur}` : ""}
                                {m.hauteur != null ? ` × ${m.hauteur}` : ""} mm
                              </span>
                            )}
                            {m.dn != null && (
                              <span className="dim">
                                <b>DN</b> {m.dn}
                                {m.epaisseurParoi != null ? ` · ép. ${m.epaisseurParoi} mm` : ""}
                              </span>
                            )}
                            {m.poids != null && <span className="dim-meta">{m.poids} kg</span>}
                          </div>
                        </td>
                        <td>
                          {typesCnd.length > 0 ? (
                            <div className="cnd-chips">
                              {typesCnd.map((t) => <span key={t} className="cnd-chip">{t}</span>)}
                            </div>
                          ) : <span className="muted xs">—</span>}
                        </td>
                        <td>
                          <div className="vstack" style={{ gap: 1 }}>
                            <span style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Icon name="pin" size={11} />{m.site ?? "—"}
                            </span>
                            {m.localisation && <span className="muted xs">{m.localisation}</span>}
                          </div>
                        </td>
                        <td>
                          {m.proprietaire ? (
                            <div className="hstack" style={{ gap: 6 }}>
                              <Avatar nom={m.proprietaire.nom} prenom={m.proprietaire.prenom} size={22} />
                              <span className="xs">{m.proprietaire.prenom}</span>
                            </div>
                          ) : <span className="muted xs">—</span>}
                        </td>
                        <td>
                          <span className="tag mono" style={{ fontSize: 11 }}>
                            {dCount} <span className="muted">·</span> {dTypes} types
                          </span>
                        </td>
                        <td>
                          <div className="vstack" style={{ gap: 2, alignItems: "flex-start" }}>
                            <span className={etat.cls}><span className="dot" />{etat.label}</span>
                            {m.referenceASN && <span className="asn-flag">ASN</span>}
                          </div>
                        </td>
                        <td className="actions-col" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/maquettes/${m.id}`} className="icon-btn" title="QR / fiche" style={{ display: "inline-flex" }}>
                            <Icon name="qr" size={13} />
                          </Link>
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${m.id}-exp`} className="expand">
                          <td colSpan={11}>
                            <div style={{ padding: "12px 14px 14px 56px", display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                              <div style={{ flex: "0 0 38%", minWidth: 320 }}>
                                <div className="muted xs" style={{ marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                                  Description
                                </div>
                                <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 12 }}>
                                  {m.description ?? <span className="muted">Aucune description</span>}
                                </div>
                                <div className="hstack" style={{ gap: 8, flexWrap: "wrap" }}>
                                  {m.categorie && <span className="tag">{m.categorie}</span>}
                                  {m.typeAssemblage && <span className="tag mono">{m.typeAssemblage}</span>}
                                  {m.horsPatrimoine && (
                                    <span className="tag" style={{ background: "var(--bg-sunken)", color: "var(--ink-3)" }}>
                                      Hors patrimoine
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="defects-sub">
                                  <div className="defects-sub-h">
                                    <Icon name="alert" size={13} />
                                    Défauts artificiels
                                    <span className="count">{dCount}</span>
                                    <span style={{ flex: 1 }} />
                                    <button className="obtn sm" type="button" onClick={() => setSelectedId(m.id)}>
                                      <Icon name="edit" size={11} />Voir détail & plan
                                    </button>
                                  </div>
                                  {m.defauts && m.defauts.length > 0 ? (
                                    <table className="defects">
                                      <thead>
                                        <tr>
                                          <th style={{ width: 40 }}>#</th>
                                          <th>Type</th>
                                          <th>Position</th>
                                          <th style={{ width: 70 }}>L (mm)</th>
                                          <th style={{ width: 70 }}>l (mm)</th>
                                          <th style={{ width: 80 }}>Profond.</th>
                                          <th style={{ width: 70 }}>Ø (mm)</th>
                                          <th>Côté</th>
                                          <th style={{ width: 80 }}>Statut</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {m.defauts.map((d, idx) => (
                                          <tr key={d.id}>
                                            <td className="mono muted">D{idx + 1}</td>
                                            <td>
                                              <span className="defect-pill" style={{ ["--def-color" as string]: defautColor(d.couleur ?? d.typeDefaut) } as React.CSSProperties}>
                                                {d.typeDefaut}
                                              </span>
                                            </td>
                                            <td className="mono xs">{d.position ?? "—"}</td>
                                            <td>{d.longueur ?? "—"}</td>
                                            <td>{d.largeur ?? "—"}</td>
                                            <td>{d.profondeur ?? "—"}</td>
                                            <td>{d.diametre ?? "—"}</td>
                                            <td className="xs">{d.cote ?? "—"}</td>
                                            <td>
                                              {d.certifie ? (
                                                <span className="tag" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>
                                                  Certifié
                                                </span>
                                              ) : (
                                                <span className="muted xs">—</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div style={{ padding: 18, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
                                      Aucun défaut enregistré pour cette maquette.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ padding: "16px 24px" }}>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <MaquetteDrawer maquette={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
