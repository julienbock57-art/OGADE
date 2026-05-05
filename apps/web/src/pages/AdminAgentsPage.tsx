import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Agent, Role } from "@ogade/shared";

type AgentWithRoles = Omit<Agent, "roles"> & {
  roles: { roleId: number; role?: Role; grantedAt: string }[];
  hasPassword?: boolean;
};

type AgentForm = { email: string; nom: string; prenom: string };
const emptyForm: AgentForm = { email: "", nom: "", prenom: "" };

const rolePillClass: Record<string, string> = {
  ADMIN: "c-rose",
  GESTIONNAIRE_MAGASIN: "c-sky",
  REFERENT_LOGISTIQUE: "c-amber",
  REFERENT_MAQUETTE: "c-violet",
  REFERENT_MATERIEL: "c-emerald",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  GESTIONNAIRE_MAGASIN: "Gestionnaire magasin",
  REFERENT_LOGISTIQUE: "Référent logistique",
  REFERENT_MAQUETTE: "Référent maquette",
  REFERENT_MATERIEL: "Référent matériel",
};

const ALL_ROLES = [
  "ADMIN",
  "GESTIONNAIRE_MAGASIN",
  "REFERENT_LOGISTIQUE",
  "REFERENT_MAQUETTE",
  "REFERENT_MATERIEL",
];

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

