import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Agent, Role } from "@ogade/shared";
import Badge from "@/components/Badge";

type AgentWithRoles = Agent & {
  roles: { role: Role; grantedAt: string }[];
};

type AgentForm = { email: string; nom: string; prenom: string };
const emptyForm: AgentForm = { email: "", nom: "", prenom: "" };

const roleBadgeVariant: Record<string, string> = {
  ADMIN: "danger",
  GESTIONNAIRE_MAGASIN: "info",
  REFERENT_LOGISTIQUE: "warning",
  REFERENT_MAQUETTE: "purple",
  REFERENT_MATERIEL: "success",
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

const inputClass =
  "px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors w-full";

export default function AdminAgentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AgentForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [managingRolesId, setManagingRolesId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ data: AgentWithRoles[]; total: number }>({
    queryKey: ["agents"],
    queryFn: () => api.get("/agents", { pageSize: 100 }),
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
  const mutError = createMut.error || updateMut.error;

  const agentHasRole = (agent: AgentWithRoles, roleCode: string) =>
    agent.roles.some((r) => r.role.code === roleCode);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/referentiels"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Agents autorisés</h1>
            <p className="text-sm text-gray-500 mt-0.5">
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
            className="inline-flex items-center gap-2 bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un agent
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4"
        >
          <h3 className="text-sm font-semibold text-edf-blue mb-4">
            {editingId ? "Modifier l'agent" : "Ajouter un agent autorisé"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Email Microsoft *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass}
                placeholder="prenom.nom@edf.fr"
                disabled={editingId !== null}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => set("prenom", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {mutError && (
            <p className="text-xs text-red-600 mt-3">{(mutError as Error).message}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-edf-blue text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50"
            >
              {editingId ? "Enregistrer" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rôles
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                      Aucun agent enregistré.
                    </td>
                  </tr>
                )}
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-edf-blue/10 text-edf-blue rounded-full flex items-center justify-center text-xs font-semibold">
                          {agent.prenom[0]}
                          {agent.nom[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {agent.prenom} {agent.nom}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{agent.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {agent.roles.length === 0 && (
                          <span className="text-xs text-gray-400 italic">Aucun rôle</span>
                        )}
                        {agent.roles.map((r) => (
                          <Badge
                            key={r.role.code}
                            variant={roleBadgeVariant[r.role.code] ?? "default"}
                            text={roleLabels[r.role.code] ?? r.role.code}
                          />
                        ))}
                      </div>
                      {/* Role management panel */}
                      {managingRolesId === agent.id && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            Gérer les rôles :
                          </p>
                          <div className="flex flex-wrap gap-2">
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
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                    has
                                      ? "bg-edf-blue text-white"
                                      : "bg-white text-gray-500 border border-gray-200 hover:border-edf-blue hover:text-edf-blue"
                                  }`}
                                >
                                  {has && (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {roleLabels[roleCode] ?? roleCode}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          toggleActiveMut.mutate({
                            id: agent.id,
                            actif: !agent.actif,
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          agent.actif
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {agent.actif ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setManagingRolesId(
                              managingRolesId === agent.id ? null : agent.id,
                            )
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            managingRolesId === agent.id
                              ? "text-edf-blue bg-edf-blue/10"
                              : "text-gray-400 hover:text-edf-blue hover:bg-edf-blue/5"
                          }`}
                          title="Gérer les rôles"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => startEdit(agent)}
                          className="p-1.5 text-gray-400 hover:text-edf-blue hover:bg-edf-blue/5 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
