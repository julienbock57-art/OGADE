import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type RefItem = { id: number; code: string; label: string; position: number; actif: boolean };

const typeLabels: Record<string, string> = {
  TYPE_END: "Types END",
  TYPE_MATERIEL: "Types de matériel",
  TYPE_TRADUCTEUR: "Types de traducteur",
  GROUPE: "Groupes",
  ETAT_MATERIEL: "États matériel",
  COMPLETUDE: "Complétude",
  MOTIF_PRET: "Motifs de prêt",
  LOT_CHAINE: "Lots / Chaînes",
  TYPE_MAQUETTE: "Types de maquette",
  COMPOSANT: "Composants",
  CATEGORIE: "Catégories",
  FORME: "Formes",
  TYPE_ASSEMBLAGE: "Types d'assemblage",
  MATIERE: "Matières",
  PROCEDURE: "Procédures",
  TYPE_CONTROLE: "Types de contrôle",
  ETAT_MAQUETTE: "États maquette",
  URGENCE: "Urgences",
};

export default function AdminReferentielTypePage() {
  const { type } = useParams<{ type: string }>();
  const queryClient = useQueryClient();

  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editPosition, setEditPosition] = useState(0);

  const { data: items, isLoading, isError: queryError, error: queryErr } = useQuery<RefItem[]>({
    queryKey: ["referentiels", type],
    queryFn: () => api.get("/referentiels", { type }),
    enabled: !!type,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["referentiels", type] });

  const createMut = useMutation({
    mutationFn: (body: { type: string; code: string; label: string }) =>
      api.post("/referentiels", body),
    onSuccess: () => {
      invalidate();
      setNewCode("");
      setNewLabel("");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: number; label: string; position: number }) =>
      api.patch(`/referentiels/${id}`, body),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/referentiels/${id}`),
    onSuccess: invalidate,
  });

  const startEdit = (item: RefItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditPosition(item.position);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newLabel.trim() || !type) return;
    createMut.mutate({ type, code: newCode.trim().toUpperCase(), label: newLabel.trim() });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    updateMut.mutate({ id: editingId, label: editLabel.trim(), position: editPosition });
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "var(--ink-3)",
    background: "var(--bg-panel)",
    borderBottom: "1px solid var(--line)",
    position: "sticky",
    top: 0,
  };

  const tdStyle: React.CSSProperties = {
    padding: "11px 14px",
    fontSize: 13,
    borderBottom: "1px solid var(--line-2)",
    color: "var(--ink)",
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Link
          to="/admin/referentiels"
          style={{ color: "var(--ink-3)", display: "flex", transition: "color 0.12s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-3)")}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 15.83L6.67 10l5.83-5.83" />
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            {typeLabels[type ?? ""] ?? type}
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2, marginBottom: 0 }}>
            {items ? `${items.length} valeur${items.length > 1 ? "s" : ""}` : "Chargement..."}
          </p>
        </div>
      </div>

      {/* Query error */}
      {queryError && (
        <div style={{ background: "var(--rose-soft)", border: "1px solid color-mix(in oklch, var(--rose) 30%, transparent)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--rose)", margin: 0 }}>Erreur de chargement</p>
          <p style={{ fontSize: 12, color: "var(--rose)", marginTop: 2, marginBottom: 0 }}>{(queryErr as Error)?.message}</p>
        </div>
      )}

      {/* Add form */}
      <form
        onSubmit={handleCreate}
        style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Code *</label>
            <input
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="oinput"
              placeholder="Ex: UT"
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Libellé *</label>
            <input
              type="text"
              required
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="oinput"
              placeholder="Ex: Ultrasons"
            />
          </div>
          <button
            type="submit"
            disabled={createMut.isPending}
            className="obtn accent"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 4.17v11.66M4.17 10h11.66" />
            </svg>
            Ajouter
          </button>
        </div>
        {createMut.isError && (
          <div style={{ marginTop: 10, background: "var(--rose-soft)", border: "1px solid color-mix(in oklch, var(--rose) 30%, transparent)", borderRadius: 8, padding: "8px 12px" }}>
            <p style={{ fontSize: 12, color: "var(--rose)", margin: 0 }}>{(createMut.error as Error).message}</p>
          </div>
        )}
      </form>

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: 40, background: "var(--bg-sunken)", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          </div>
        ) : (
          <table style={{ minWidth: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 48 }}>#</th>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Libellé</th>
                <th style={{ ...thStyle, width: 90 }}>Position</th>
                <th style={{ ...thStyle, width: 100, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "var(--ink-3)", padding: "40px 14px" }}>
                    Aucune valeur pour ce type.
                  </td>
                </tr>
              )}
              {(items ?? []).map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ transition: "background 0.1s" }}
                  onMouseEnter={(e) => { if (editingId !== item.id) (e.currentTarget as HTMLElement).style.background = "var(--bg-sunken)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  {editingId === item.id ? (
                    <>
                      <td style={{ ...tdStyle, color: "var(--ink-3)" }}>{idx + 1}</td>
                      <td style={{ ...tdStyle }}>
                        <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{item.code}</span>
                      </td>
                      <td style={{ ...tdStyle }}>
                        <form id={`edit-${item.id}`} onSubmit={handleUpdate}>
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="oinput"
                            autoFocus
                          />
                        </form>
                      </td>
                      <td style={{ ...tdStyle }}>
                        <input
                          type="number"
                          value={editPosition}
                          onChange={(e) => setEditPosition(Number(e.target.value))}
                          form={`edit-${item.id}`}
                          className="oinput"
                          style={{ width: 72 }}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                          <button
                            type="submit"
                            form={`edit-${item.id}`}
                            style={{
                              appearance: "none", border: "none", background: "none",
                              padding: 6, borderRadius: 7, color: "var(--emerald)",
                              cursor: "default", display: "flex",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--emerald-soft)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                            title="Enregistrer"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4.17 10.83l3.33 3.34 8.33-6.67" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            style={{
                              appearance: "none", border: "none", background: "none",
                              padding: 6, borderRadius: 7, color: "var(--ink-3)",
                              cursor: "default", display: "flex",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sunken)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                            title="Annuler"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 5l10 10M15 5L5 15" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...tdStyle, color: "var(--ink-3)" }}>{idx + 1}</td>
                      <td style={{ ...tdStyle }}>
                        <span className="tag mono">{item.code}</span>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--ink)" }}>{item.label}</td>
                      <td style={{ ...tdStyle, color: "var(--ink-3)" }}>{item.position}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                          <button
                            onClick={() => startEdit(item)}
                            style={{
                              appearance: "none", border: "none", background: "none",
                              padding: 6, borderRadius: 7, color: "var(--ink-3)",
                              cursor: "default", display: "flex", transition: "color 0.12s, background 0.12s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--accent-ink)";
                              e.currentTarget.style.background = "var(--accent-soft)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--ink-3)";
                              e.currentTarget.style.background = "none";
                            }}
                            title="Modifier"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9.17 4.17H4.17A1.67 1.67 0 002.5 5.83v10A1.67 1.67 0 004.17 17.5h10a1.67 1.67 0 001.66-1.67v-5m-1.16-7.83a1.67 1.67 0 012.36 2.36L9.58 12.5H7.5v-2.08l7.67-7.66z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer la valeur "${item.label}" ?`)) {
                                deleteMut.mutate(item.id);
                              }
                            }}
                            style={{
                              appearance: "none", border: "none", background: "none",
                              padding: 6, borderRadius: 7, color: "var(--ink-3)",
                              cursor: "default", display: "flex", transition: "color 0.12s, background 0.12s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--rose)";
                              e.currentTarget.style.background = "var(--rose-soft)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--ink-3)";
                              e.currentTarget.style.background = "none";
                            }}
                            title="Supprimer"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15.83 5.83l-.72 10.12a1.67 1.67 0 01-1.66 1.55H6.55a1.67 1.67 0 01-1.66-1.55L4.17 5.83M8.33 9.17v5m3.34-5v5m.83-8.34V3.33a.83.83 0 00-.83-.83H8.33a.83.83 0 00-.83.83v2.5M3.33 5.83h13.34" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