export default function AdminAgentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AgentForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [managingRolesId, setManagingRolesId] = useState<number | null>(null);
  const [passwordAgentId, setPasswordAgentId] = useState<number | null>(null);
  const [sitesAgentId, setSitesAgentId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data, isLoading } = useQuery<{ data: AgentWithRoles[]; total: number }>({
    queryKey: ["agents"],
    queryFn: () => api.get("/agents", { pageSize: 100 }),
  });

  const { data: allSites } = useQuery<{ code: string; label: string }[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/sites"),
  });

  const { data: agentSites = [] } = useQuery<{ siteCode: string; agentId: number; grantedAt: string }[]>({
    queryKey: ["agent-magasinier-sites", sitesAgentId],
    queryFn: () => api.get(`/agents/${sitesAgentId}/magasinier-sites`),
    enabled: sitesAgentId != null,
  });

  const addSiteMut = useMutation({
    mutationFn: ({ id, siteCode }: { id: number; siteCode: string }) =>
      api.post(`/agents/${id}/magasinier-sites`, { siteCode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-magasinier-sites", sitesAgentId] }),
  });

  const removeSiteMut = useMutation({
    mutationFn: ({ id, siteCode }: { id: number; siteCode: string }) =>
      api.delete(`/agents/${id}/magasinier-sites/${siteCode}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-magasinier-sites", sitesAgentId] }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["agents"] });

  const set = (field: keyof AgentForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const createMut = useMutation({
    mutationFn: (body: AgentForm) => api.post("/agents", body),
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      setShowForm(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: AgentForm & { id: number }) =>
      api.patch(`/agents/${id}`, body),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) =>
      api.patch(`/agents/${id}`, { actif }),
    onSuccess: invalidate,
  });

  const assignRoleMut = useMutation({
    mutationFn: ({ id, roleCode }: { id: number; roleCode: string }) =>
      api.post(`/agents/${id}/roles`, { roleCode }),
    onSuccess: invalidate,
  });

  const removeRoleMut = useMutation({
    mutationFn: ({ id, roleCode }: { id: number; roleCode: string }) =>
      api.delete(`/agents/${id}/roles/${roleCode}`),
    onSuccess: invalidate,
  });

  const setPasswordMut = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.patch(`/agents/${id}/password`, { password }),
    onSuccess: () => {
      setPasswordAgentId(null);
      setNewPassword("");
    },
  });

  const removePasswordMut = useMutation({
    mutationFn: (id: number) => api.delete(`/agents/${id}/password`),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/agents/${id}`),
    onSuccess: invalidate,
  });

  const startEdit = (agent: AgentWithRoles) => {
    setEditingId(agent.id);
    setForm({ email: agent.email, nom: agent.nom, prenom: agent.prenom });
    setShowForm(true);
    setManagingRolesId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.nom.trim() || !form.prenom.trim()) return;
    if (editingId !== null) {
      updateMut.mutate({ id: editingId, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const agents = data?.data ?? [];
  const mutError = createMut.error || updateMut.error || deleteMut.error;

  const agentHasRole = (agent: AgentWithRoles, roleCode: string) =>
    agent.roles.some((r) => r.role?.code === roleCode);

  return (
    <div className="detail-page">
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
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Agents autorisés</h1>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2, marginBottom: 0 }}>
              {data ? `${data.total} agent${data.total > 1 ? "s" : ""}` : "Chargement..."}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(emptyForm);
            }}
            className="obtn accent"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 4.17v11.66M4.17 10h11.66" />
            </svg>
            Ajouter un agent
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 20px", marginBottom: 14 }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginBottom: 14 }}>
            {editingId ? "Modifier l'agent" : "Ajouter un agent autorisé"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>
                Email Microsoft *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="oinput"
                placeholder="prenom.nom@edf.fr"
                disabled={editingId !== null}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>
                Prénom *
              </label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => set("prenom", e.target.value)}
                className="oinput"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink-3)", marginBottom: 4 }}>
                Nom *
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                className="oinput"
              />
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

      {deleteMut.isError && (
        <div style={{ background: "var(--rose-soft)", border: "1px solid color-mix(in oklch, var(--rose) 30%, transparent)", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: "var(--rose)", margin: 0 }}>{(deleteMut.error as Error).message}</p>
        </div>
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
                  <th style={thStyle}>Agent</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Rôles</th>
                  <th style={{ ...thStyle, width: 80 }}>Statut</th>
                  <th style={{ ...thStyle, width: 120, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "var(--ink-3)", padding: "40px 14px" }}>
                      Aucun agent enregistré.
                    </td>
                  </tr>
                )}
                {agents.map((agent) => (
                  <tr key={agent.id} style={{ transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-sunken)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32,
                          background: "var(--accent-soft)", color: "var(--accent-ink)",
                          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 600, flexShrink: 0,
                        }}>
                          {agent.prenom[0]}{agent.nom[0]}
                        </div>
                        <div style={{ fontWeight: 500, color: "var(--ink)" }}>
                          {agent.prenom} {agent.nom}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: "var(--ink-2)" }}>{agent.email}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {agent.roles.length === 0 && (
                          <span style={{ fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>Aucun rôle</span>
                        )}
                        {agent.roles.map((r) => (
                          <span
                            key={r.role?.code ?? r.roleId}
                            className={`pill ${rolePillClass[r.role?.code ?? ""] ?? "c-neutral"}`}
                          >
                            <span className="dot" />
                            {roleLabels[r.role?.code ?? ""] ?? r.role?.code ?? ""}
                          </span>
                        ))}
                      </div>

                      {/* Role management panel */}
                      {managingRolesId === agent.id && (
                        <div style={{
                          marginTop: 10, padding: "10px 12px",
                          background: "var(--bg-sunken)", borderRadius: 9,
                          border: "1px solid var(--line)",
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", marginBottom: 8, marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Gérer les rôles
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {ALL_ROLES.map((roleCode) => {
                              const has = agentHasRole(agent, roleCode);
                              return (
                                <button
                                  key={roleCode}
                                  onClick={() => {
                                    if (has) {
                                      removeRoleMut.mutate({ id: agent.id, roleCode });
                                    } else {
                                      assignRoleMut.mutate({ id: agent.id, roleCode });
                                    }
                                  }}
                                  style={{
                                    appearance: "none",
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "4px 10px", borderRadius: 999,
                                    fontSize: 11.5, fontWeight: 500,
                                    cursor: "default", transition: "all 0.12s",
                                    background: has ? "var(--accent)" : "var(--bg-panel)",
                                    color: has ? "white" : "var(--ink-2)",
                                    border: has ? "1px solid var(--accent)" : "1px solid var(--line)",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!has) {
                                      e.currentTarget.style.borderColor = "var(--accent-line)";
                                      e.currentTarget.style.color = "var(--accent-ink)";
                                    } else {
                                      e.currentTarget.style.background = "var(--accent-ink)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!has) {
                                      e.currentTarget.style.borderColor = "var(--line)";
                                      e.currentTarget.style.color = "var(--ink-2)";
                                    } else {
                                      e.currentTarget.style.background = "var(--accent)";
                                    }
                                  }}
                                >
                                  {has && (
                                    <svg width="12" height="12" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M4.17 10.83l3.33 3.34 8.33-6.67" />
                                    </svg>
                                  )}
                                  {roleLabels[roleCode] ?? roleCode}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Password panel */}
                      {passwordAgentId === agent.id && (
                        <div style={{
                          marginTop: 10, padding: "10px 12px",
                          background: "var(--amber-soft)", borderRadius: 9,
                          border: "1px solid color-mix(in oklch, var(--amber) 30%, transparent)",
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", marginBottom: 8, marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Mot de passe local
                          </p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Nouveau mot de passe (min 6 car.)"
                              className="oinput"
                              style={{ flex: 1, padding: "6px 10px", fontSize: 12 }}
                            />
                            <button
                              onClick={() => {
                                if (newPassword.length >= 6) {
                                  setPasswordMut.mutate({ id: agent.id, password: newPassword });
                                }
                              }}
                              disabled={newPassword.length < 6 || setPasswordMut.isPending}
                              style={{
                                appearance: "none",
                                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                                background: "var(--amber)", color: "white",
                                border: "1px solid var(--amber)", cursor: "default",
                                opacity: newPassword.length < 6 || setPasswordMut.isPending ? 0.45 : 1,
                              }}
                            >
                              Enregistrer
                            </button>
                          </div>
                          {setPasswordMut.isError && (
                            <p style={{ fontSize: 12, color: "var(--rose)", marginTop: 6, marginBottom: 0 }}>
                              {(setPasswordMut.error as Error).message}
                            </p>
                          )}
                          {agent.hasPassword && (
                            <button
                              onClick={() => {
                                if (confirm("Supprimer le mot de passe local ?")) {
                                  removePasswordMut.mutate(agent.id);
                                }
                              }}
                              style={{
                                appearance: "none", background: "none", border: "none",
                                marginTop: 8, fontSize: 12, color: "var(--rose)", cursor: "default",
                                padding: 0,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                            >
                              Supprimer le mot de passe local
                            </button>
                          )}
                        </div>
                      )}

                      {/* Magasinier sites panel */}
                      {sitesAgentId === agent.id && (
                        <div style={{
                          marginTop: 10, padding: "10px 12px",
                          background: "var(--bg-sunken)", borderRadius: 9,
                          border: "1px solid var(--line)",
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", marginBottom: 8, marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Sites magasinier
                          </p>
                          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 10px" }}>
                            Cocher les sites pour lesquels cet agent est magasinier (rôle GESTIONNAIRE_MAGASIN ou REFERENT_LOGISTIQUE recommandé).
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {(allSites ?? []).map((site) => {
                              const has = agentSites.some((s) => s.siteCode === site.code);
                              const pending = addSiteMut.isPending || removeSiteMut.isPending;
                              return (
                                <button
                                  key={site.code}
                                  type="button"
                                  disabled={pending}
                                  onClick={() => {
                                    if (has) removeSiteMut.mutate({ id: agent.id, siteCode: site.code });
                                    else addSiteMut.mutate({ id: agent.id, siteCode: site.code });
                                  }}
                                  style={{
                                    appearance: "none",
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "4px 10px", borderRadius: 999,
                                    fontSize: 11.5, fontWeight: 500,
                                    cursor: pending ? "wait" : "pointer", transition: "all 0.12s",
                                    background: has ? "var(--accent)" : "var(--bg-panel)",
                                    color: has ? "white" : "var(--ink-2)",
                                    border: has ? "1px solid var(--accent)" : "1px solid var(--line)",
                                  }}
                                >
                                  {has && (
                                    <svg width="12" height="12" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M4.17 10.83l3.33 3.34 8.33-6.67" />
                                    </svg>
                                  )}
                                  {site.label}
                                </button>
                              );
                            })}
                            {(allSites ?? []).length === 0 && (
                              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                                Aucun site disponible — créez-en dans <Link to="/admin/sites" style={{ color: "var(--accent)" }}>Référentiels &gt; Sites</Link>
                              </span>
                            )}
                          </div>
                          {(addSiteMut.isError || removeSiteMut.isError) && (
                            <p style={{ marginTop: 8, color: "var(--rose)", fontSize: 12 }}>
                              {((addSiteMut.error ?? removeSiteMut.error) as Error)?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => toggleActiveMut.mutate({ id: agent.id, actif: !agent.actif })}
                        className={`pill ${agent.actif ? "c-emerald" : "c-rose"}`}
                        style={{ border: "none", cursor: "default", appearance: "none", fontFamily: "inherit", fontSize: "inherit" }}
                      >
                        <span className="dot" />
                        {agent.actif ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                        {/* Manage roles */}
                        <button
                          onClick={() => setManagingRolesId(managingRolesId === agent.id ? null : agent.id)}
                          style={{
                            appearance: "none", border: "none",
                            background: managingRolesId === agent.id ? "var(--accent-soft)" : "none",
                            padding: 6, borderRadius: 7,
                            color: managingRolesId === agent.id ? "var(--accent-ink)" : "var(--ink-3)",
                            cursor: "default", display: "flex", transition: "color 0.12s, background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (managingRolesId !== agent.id) {
                              e.currentTarget.style.color = "var(--accent-ink)";
                              e.currentTarget.style.background = "var(--accent-soft)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (managingRolesId !== agent.id) {
                              e.currentTarget.style.color = "var(--ink-3)";
                              e.currentTarget.style.background = "none";
                            }
                          }}
                          title="Gérer les rôles"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7.5 10l1.67 1.67 3.33-5.56m4.68-3.35a9.96 9.96 0 01-7.18 2.54A10.02 10.02 0 012.5 7.5c0 4.66 3.19 8.58 7.5 9.69 4.31-1.11 7.5-5.03 7.5-9.69 0-.87-.11-1.71-.32-2.52z" />
                          </svg>
                        </button>

                        {/* Password */}
                        <button
                          onClick={() => {
                            setPasswordAgentId(passwordAgentId === agent.id ? null : agent.id);
                            setNewPassword("");
                          }}
                          style={{
                            appearance: "none", border: "none",
                            background: passwordAgentId === agent.id ? "var(--amber-soft)" : "none",
                            padding: 6, borderRadius: 7,
                            color: passwordAgentId === agent.id ? "var(--amber)" : "var(--ink-3)",
                            cursor: "default", display: "flex", transition: "color 0.12s, background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (passwordAgentId !== agent.id) {
                              e.currentTarget.style.color = "var(--amber)";
                              e.currentTarget.style.background = "var(--amber-soft)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (passwordAgentId !== agent.id) {
                              e.currentTarget.style.color = "var(--ink-3)";
                              e.currentTarget.style.background = "none";
                            }
                          }}
                          title="Mot de passe"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.5 5.83a1.67 1.67 0 011.67 1.67m3.33 0a5 5 0 01-6.45 4.79L9.17 14.17H7.5V15.83H5.83V17.5H3.33a.83.83 0 01-.83-.83v-2.15a.83.83 0 01.24-.59l4.97-4.97A5 5 0 1117.5 7.5z" />
                          </svg>
                        </button>

                        {/* Magasinier sites */}
                        <button
                          onClick={() => setSitesAgentId(sitesAgentId === agent.id ? null : agent.id)}
                          style={{
                            appearance: "none", border: "none",
                            background: sitesAgentId === agent.id ? "var(--accent-soft)" : "none",
                            padding: 6, borderRadius: 7,
                            color: sitesAgentId === agent.id ? "var(--accent-ink)" : "var(--ink-3)",
                            cursor: "default", display: "flex", transition: "color 0.12s, background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (sitesAgentId !== agent.id) {
                              e.currentTarget.style.color = "var(--accent-ink)";
                              e.currentTarget.style.background = "var(--accent-soft)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (sitesAgentId !== agent.id) {
                              e.currentTarget.style.color = "var(--ink-3)";
                              e.currentTarget.style.background = "none";
                            }
                          }}
                          title="Sites magasinier"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 5h10v9H2z M12 8h4l2 3v3h-6 M5 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3 M14 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => startEdit(agent)}
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

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer l'agent "${agent.prenom} ${agent.nom}" ? Cette action est irréversible.`)) {
                              deleteMut.mutate(agent.id);
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
