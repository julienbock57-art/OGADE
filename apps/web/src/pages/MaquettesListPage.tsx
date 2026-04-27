import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Maquette, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import Pagination from "@/components/Pagination";

const etatPill: Record<string, { cls: string; label: string }> = {
  STOCK:        { cls: "pill c-emerald", label: "En stock" },
  EMPRUNTEE:    { cls: "pill c-amber",   label: "Empruntée" },
  EN_CONTROLE:  { cls: "pill c-sky",     label: "En contrôle" },
  REBUT:        { cls: "pill c-rose",    label: "Rebut" },
  EN_REPARATION:{ cls: "pill c-violet",  label: "En réparation" },
  ENVOYEE:      { cls: "pill c-neutral", label: "Envoyée" },
};

export default function MaquettesListPage() {
  const [search, setSearch] = useState("");
  const { page, pageSize, setPage, queryParams } = usePagination();

  const { data, isLoading, isError } = useQuery<PaginatedResult<Maquette>>({
    queryKey: ["maquettes", { ...queryParams, search }],
    queryFn: () =>
      api.get("/maquettes", { ...queryParams, search: search || undefined }),
  });

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Maquettes</h1>
          {data && (
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{data.total} maquette{data.total !== 1 ? "s" : ""}</p>
          )}
        </div>
        <Link
          to="/maquettes/nouveau"
          className="obtn accent"
          style={{ textDecoration: "none" }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle maquette
        </Link>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 14 }}>
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par référence, libellé..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0", color: "var(--ink-3)", fontSize: 13 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
          Chargement...
        </div>
      )}
      {isError && (
        <p style={{ fontSize: 13, color: "var(--rose)" }}>Erreur lors du chargement des maquettes.</p>
      )}

      {/* Table */}
      {data && (
        <>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Référence", "Libellé", "État", "Type", "Site", "Actions"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 14px",
                      fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: "0.04em", color: "var(--ink-3)",
                      background: "var(--bg-panel)",
                      borderBottom: "1px solid var(--line)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 14px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                      Aucune maquette trouvée
                    </td>
                  </tr>
                ) : (
                  data.data.map((row) => {
                    const pill = etatPill[row.etat] ?? { cls: "pill c-neutral", label: row.etat };
                    return (
                      <tr
                        key={row.id}
                        style={{ borderBottom: "1px solid var(--line-2)", transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sunken)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td style={{ padding: "0 14px", height: 50, fontWeight: 500 }}>{row.reference}</td>
                        <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>{row.libelle}</td>
                        <td style={{ padding: "0 14px", height: 50 }}>
                          <span className={pill.cls}><span className="dot" />{pill.label}</span>
                        </td>
                        <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>{row.typeMaquette ?? "—"}</td>
                        <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>{row.site ?? "—"}</td>
                        <td style={{ padding: "0 14px", height: 50 }}>
                          <Link
                            to={`/maquettes/${row.id}`}
                            style={{ color: "var(--accent-ink)", fontWeight: 500, fontSize: 13, textDecoration: "none" }}
                          >
                            Voir
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
