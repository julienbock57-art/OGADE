import React, { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import { useReferentiel, useSites, useEntreprises } from "@/hooks/use-referentiels";
import Pagination from "@/components/Pagination";
import MaterielDrawer from "@/components/MaterielDrawer";
import { usePanier } from "@/lib/panier";

type Stats = { total: number; echus: number; prochains: number; enPret: number; hs: number; incomplets: number };

function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const paths: Record<string, string> = {
    search: "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
    filter: "M3 5h14M6 10h8M9 15h2",
    plus: "M10 4v12M4 10h12",
    pin: "M10 18s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z M10 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    edit: "M12 4l4 4-8 8H4v-4l8-8z",
    x: "M5 5l10 10M15 5L5 15",
    eye: "M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    chevR: "M7 5l5 5-5 5",
    cart: "M3 4h2l2 9h10l2-7H7 M8 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M16 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
    check: "M4 10l4 4 8-8",
    dash: "M4 10h12",
    dots: "M5 10h.01M10 10h.01M15 10h.01",
    qr: "M3 3h6v6H3z M11 3h6v6h-6z M3 11h6v6H3z M11 11h2v2h-2z M15 11h2v2h-2z M11 15h2v2h-2z M15 15h2v2h-2z M5 5h2v2H5z M13 5h2v2h-2z M5 13h2v2H5z",
    history: "M10 18a8 8 0 1 0-8-8 M2 4v4h4 M10 6v4l3 2",
    swap: "M5 7h11l-3-3 M15 13H4l3 3",
    flask: "M8 3h4 M9 3v5l-4 8a2 2 0 0 0 2 3h6a2 2 0 0 0 2-3l-4-8V3",
    star: "M10 3l2.3 4.6 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.4l5.2-.8L10 3z",
    trash: "M4 6h12 M6 6V4h8v2 M5 6l1 11h8l1-11",
  };
  const d = paths[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const etatCfg: Record<string, { cls: string; label: string }> = {
  CORRECT: { cls: "c-emerald", label: "Correct" },
  LEGER_DEFAUT: { cls: "c-amber", label: "Léger défaut" },
  HS: { cls: "c-rose", label: "HS" },
  PERDU: { cls: "c-neutral", label: "Perdu" },
};
const compCfg: Record<string, { cls: string; label: string }> = {
  COMPLET: { cls: "c-emerald", label: "Complet" },
  INCOMPLET: { cls: "c-amber", label: "Incomplet" },
};

const avatarColors = ["oklch(0.70 0.15 30)", "oklch(0.70 0.15 150)", "oklch(0.70 0.15 210)", "oklch(0.70 0.15 275)", "oklch(0.70 0.15 340)", "oklch(0.70 0.15 60)"];

function ValidityBar({ m }: { m: Materiel }) {
  if (!m.soumisVerification) return <span style={{ fontSize: 11, color: "var(--ink-4)" }}>Non soumis</span>;
  if (!m.dateProchainEtalonnage) return <span style={{ fontSize: 11, color: "var(--ink-4)" }}>Non renseigné</span>;
  const echeance = new Date(m.dateProchainEtalonnage);
  const jours = Math.round((echeance.getTime() - Date.now()) / 86400000);
  const totalDays = (m.validiteEtalonnage ?? 12) * 30;
  const pct = Math.max(0, Math.min(100, 100 - (jours / totalDays) * 100));
  let restCls = "ok", fill = "var(--emerald)", label = `dans ${jours} j`;
  if (jours < 0) { restCls = "late"; fill = "var(--rose)"; label = `${-jours} j retard`; }
  else if (jours <= 30) { restCls = "warn"; fill = "oklch(0.72 0.17 75)"; }
  const fmt = echeance.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <div className="validity">
      <div className="validity-top">
        <span className="validity-date">{fmt}</span>
        <span className={`validity-rest ${restCls}`}>{label}</span>
      </div>
      <div className="validity-bar"><div style={{ width: `${pct}%`, background: fill }} /></div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent, active, onClick }: { label: string; value: number; sub: string; accent: string; active?: boolean; onClick?: () => void }) {
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

function CartPanel({ items, onClose, onRemove, onClear }: {
  items: Materiel[]; onClose: () => void; onRemove: (id: number) => void; onClear: () => void;
}) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} style={{ background: "transparent" }} />
      <div className="cart-panel">
        <div className="cart-head">
          <Icon name="cart" size={16} />
          <h3>Panier de mouvements</h3>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)" }}>{items.length} matériel{items.length > 1 ? "s" : ""}</span>
          <button className="icon-btn" onClick={onClose} style={{ padding: 5, border: 0 }}><Icon name="x" size={13} /></button>
        </div>
        <div className="cart-body">
          {items.length === 0 && <div style={{ padding: 60, textAlign: "center", color: "var(--ink-3)" }}>Sélectionnez des matériels pour préparer un mouvement</div>}
          {items.map(m => (
            <div key={m.id} className="cart-item">
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="cart-id">{m.reference}</span>
                <span className="cart-name">{m.typeMateriel ?? "Matériel"} · {m.modele ?? "—"}</span>
                <span className="cart-loc"><Icon name="pin" size={11} /> {m.site ?? "—"}</span>
              </div>
              <button className="icon-btn" onClick={() => onRemove(m.id)} style={{ padding: 5, alignSelf: "center" }}><Icon name="x" size={12} /></button>
            </div>
          ))}
        </div>
        <div className="cart-foot">
          <button className="obtn danger sm" disabled={!items.length} onClick={onClear}><Icon name="trash" size={12} />Vider</button>
          <button className="obtn success sm" disabled={!items.length}><Icon name="swap" size={12} />Transfert</button>
          <button className="obtn sm" disabled={!items.length}><Icon name="flask" size={12} />Étalonnage</button>
          <button className="obtn accent sm" disabled={!items.length}><Icon name="star" size={12} />Réservation</button>
        </div>
      </div>
    </>
  );
}

