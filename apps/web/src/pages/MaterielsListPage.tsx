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

const etatConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CORRECT: { label: "Correct", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  LEGER_DEFAUT: { label: "Léger défaut", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  HS: { label: "HS", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  PERDU: { label: "Perdu", color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200" },
};

const completudeConfig: Record<string, { label: string; color: string; bg: string }> = {
  COMPLET: { label: "Complet", color: "text-emerald-700", bg: "bg-emerald-50" },
  INCOMPLET: { label: "Incomplet", color: "text-amber-700", bg: "bg-amber-50" },
};

function Pill({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${color} ${bg} ${border ? `border ${border}` : ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      {label}
    </span>
  );
}

function ValidityBar({ m }: { m: Materiel }) {
  if (!m.soumisVerification) {
    return <span className="text-[11px] text-gray-400">Non soumis</span>;
  }
  if (!m.dateProchainEtalonnage) {
    return <span className="text-[11px] text-gray-400">Non renseigné</span>;
  }
  const echeance = new Date(m.dateProchainEtalonnage);
  const now = new Date();
  const jours = Math.round((echeance.getTime() - now.getTime()) / 86400000);
  const totalDays = (m.validiteEtalonnage ?? 12) * 30;
  const pct = Math.max(0, Math.min(100, 100 - (jours / totalDays) * 100));

  let cls = "text-emerald-600";
  let fill = "bg-emerald-500";
  let label = `${jours} j`;
  if (jours < 0) { cls = "text-red-600 font-semibold"; fill = "bg-red-500"; label = `${-jours} j retard`; }
  else if (jours <= 30) { cls = "text-amber-600"; fill = "bg-amber-500"; }

  const fmt = echeance.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="min-w-[120px] flex flex-col gap-1">
      <div className="flex justify-between items-baseline text-[11px]">
        <span className="font-medium text-gray-700">{fmt}</span>
        <span className={cls}>{label}</span>
      </div>
      <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: number; sub: string; accent: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />
      <div className="text-[11px] font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-[11px] text-gray-400 mt-1">{sub}</div>
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
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestion du matériel END</h1>
          <p className="text-sm text-gray-500 mt-0.5">Inventaire, étalonnage et traçabilité</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/materiels/nouveau"
            className="inline-flex items-center gap-2 bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Ajouter matériel
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <KpiCard label="Matériels actifs" value={stats.total} sub="inventaire complet" accent="bg-edf-blue" />
          <KpiCard label="Étalonnages échus" value={stats.echus} sub="à régulariser" accent="bg-red-500" />
          <KpiCard label="Échéance < 30 j" value={stats.prochains} sub="à planifier" accent="bg-amber-500" />
          <KpiCard label="En prêt / mission" value={stats.enPret} sub="hors magasin" accent="bg-sky-500" />
          <KpiCard label="HS · Incomplets" value={stats.hs + stats.incomplets} sub={`${stats.hs} HS · ${stats.incomplets} incomplets`} accent="bg-violet-500" />
        </div>
      )}

      {/* Search + Filters toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl mb-4 shadow-sm">
        <div className="p-3 flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 max-w-xl flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-edf-blue/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-edf-blue/10 transition-all">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Recherche — ID, type, modèle, fournisseur, FIEC…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-edf-blue/10 text-edf-blue border-edf-blue/20"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6}><path d="M3 5h14M6 10h8M9 15h2" /></svg>
            Filtres
            {activeFilterCount > 0 && (
              <span className="bg-edf-blue text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-semibold">{activeFilterCount}</span>
            )}
          </button>

          <div className="text-xs text-gray-400">
            {data ? `${data.total} résultat${data.total > 1 ? "s" : ""}` : ""}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="border-t border-gray-100 p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <select value={filterEtat} onChange={(e) => { setFilterEtat(e.target.value); setPage(1); }} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/20">
                <option value="">État — Tous</option>
                {(etats ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
              <select value={filterTypeEnd} onChange={(e) => { setFilterTypeEnd(e.target.value); setPage(1); }} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/20">
                <option value="">Type END — Tous</option>
                {(typesEnd ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
              <select value={filterTypeMat} onChange={(e) => { setFilterTypeMat(e.target.value); setPage(1); }} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/20">
                <option value="">Type matériel — Tous</option>
                {(typesMat ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
              <select value={filterGroupe} onChange={(e) => { setFilterGroupe(e.target.value); setPage(1); }} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/20">
                <option value="">Groupe — Tous</option>
                {(groupes ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
              <select value={filterSite} onChange={(e) => { setFilterSite(e.target.value); setPage(1); }} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/20">
                <option value="">Site — Tous</option>
                {siteOptions.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
              <select value={filterCompletude} onChange={(e) => { setFilterCompletude(e.target.value); setPage(1); }} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/20">
                <option value="">Complétude — Tous</option>
                {(completudes ?? []).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-2 text-xs text-gray-500 hover:text-red-600 transition-colors">
                Effacer tous les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {filterEtat && <FilterChip label="État" value={(etats ?? []).find(e => e.code === filterEtat)?.label ?? filterEtat} onClear={() => setFilterEtat("")} />}
          {filterTypeEnd && <FilterChip label="Type END" value={(typesEnd ?? []).find(e => e.code === filterTypeEnd)?.label ?? filterTypeEnd} onClear={() => setFilterTypeEnd("")} />}
          {filterTypeMat && <FilterChip label="Type" value={(typesMat ?? []).find(e => e.code === filterTypeMat)?.label ?? filterTypeMat} onClear={() => setFilterTypeMat("")} />}
          {filterGroupe && <FilterChip label="Groupe" value={(groupes ?? []).find(e => e.code === filterGroupe)?.label ?? filterGroupe} onClear={() => setFilterGroupe("")} />}
          {filterSite && <FilterChip label="Site" value={siteOptions.find(e => e.code === filterSite)?.label ?? filterSite} onClear={() => setFilterSite("")} />}
          {filterCompletude && <FilterChip label="Complétude" value={(completudes ?? []).find(e => e.code === filterCompletude)?.label ?? filterCompletude} onClear={() => setFilterCompletude("")} />}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Réf · Type</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Modèle</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Localisation</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Responsable</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Validité</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">État · Complétude</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Prêt</th>
                  <th className="px-3 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">
                      Aucun matériel trouvé
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="block mx-auto mt-2 text-xs text-edf-blue hover:underline">Effacer les filtres</button>
                      )}
                    </td>
                  </tr>
                ) : rows.map((m) => {
                  const etat = etatConfig[m.etat] ?? { label: m.etat, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
                  const comp = m.completude ? completudeConfig[m.completude] : null;
                  const typeEndRef = (typesEnd ?? []).find((t) => t.code === m.typeEND);
                  const typeMatRef = (typesMat ?? []).find((t) => t.code === m.typeMateriel);
                  const siteRef = (sites ?? []).find((s) => s.code === m.site);
                  const resp = m.responsable as { prenom: string; nom: string } | null | undefined;

                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${selectedId === m.id ? "bg-edf-blue/5" : "hover:bg-gray-50/80"}`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-medium text-gray-900 text-[12px]">{m.reference}</span>
                          <span className="text-[11px] text-gray-400">
                            {typeMatRef?.label ?? m.typeMateriel ?? "—"}
                            {m.fournisseur ? ` · ${m.fournisseur}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-gray-900">{m.modele ?? "—"}</span>
                          {m.typeEND && (
                            <span className="inline-flex w-fit items-center px-1.5 py-0 rounded bg-gray-100 border border-gray-200 text-[10px] font-mono font-medium text-gray-600">
                              {typeEndRef?.label ?? m.typeEND}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 font-medium text-gray-800">
                            <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6}><path d="M10 18s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z M10 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg>
                            {siteRef?.label ?? m.site ?? "—"}
                          </span>
                          <span className="text-[11px] text-gray-400">{m.groupe ?? ""} {m.enPret ? "· En prêt" : ""}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {resp ? (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-edf-blue/10 text-edf-blue flex items-center justify-center text-[10px] font-semibold shrink-0">
                              {resp.prenom?.[0]}{resp.nom?.[0]}
                            </span>
                            <span className="text-[12px] text-gray-700">{resp.prenom} {resp.nom}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <ValidityBar m={m} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Pill label={etat.label} color={etat.color} bg={etat.bg} border={etat.border} />
                          {comp && <Pill label={comp.label} color={comp.color} bg={comp.bg} />}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {m.enPret ? (
                          <Pill label="En prêt" color="text-sky-700" bg="bg-sky-50" border="border-sky-200" />
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/materiels/${m.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-edf-blue hover:bg-edf-blue/5 rounded-lg transition-colors inline-flex"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Detail Drawer */}
      {selectedMat && (
        <MaterielDrawer materiel={selectedMat} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function FilterChip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-edf-blue/10 text-edf-blue border border-edf-blue/20 rounded-full text-[12px] font-medium">
      <span className="text-edf-blue/60 text-[11px]">{label}:</span> {value}
      <button onClick={onClear} className="ml-0.5 opacity-60 hover:opacity-100">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}><path d="M5 5l10 10M15 5L5 15" /></svg>
      </button>
    </span>
  );
}
