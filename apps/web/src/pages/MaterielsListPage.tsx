import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import { useReferentiel, useSites } from "@/hooks/use-referentiels";
import Pagination from "@/components/Pagination";
import Badge from "@/components/Badge";

const etatBadge: Record<string, { variant: string; label: string }> = {
  DISPONIBLE: { variant: "success", label: "Disponible" },
  EN_SERVICE: { variant: "info", label: "En service" },
  EN_REPARATION: { variant: "warning", label: "En réparation" },
  EN_ETALONNAGE: { variant: "purple", label: "En étalonnage" },
  PRETE: { variant: "purple", label: "Prêté" },
  REBUT: { variant: "danger", label: "Rebut" },
  ENVOYEE: { variant: "default", label: "Envoyé" },
  RESERVE: { variant: "info", label: "Réservé" },
};

type SortKey = "reference" | "libelle" | "etat" | "typeMateriel" | "site" | "typeEND";
type SortDir = "asc" | "desc";

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { code: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/30"
      >
        <option value="">Tous</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {currentDir === "asc" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
          </svg>
        )}
        {!active && (
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )}
      </span>
    </th>
  );
}

export default function MaterielsListPage() {
  const [search, setSearch] = useState("");
  const [filterEtat, setFilterEtat] = useState("");
  const [filterTypeEnd, setFilterTypeEnd] = useState("");
  const [filterTypeMat, setFilterTypeMat] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterGroupe, setFilterGroupe] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("reference");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const { page, setPage, queryParams } = usePagination();

  const { data: etats } = useReferentiel("ETAT_MATERIEL");
  const { data: typesEnd } = useReferentiel("TYPE_END");
  const { data: typesMat } = useReferentiel("TYPE_MATERIEL");
  const { data: groupes } = useReferentiel("GROUPE");
  const { data: sites } = useSites();

  const siteOptions = useMemo(
    () => (sites ?? []).map((s) => ({ code: s.code, label: s.label })),
    [sites]
  );

  const { data, isLoading, isError } = useQuery<PaginatedResult<Materiel>>({
    queryKey: ["materiels", { ...queryParams, search, etat: filterEtat, typeEND: filterTypeEnd, typeMateriel: filterTypeMat, site: filterSite, groupe: filterGroupe }],
    queryFn: () =>
      api.get("/materiels", {
        ...queryParams,
        search: search || undefined,
        etat: filterEtat || undefined,
        typeEND: filterTypeEnd || undefined,
        typeMateriel: filterTypeMat || undefined,
        site: filterSite || undefined,
        groupe: filterGroupe || undefined,
      }),
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => {
      const aVal = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bVal = String((b as Record<string, unknown>)[sortKey] ?? "");
      const cmp = aVal.localeCompare(bVal, "fr");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data?.data, sortKey, sortDir]);

  const activeFilterCount = [filterEtat, filterTypeEnd, filterTypeMat, filterSite, filterGroupe].filter(Boolean).length;

  const clearFilters = () => {
    setFilterEtat("");
    setFilterTypeEnd("");
    setFilterTypeMat("");
    setFilterSite("");
    setFilterGroupe("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Matériels END</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.total} matériel${data.total > 1 ? "s" : ""}` : "Chargement..."}
          </p>
        </div>
        <Link
          to="/materiels/nouveau"
          className="inline-flex items-center gap-2 bg-edf-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau matériel
        </Link>
      </div>

      {/* Search + filter toggle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher par référence, libellé, modèle..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/30 focus:border-edf-blue/30"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-edf-blue/10 text-edf-blue border-edf-blue/20"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtres
            {activeFilterCount > 0 && (
              <span className="bg-edf-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="border-t border-gray-100 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <FilterSelect label="État" value={filterEtat} onChange={(v) => { setFilterEtat(v); setPage(1); }} options={etats ?? []} />
              <FilterSelect label="Type END" value={filterTypeEnd} onChange={(v) => { setFilterTypeEnd(v); setPage(1); }} options={typesEnd ?? []} />
              <FilterSelect label="Type matériel" value={filterTypeMat} onChange={(v) => { setFilterTypeMat(v); setPage(1); }} options={typesMat ?? []} />
              <FilterSelect label="Groupe" value={filterGroupe} onChange={(v) => { setFilterGroupe(v); setPage(1); }} options={groupes ?? []} />
              <FilterSelect label="Site" value={filterSite} onChange={(v) => { setFilterSite(v); setPage(1); }} options={siteOptions} />
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-3 text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                Effacer tous les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-sm text-red-600">Erreur lors du chargement des matériels.</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-xs text-red-500 hover:underline">
            Réessayer
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <SortHeader label="Référence" sortKey="reference" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Libellé" sortKey="libelle" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortHeader label="État" sortKey="etat" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Type END" sortKey="typeEND" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Type" sortKey="typeMateriel" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Site" sortKey="site" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm text-gray-500">Aucun matériel trouvé</p>
                        {(search || activeFilterCount > 0) && (
                          <button onClick={clearFilters} className="mt-2 text-xs text-edf-blue hover:underline">
                            Effacer les filtres
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    sortedData.map((row) => {
                      const badge = etatBadge[row.etat] ?? { variant: "default", label: row.etat };
                      const typeEndRef = (typesEnd ?? []).find((t) => t.code === row.typeEND);
                      const typeMatRef = (typesMat ?? []).find((t) => t.code === row.typeMateriel);
                      const siteRef = (sites ?? []).find((s) => s.code === row.site);

                      return (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <Link to={`/materiels/${row.id}`} className="text-sm font-semibold text-edf-blue hover:underline">
                              {row.reference}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{row.libelle}</div>
                            {row.modele && <div className="text-xs text-gray-400">{row.modele}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={badge.variant} text={badge.label} />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {typeEndRef?.label ?? row.typeEND ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {typeMatRef?.label ?? row.typeMateriel ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {siteRef?.label ?? row.site ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/materiels/${row.id}`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-edf-blue transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Voir
                              </Link>
                              <Link
                                to={`/materiels/${row.id}/modifier`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-edf-blue transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Modifier
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