function ExpandedRow({ m, typesEnd, typesMat, sites, inCart, onAddCart, onOpenQr }: {
  m: Materiel; typesEnd: any[]; typesMat: any[]; sites: any[]; inCart: boolean; onAddCart: () => void; onOpenQr: () => void;
}) {
  const navigate = useNavigate();
  const typeEndRef = typesEnd.find((t: any) => t.code === m.typeEND);
  const typeMatRef = typesMat.find((t: any) => t.code === m.typeMateriel);
  const siteRef = sites.find((s: any) => s.code === m.site);
  const fmt = (d: string | Date | null | undefined) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  return (
    <div className="expanded-content">
      <div className="expanded-section">
        <h4>Détail technique</h4>
        <div className="drawer-grid">
          <div className="field"><span className="field-label">Modèle</span><span className="field-value">{m.modele ?? "—"}</span></div>
          <div className="field"><span className="field-label">Type END</span><span className="field-value"><span className="tag mono">{typeEndRef?.label ?? m.typeEND ?? "—"}</span></span></div>
          <div className="field"><span className="field-label">Fournisseur</span><span className="field-value">{m.fournisseur ?? "—"}</span></div>
          {m.typeTraducteur && <div className="field"><span className="field-label">Traducteur</span><span className="field-value">{m.typeTraducteur}</span></div>}
          <div className="field"><span className="field-label">N° FIEC</span><span className="field-value mono">{m.numeroFIEC || "—"}</span></div>
          <div className="field"><span className="field-label">Lot / chaîne</span><span className="field-value mono">{m.lotChaine || "—"}</span></div>
          <div className="field"><span className="field-label">Propriétaire</span><span className="field-value">{m.proprietaire ?? "—"}</span></div>
          <div className="field"><span className="field-label">Dernier étalonnage</span><span className="field-value">{fmt(m.dateEtalonnage)}</span></div>
          <div className="field"><span className="field-label">Validité</span><span className="field-value">{m.validiteEtalonnage ? `${m.validiteEtalonnage} mois` : "—"}</span></div>
        </div>
      </div>
      <div className="expanded-section">
        <h4>Actions rapides</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="obtn sm" onClick={() => navigate(`/materiels/${m.id}`)}><Icon name="eye" size={12} />Détail</button>
          <button className="obtn sm" onClick={() => navigate(`/materiels/${m.id}/edit`)}><Icon name="edit" size={12} />Modifier</button>
          <button className="obtn sm" onClick={onAddCart} disabled={inCart}><Icon name="cart" size={12} />{inCart ? "Dans le panier" : "Ajouter au panier"}</button>
          <button className="obtn sm" onClick={onOpenQr}><Icon name="qr" size={12} />QR code</button>
          <button className="obtn sm"><Icon name="history" size={12} />Historique</button>
        </div>
        {m.commentaireEtat && (
          <>
            <h4 style={{ marginTop: 14, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)" }}>Commentaire état</h4>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>{m.commentaireEtat}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function MaterielsListPage() {
  const [search, setSearch] = useState("");
  const [filterEtat, setFilterEtat] = useState("");
  const [filterTypeEnd, setFilterTypeEnd] = useState("");
  const [filterTypeMat, setFilterTypeMat] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterGroupe, setFilterGroupe] = useState("");
  const [filterCompletude, setFilterCompletude] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [scope, setScope] = useState<"tous" | "mes">("tous");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerTab, setDrawerTab] = useState<"infos" | "qr">("infos");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [cart, setCart] = useState<Map<number, Materiel>>(new Map());
  const [cartOpen, setCartOpen] = useState(false);
  const panier = usePanier();
  const { page, setPage, queryParams } = usePagination();

  const { data: etats } = useReferentiel("ETAT_MATERIEL");
  const { data: typesEnd } = useReferentiel("TYPE_END");
  const { data: typesMat } = useReferentiel("TYPE_MATERIEL");
  const { data: groupes } = useReferentiel("GROUPE");
  const { data: completudes } = useReferentiel("COMPLETUDE");
  const { data: sites } = useSites();
  const { data: entreprises } = useEntreprises();
  const siteOptions = useMemo(() => (sites ?? []).map((s) => ({ code: s.code, label: s.label })), [sites]);

  const { data: stats } = useQuery<Stats>({ queryKey: ["materiels-stats"], queryFn: () => api.get("/materiels/stats") });
  const kpiFilters = useMemo(() => {
    if (activeKpi === 'echus') return { etalonnageEchu: 'true' };
    if (activeKpi === 'prochains') return { echeance30j: 'true' };
    if (activeKpi === 'enPret') return { enPret: 'true' };
    if (activeKpi === 'hsIncomplet') return { hsIncomplet: 'true' };
    return {};
  }, [activeKpi]);

  const { data, isLoading } = useQuery<PaginatedResult<Materiel>>({
    queryKey: ["materiels", { ...queryParams, search, etat: filterEtat, typeEND: filterTypeEnd, typeMateriel: filterTypeMat, site: filterSite, groupe: filterGroupe, completude: filterCompletude, scope, ...kpiFilters }],
    queryFn: () => api.get("/materiels", { ...queryParams, search: search || undefined, etat: filterEtat || undefined, typeEND: filterTypeEnd || undefined, typeMateriel: filterTypeMat || undefined, site: filterSite || undefined, groupe: filterGroupe || undefined, completude: filterCompletude || undefined, mes: scope === "mes" ? "true" : undefined, ...kpiFilters }),
  });

  const handleKpiClick = useCallback((key: string | null) => {
    setActiveKpi(prev => prev === key ? null : key);
    setFilterEtat(""); setFilterTypeEnd(""); setFilterTypeMat(""); setFilterSite(""); setFilterGroupe(""); setFilterCompletude("");
    setPage(1);
  }, [setPage]);

  const activeFilterCount = [filterEtat, filterTypeEnd, filterTypeMat, filterSite, filterGroupe, filterCompletude].filter(Boolean).length;
  const clearFilters = () => { setFilterEtat(""); setFilterTypeEnd(""); setFilterTypeMat(""); setFilterSite(""); setFilterGroupe(""); setFilterCompletude(""); setSearch(""); setActiveKpi(null); setPage(1); };
  const rows = data?.data ?? [];
  const selectedMat = selectedId ? rows.find((r) => r.id === selectedId) : null;

  const toggleExpand = useCallback((id: number) => setExpandedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const toggleSel = useCallback((id: number) => setSelection(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const toggleSelAll = useCallback(() => setSelection(s => {
    const allIds = new Set(rows.map(r => r.id));
    return rows.every(r => s.has(r.id)) ? new Set<number>() : allIds;
  }), [rows]);
  const addCart = useCallback((m: Materiel) => {
    setCart(c => { const n = new Map(c); n.set(m.id, m); return n; });
    panier.add({
      kind: "materiel",
      id: m.id,
      reference: m.reference,
      libelle: m.libelle,
      site: m.site ?? null,
      typeMateriel: m.typeMateriel ?? null,
    });
  }, [panier]);
  const removeCart = useCallback((id: number) => setCart(c => { const n = new Map(c); n.delete(id); return n; }), []);
  const clearCart = useCallback(() => setCart(new Map()), []);
  const addSelectionToCart = useCallback(() => {
    setCart(c => { const n = new Map(c); selection.forEach(id => { const m = rows.find(x => x.id === id); if (m) n.set(id, m); }); return n; });
  }, [selection, rows]);

  const allSel = rows.length > 0 && rows.every(r => selection.has(r.id));
  const someSel = rows.some(r => selection.has(r.id));
  const cartItems = Array.from(cart.values());

  // --- RENDER PART 1: header + KPIs + toolbar ---
  // (table will follow in next edit)
  return (
    <div>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "var(--ink)" }}>Gestion du matériel END</h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2, marginBottom: 0 }}>Inventaire, étalonnage, mouvements et traçabilité</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="obtn" onClick={() => setCartOpen(true)}>
            <Icon name="cart" size={14} />Panier{cart.size > 0 && <span className="tag c-accent" style={{ padding: "0 6px", fontSize: 11 }}>{cart.size}</span>}
          </button>
          <Link to="/materiels/nouveau" className="obtn accent" style={{ textDecoration: "none" }}><Icon name="plus" size={14} />Ajouter matériel</Link>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="kpi-grid">
          <KpiCard label="Matériels actifs" value={stats.total} sub="inventaire complet" accent="var(--accent)" active={activeKpi === null} onClick={() => handleKpiClick(null)} />
          <KpiCard label="Étalonnages échus" value={stats.echus} sub="à régulariser" accent="var(--rose)" active={activeKpi === "echus"} onClick={() => handleKpiClick("echus")} />
          <KpiCard label="Échéance < 30 j" value={stats.prochains} sub="à planifier" accent="var(--amber)" active={activeKpi === "prochains"} onClick={() => handleKpiClick("prochains")} />
          <KpiCard label="En prêt / mission" value={stats.enPret} sub="hors magasin" accent="var(--sky)" active={activeKpi === "enPret"} onClick={() => handleKpiClick("enPret")} />
          <KpiCard label="HS · Incomplets" value={stats.hs + stats.incomplets} sub={`${stats.hs} HS · ${stats.incomplets} incomplets`} accent="var(--violet)" active={activeKpi === "hsIncomplet"} onClick={() => handleKpiClick("hsIncomplet")} />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-panel)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <div className="search-bar">
          <Icon name="search" size={14} />
          <input type="text" placeholder="Recherche — ID, type, modèle, fournisseur, FIEC…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className={`obtn${showFilters || activeFilterCount > 0 ? " accent" : ""}`} onClick={() => setShowFilters(!showFilters)}>
          <Icon name="filter" size={14} />Filtres
          {activeFilterCount > 0 && <span style={{ background: "white", color: "var(--accent)", borderRadius: 999, padding: "0 6px", fontSize: 11, fontWeight: 600 }}>{activeFilterCount}</span>}
        </button>
        <div className="seg">
          <button className={scope === "tous" ? "on" : ""} onClick={() => { setScope("tous"); setPage(1); }}>
            Tous
          </button>
          <button className={scope === "mes" ? "on" : ""} onClick={() => { setScope("mes"); setPage(1); }}>
            Mes matériels
          </button>
        </div>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--ink-4)", whiteSpace: "nowrap" }}>{data ? `${data.total} résultat${data.total > 1 ? "s" : ""}` : ""}</span>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--line)", padding: "12px 24px" }}>
          <div className="filter-grid">
            <select value={filterEtat} onChange={(e) => { setFilterEtat(e.target.value); setActiveKpi(null); setPage(1); }} className="oselect"><option value="">État — Tous</option>{(etats ?? []).map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>
            <select value={filterTypeEnd} onChange={(e) => { setFilterTypeEnd(e.target.value); setActiveKpi(null); setPage(1); }} className="oselect"><option value="">Type END — Tous</option>{(typesEnd ?? []).map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>
            <select value={filterTypeMat} onChange={(e) => { setFilterTypeMat(e.target.value); setActiveKpi(null); setPage(1); }} className="oselect"><option value="">Type matériel — Tous</option>{(typesMat ?? []).map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>
            <select value={filterGroupe} onChange={(e) => { setFilterGroupe(e.target.value); setActiveKpi(null); setPage(1); }} className="oselect"><option value="">Groupe — Tous</option>{(groupes ?? []).map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>
            <select value={filterSite} onChange={(e) => { setFilterSite(e.target.value); setActiveKpi(null); setPage(1); }} className="oselect"><option value="">Site — Tous</option>{siteOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>
            <select value={filterCompletude} onChange={(e) => { setFilterCompletude(e.target.value); setActiveKpi(null); setPage(1); }} className="oselect"><option value="">Complétude — Tous</option>{(completudes ?? []).map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>
          </div>
          {activeFilterCount > 0 && <button onClick={clearFilters} className="obtn ghost" style={{ marginTop: 10, fontSize: 12 }}>Effacer tous les filtres</button>}
        </div>
      )}

      {/* Active filter chips */}
      {(activeFilterCount > 0 || activeKpi) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "10px 24px 4px", background: "var(--bg-panel)", borderBottom: "1px solid var(--line-2)" }}>
          <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{data?.total ?? 0} matériel{(data?.total ?? 0) > 1 ? "s" : ""} ·</span>
          {activeKpi && <span className="chip" style={{ background: "var(--accent)", color: "white" }}><span style={{ fontSize: 11 }}>{{ echus: "Étalonnages échus", prochains: "Échéance < 30 j", enPret: "En prêt / mission", hsIncomplet: "HS · Incomplets" }[activeKpi]}</span><button onClick={() => setActiveKpi(null)} style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}><Icon name="x" size={11} /></button></span>}
          {filterEtat && <span className="chip"><span style={{ opacity: 0.7, fontSize: 11 }}>État:</span> {(etats ?? []).find(e => e.code === filterEtat)?.label ?? filterEtat}<button onClick={() => setFilterEtat("")} style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}><Icon name="x" size={11} /></button></span>}
          {filterTypeEnd && <span className="chip"><span style={{ opacity: 0.7, fontSize: 11 }}>Type END:</span> {(typesEnd ?? []).find(e => e.code === filterTypeEnd)?.label ?? filterTypeEnd}<button onClick={() => setFilterTypeEnd("")} style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}><Icon name="x" size={11} /></button></span>}
          {filterTypeMat && <span className="chip"><span style={{ opacity: 0.7, fontSize: 11 }}>Type:</span> {(typesMat ?? []).find(e => e.code === filterTypeMat)?.label ?? filterTypeMat}<button onClick={() => setFilterTypeMat("")} style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}><Icon name="x" size={11} /></button></span>}
          {filterGroupe && <span className="chip"><span style={{ opacity: 0.7, fontSize: 11 }}>Groupe:</span> {(groupes ?? []).find(e => e.code === filterGroupe)?.label ?? filterGroupe}<button onClick={() => setFilterGroupe("")} style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}><Icon name="x" size={11} /></button></span>}
          {filterSite && <span className="chip"><span style={{ opacity: 0.7, fontSize: 11 }}>Site:</span> {siteOptions.find(e => e.code === filterSite)?.label ?? filterSite}<button onClick={() => setFilterSite("")} style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}><Icon name="x" size={11} /></button></span>}
          {filterCompletude && <span className="chip"><span style={{ opacity: 0.7, fontSize: 11 }}>Complétude:</span> {(completudes ?? []).find(e => e.code === filterCompletude)?.label ?? filterCompletude}<button onClick={() => setFilterCompletude("")} style={{ background: "none", border: "none", padding: 0, color: "inherit", marginLeft: 2, display: "inline-flex" }}><Icon name="x" size={11} /></button></span>}
          <button className="obtn sm ghost" onClick={clearFilters} style={{ marginLeft: 4 }}>Tout effacer</button>
        </div>
      )}

      {/* BULK BAR */}
      {selection.size > 0 && (
        <div className="bulk-bar">
          <span><b>{selection.size}</b> matériel{selection.size > 1 ? "s" : ""} sélectionné{selection.size > 1 ? "s" : ""}</span>
          <button className="obtn sm" onClick={addSelectionToCart}><Icon name="cart" size={12} />Ajouter au panier</button>
          <button className="obtn sm"><Icon name="swap" size={12} />Transfert site</button>
          <button className="obtn sm"><Icon name="flask" size={12} />Envoi étalonnage</button>
          <span style={{ flex: 1 }} />
          <button className="obtn sm" onClick={() => setSelection(new Set())}><Icon name="x" size={12} />Désélectionner</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", flex: 1, overflow: "auto", borderTop: "1px solid var(--line)" }}>
        {isLoading ? (
          <div style={{ padding: "32px 24px" }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ height: 44, background: "var(--bg-sunken)", borderRadius: 6, marginBottom: 10, animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--ui-fs)" }}>
            <thead>
              <tr>
                <th style={{ width: 32, padding: "10px var(--pad-x)", borderBottom: "1px solid var(--line)", background: "var(--bg-panel)", position: "sticky", top: 0, zIndex: 2 }}>
                  <span className={`cbx ${allSel ? "on" : someSel ? "partial" : ""}`} onClick={toggleSelAll}>
                    {allSel ? <Icon name="check" size={10} stroke={2.8} /> : someSel ? <Icon name="dash" size={10} stroke={2.5} /> : null}
                  </span>
                </th>
                <th style={{ width: 24, padding: 0, borderBottom: "1px solid var(--line)", background: "var(--bg-panel)", position: "sticky", top: 0, zIndex: 2 }} />
                {["ID · Type", "Modèle", "Localisation", "Responsable", "Validité", "Entreprise", "État · Complétude", "Prêt"].map((h, i) => (
                  <th key={i} style={{ padding: "10px var(--pad-x)", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-3)", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap", background: "var(--bg-panel)", position: "sticky", top: 0, zIndex: 2 }}>{h}</th>
                ))}
                <th style={{ width: 60, borderBottom: "1px solid var(--line)", background: "var(--bg-panel)", position: "sticky", top: 0, zIndex: 2 }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: "60px 24px", textAlign: "center", color: "var(--ink-3)" }}>
                  Aucun matériel ne correspond aux filtres actifs.
                  {activeFilterCount > 0 && <button onClick={clearFilters} style={{ display: "block", margin: "8px auto 0", fontSize: 12, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>Effacer les filtres</button>}
                </td></tr>
              ) : rows.map(m => {
                const expanded = expandedIds.has(m.id);
                const sel = selection.has(m.id);
                const inCart = cart.has(m.id);
                const etat = etatCfg[m.etat] ?? { cls: "c-neutral", label: m.etat };
                const comp = m.completude ? compCfg[m.completude] : null;
                const typeEndRef = (typesEnd ?? []).find((t: any) => t.code === m.typeEND);
                const typeMatRef = (typesMat ?? []).find((t: any) => t.code === m.typeMateriel);
                const siteRef = (sites ?? []).find((s: any) => s.code === m.site);
                const resp = m.responsable as { prenom: string; nom: string } | null | undefined;
                const initials = resp ? `${resp.prenom?.[0] ?? ""}${resp.nom?.[0] ?? ""}` : "";
                const avatarColor = avatarColors[(initials.charCodeAt(0) ?? 0) % avatarColors.length];
                const isSelected = selectedId === m.id;

                return (
                  <React.Fragment key={m.id}>
                    <tr
                      className={`${isSelected ? "row-selected" : ""} ${inCart ? "in-cart" : ""}`}
                      onClick={() => { setSelectedId(m.id); setDrawerTab("infos"); }}
                      style={{ height: "var(--row-h)", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--bg-sunken)"; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }} onClick={e => { e.stopPropagation(); toggleSel(m.id); }}>
                        <span className={`cbx ${sel ? "on" : ""}`}>{sel && <Icon name="check" size={10} stroke={2.8} />}</span>
                      </td>
                      {/* Expand */}
                      <td style={{ padding: 0, borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }} onClick={e => { e.stopPropagation(); toggleExpand(m.id); }}>
                        <button className={`expand-btn ${expanded ? "open" : ""}`}><Icon name="chevR" size={12} /></button>
                      </td>
                      {/* ID · Type */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, lineHeight: 1.3 }}>
                          <span className="mono" style={{ fontWeight: 500, color: "var(--ink)", fontSize: 11.5 }}>{m.reference}</span>
                          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{typeMatRef?.label ?? m.typeMateriel ?? "—"}{m.fournisseur ? ` · ${m.fournisseur}` : ""}</span>
                        </div>
                      </td>
                      {/* Modèle */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle", fontWeight: 500 }}>{m.modele ?? "—"}</td>
                      {/* Localisation */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, lineHeight: 1.3 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 500, color: "var(--ink)" }}><Icon name="pin" size={12} />{siteRef?.label ?? m.site ?? "—"}</span>
                          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{m.enPret ? "En prêt" : "Au magasin"}</span>
                        </div>
                      </td>
                      {/* Responsable */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }}>
                        {resp ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 22, height: 22, borderRadius: "50%", background: avatarColor, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{initials}</span>
                            <span style={{ fontSize: 12 }}>{resp.prenom} {resp.nom}</span>
                          </div>
                        ) : <span style={{ fontSize: 11, color: "var(--ink-4)" }}>—</span>}
                      </td>
                      {/* Validité */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }}><ValidityBar m={m} /></td>
                      {/* Entreprise */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }}><span className="tag">{m.entreprise ?? "—"}</span></td>
                      {/* État · Complétude */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className={`pill ${etat.cls}`}><span className="dot" />{etat.label}</span>
                          {comp && <span className={`pill ${comp.cls}`}><span className="dot" />{comp.label}</span>}
                        </div>
                      </td>
                      {/* Prêt */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }}>
                        {m.enPret ? <span className="pill c-sky"><span className="dot" />En prêt</span> : <span style={{ fontSize: 11, color: "var(--ink-4)" }}>—</span>}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "0 var(--pad-x)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <button className="icon-btn" style={{ padding: 5 }} onClick={() => addCart(m)} disabled={inCart} title={inCart ? "Dans le panier" : "Ajouter au panier"}><Icon name="cart" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row */}
                    {expanded && (
                      <tr className="expanded-row"><td colSpan={11}>
                        <ExpandedRow m={m} typesEnd={typesEnd ?? []} typesMat={typesMat ?? []} sites={sites ?? []} inCart={inCart} onAddCart={() => addCart(m)} onOpenQr={() => { setSelectedId(m.id); setDrawerTab("qr"); }} />
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}
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
      {selectedMat && <MaterielDrawer materiel={selectedMat} onClose={() => setSelectedId(null)} initialTab={drawerTab} />}

      {/* Cart */}
      {cartOpen && <CartPanel items={cartItems} onClose={() => setCartOpen(false)} onRemove={removeCart} onClear={clearCart} />}
    </div>
  );
}
