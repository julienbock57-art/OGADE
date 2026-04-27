import { useQuery } from "@tanstack/react-query";
import type { PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import Pagination from "@/components/Pagination";

interface AgentWithRoles {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  actif: boolean;
  roles?: { role: { code: string; label: string } }[];
}

export default function AgentsListPage() {
  const { page, pageSize, setPage, queryParams } = usePagination();

  const { data, isLoading, isError } = useQuery<PaginatedResult<AgentWithRoles>>({
    queryKey: ["agents", queryParams],
    queryFn: () => api.get("/agents", queryParams),
  });

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Agents</h1>
        {data && (
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{data.total} agent{data.total !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* States */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0", color: "var(--ink-3)", fontSize: 13 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
          Chargement...
        </div>
      )}
      {isError && (
        <p style={{ fontSize: 13, color: "var(--rose)" }}>Erreur lors du chargement des agents.</p>
      )}

      {/* Table */}
      {data && (
        <>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Nom", "Prénom", "Email", "Statut", "Rôles"].map((h) => (
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
                    <td colSpan={5} style={{ padding: "48px 14px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                      Aucun agent trouvé
                    </td>
                  </tr>
                ) : (
                  data.data.map((row) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid var(--line-2)", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sunken)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "0 14px", height: 50, fontWeight: 500 }}>{row.nom}</td>
                      <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)" }}>{row.prenom}</td>
                      <td style={{ padding: "0 14px", height: 50, color: "var(--ink-2)", fontSize: 12, fontFamily: "ui-monospace, monospace" }}>{row.email}</td>
                      <td style={{ padding: "0 14px", height: 50 }}>
                        {row.actif ? (
                          <span className="pill c-emerald"><span className="dot" />Actif</span>
                        ) : (
                          <span className="pill c-rose"><span className="dot" />Inactif</span>
                        )}
                      </td>
                      <td style={{ padding: "0 14px", height: 50 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {row.roles && row.roles.length > 0 ? (
                            row.roles.map((ar) => (
                              <span key={ar.role.code} className="pill c-sky">
                                {ar.role.label}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "var(--ink-3)", fontSize: 12 }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
