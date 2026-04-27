import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DemandeEnvoi, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import Pagination from "@/components/Pagination";

const statutPill: Record<string, { cls: string; label: string }> = {
  BROUILLON:  { cls: "pill c-neutral", label: "Brouillon" },
  ENVOYEE:    { cls: "pill c-sky",     label: "Envoyée" },
  EN_TRANSIT: { cls: "pill c-amber",   label: "En transit" },
  RECUE:      { cls: "pill c-emerald", label: "Reçue" },
  CLOTUREE:   { cls: "pill c-violet",  label: "Clôturée" },
  ANNULEE:    { cls: "pill c-rose",    label: "Annulée" },
};

const typeLabel: Record<string, string> = {
  MATERIEL: "Matériel",
  MAQUETTE: "Maquette",
  MUTUALISEE: "Mutualisée",
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function DemandesEnvoiListPage() {
  const [search, setSearch] = useState("");
  const { page, pageSize, setPage, queryParams } = usePagination();

  const { data, isLoading, isError } = useQuery<PaginatedResult<DemandeEnvoi>>({
    queryKey: ["demandes-envoi", { ...queryParams, search }],
    queryFn: () =>
      api.get("/demandes-envoi", { ...queryParams, search: search || undefined }),
  });

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Demandes d'envoi</h1>
          {data && (
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{data.total} demande{data.total !== 1 ? "s" : ""}</p>
          )}
        </div>
        <Link
          to="/demandes-envoi/nouveau"
          className="obtn accent"
          style={{ textDecoration: "none" }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle demande
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par numéro, destinataire..."
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
        <p style={{ fontSize: 13, color: "var(--rose)" }}>Erreur lors du chargement des demandes.</p>
      )}

      {/* Table */}
      {data && (
        <>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Numéro", "Type", "Destinataire", "Statut", "Date souhaitée", "Date envoi", "Actions"].map((h) => (
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
                    <td colSpan={7} style={{ padding: "48px 14px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                      Aucune demande d'envoi trouvée
                    </td>
                  </tr>
                ) : (
                  data.data.map((row) => {
                    const pill = statutPill[row.statut] ?? { cls: "pill c-neutral", label: row.statut };
                    return (
                      <tr
                        key={row.id}
                        style={{ borderBottom: "1px solid var(--line-2)", transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sunken)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td style={{ padding: "0 14px", height: 50, fontWeight: 500 }}>{row.numero}</td>
                        <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>{typeLabel[row.type] ?? row.type}</td>
                        <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>{row.destinataire}</td>
                        <td style={{ padding: "0 14px", height: 50 }}>
                          <span className={pill.cls}><span className="dot" />{pill.label}</span>
                        </td>
                        <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>{formatDate(row.dateSouhaitee)}</td>
                        <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>{formatDate(row.dateEnvoi)}</td>
                        <td style={{ padding: "0 14px", height: 50 }}>
                          <Link
                            to={`/demandes-envoi/${row.id}`}
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
