import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EntrepriseValue } from "@/hooks/use-referentiels";

type EntrepriseForm = { code: string; label: string; type: string; adresse: string; codePostal: string; ville: string; pays: string; telephone: string; email: string; siret: string };

const empty: EntrepriseForm = { code: "", label: "", type: "ENTREPRISE", adresse: "", codePostal: "", ville: "", pays: "France", telephone: "", email: "", siret: "" };

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

export default function AdminEntreprisesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EntrepriseForm>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState("");

  const { data: entreprises, isLoading } = useQuery<(EntrepriseValue & { id: number })[]>({
    queryKey: ["entreprises"],
    queryFn: () => api.get("/entreprises"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["entreprises"] });

  const set = (field: keyof EntrepriseForm, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const createMut = useMutation({
    mutationFn: (body: EntrepriseForm) => api.post("/entreprises", body),
    onSuccess: () => { invalidate(); setForm(empty); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: EntrepriseForm & { id: number }) => api.patch(`/entreprises/${id}`, body),
    onSuccess: () => { invalidate(); setEditingId(null); setForm(empty); },
  });

  const startEdit = (ent: EntrepriseValue & { id: number }) => {
    setEditingId(ent.id);
    setForm({
      code: ent.code,
      label: ent.label,
      type: ent.type ?? "ENTREPRISE",
      adresse: ent.adresse ?? "",
      codePostal: ent.codePostal ?? "",
      ville: ent.ville ?? "",
      pays: ent.pays ?? "France",
      telephone: ent.telephone ?? "",
      email: ent.email ?? "",
      siret: ent.siret ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.label.trim()) return;
    if (editingId !== null) {
      updateMut.mutate({ id: editingId, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(empty); };

  const filtered = (entreprises ?? []).filter((e) => !filterType || e.type === filterType);
  const mutError = createMut.error || updateMut.error;

  return (
    <div style={{ padding: "22px 28px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Entreprises et fournisseurs</h1>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2, marginBottom: 0 }}>
              {entreprises ? `${entreprises.length} enregistrement${entreprises.length > 1 ? "s" : ""}` : "Chargement..."}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="oselect"
            style={{ width: "auto", paddingRight: 28 }}
          >
            <option value="">Tous les types</option>
            <option value="ENTREPRISE">Entreprises</option>
            <option value="FOURNISSEUR">Fournisseurs</option>
          </select>
          {!showForm && (
            <button
              type="button"
              onClick={() => { setShowForm(true); setEditingId(null); setForm(empty); }}
              className="obtn accent"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 4.17v11.66M4.17 10h11.66" />
              </svg>
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginBottom: 14 }}>
            {editingId ? "Modifier" : "Ajouter une entreprise / fournisseur"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Code *</label>
              <input type="text" value={form.code} onChange={(e) => set("code", e.target.value)} className="oinput" placeholder="EDF" disabled={editingId !== null} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Nom *</label>
              <input type="text" value={form.label} onChange={(e) => set("label", e.target.value)} className="oinput" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className="oselect">
                <option value="ENTREPRISE">Entreprise</option>
                <option value="FOURNISSEUR">Fournisseur</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Adresse</label>
              <input type="text" value={form.adresse} onChange={(e) => set("adresse", e.target.value)} className="oinput" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Code postal</label>
              <input type="text" value={form.codePostal} onChange={(e) => set("codePostal", e.target.value)} className="oinput" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Ville</label>
              <input type="text" value={form.ville} onChange={(e) => set("ville", e.target.value)} className="oinput" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Pays</label>
              <input type="text" value={form.pays} onChange={(e) => set("pays", e.target.value)} className="oinput" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>SIRET</label>
              <input type="text" value={form.siret} onChange={(e) => set("siret", e.target.value)} className="oinput" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Téléphone</label>
              <input type="text" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} className="oinput" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="oinput" />
            </div>
          </div>
          {mutError && (
            <p style={{ fontSize: 12, color: "var(--rose)", marginTop: 10, marginBottom: 0 }}>{(mutError as Error).message}</p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="obtn accent"
            >
              {editingId ? "Enregistrer" : "Ajouter"}
            </button>
            <button type="button" onClick={cancelForm} className="obtn">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 44, background: "var(--bg-sunken)", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Nom</th>
                  <th style={{ ...thStyle, width: 120 }}>Type</th>
                  <th style={thStyle}>Ville</th>
                  <th style={thStyle}>SIRET</th>
                  <th style={{ ...thStyle, width: 64, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "var(--ink-3)", padding: "40px 14px" }}>
                      Aucune entreprise.
                    </td>
                  </tr>
                )}
                {filtered.map((ent) => (
                  <tr
                    key={ent.id}
                    style={{ background: editingId === ent.id ? "var(--accent-soft)" : undefined, transition: "background 0.1s" }}
                    onMouseEnter={(e) => { if (editingId !== ent.id) (e.currentTarget as HTMLElement).style.background = "var(--bg-sunken)"; }}
                    onMouseLeave={(e) => { if (editingId !== ent.id) (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <td style={tdStyle}>
                      <span className="tag mono">{ent.code}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: "var(--ink)" }}>{ent.label}</div>
                      {ent.adresse && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{ent.adresse}</div>}
                    </td>
                    <td style={tdStyle}>
                      {ent.type === "FOURNISSEUR" ? (
                        <span className="pill c-amber">
                          <span className="dot" />
                          Fournisseur
                        </span>
                      ) : (
                        <span className="pill c-sky">
                          <span className="dot" />
                          Entreprise
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: "var(--ink-2)" }}>
                      {ent.ville ?? <span style={{ color: "var(--ink-4)" }}>—</span>}
                      {ent.pays && ent.pays !== "France" && (
                        <span style={{ fontSize: 11, color: "var(--ink-4)", marginLeft: 4 }}>({ent.pays})</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span className="mono" style={{ fontSize: 12, color: ent.siret ? "var(--ink-2)" : "var(--ink-4)" }}>
                        {ent.siret || "—"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => startEdit(ent)}
                        style={{
                          appearance: "none", border: "none", background: "none",
                          padding: 6, borderRadius: 7, color: "var(--ink-3)",
                          cursor: "pointer", display: "inline-flex", transition: "color 0.12s, background 0.12s",
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
