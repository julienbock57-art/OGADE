import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EntrepriseValue } from "@/hooks/use-referentiels";

type EntrepriseForm = { code: string; label: string; type: string; adresse: string; codePostal: string; ville: string; pays: string; telephone: string; email: string; siret: string };

const empty: EntrepriseForm = { code: "", label: "", type: "ENTREPRISE", adresse: "", codePostal: "", ville: "", pays: "France", telephone: "", email: "", siret: "" };

const inputClass = "px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors w-full";
const selectClass = inputClass + " appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8";

const typeBadge: Record<string, { bg: string; text: string }> = {
  ENTREPRISE: { bg: "bg-blue-100", text: "text-blue-700" },
  FOURNISSEUR: { bg: "bg-amber-100", text: "text-amber-700" },
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
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/referentiels" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Entreprises et fournisseurs</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {entreprises ? `${entreprises.length} enregistrement${entreprises.length > 1 ? "s" : ""}` : "Chargement..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/30"
          >
            <option value="">Tous les types</option>
            <option value="ENTREPRISE">Entreprises</option>
            <option value="FOURNISSEUR">Fournisseurs</option>
          </select>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(empty); }}
              className="inline-flex items-center gap-2 bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h3 className="text-sm font-semibold text-edf-blue mb-4">
            {editingId ? "Modifier" : "Ajouter une entreprise / fournisseur"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Code *</label>
              <input type="text" value={form.code} onChange={(e) => set("code", e.target.value)} className={inputClass} placeholder="EDF" disabled={editingId !== null} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
              <input type="text" value={form.label} onChange={(e) => set("label", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={selectClass}>
                <option value="ENTREPRISE">Entreprise</option>
                <option value="FOURNISSEUR">Fournisseur</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
              <input type="text" value={form.adresse} onChange={(e) => set("adresse", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Code postal</label>
              <input type="text" value={form.codePostal} onChange={(e) => set("codePostal", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
              <input type="text" value={form.ville} onChange={(e) => set("ville", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pays</label>
              <input type="text" value={form.pays} onChange={(e) => set("pays", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">SIRET</label>
              <input type="text" value={form.siret} onChange={(e) => set("siret", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
              <input type="text" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </div>
          </div>
          {mutError && <p className="text-xs text-red-600 mt-3">{(mutError as Error).message}</p>}
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="bg-edf-blue text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50">
              {editingId ? "Enregistrer" : "Ajouter"}
            </button>
            <button type="button" onClick={cancelForm} className="bg-white text-gray-600 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8"><div className="animate-pulse space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ville</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SIRET</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Aucune entreprise.</td></tr>
                )}
                {filtered.map((ent) => {
                  const badge = typeBadge[ent.type] ?? typeBadge.ENTREPRISE;
                  return (
                    <tr key={ent.id} className={`hover:bg-gray-50/50 transition-colors ${editingId === ent.id ? "bg-edf-blue/5" : ""}`}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{ent.code}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{ent.label}</div>
                        {ent.adresse && <div className="text-xs text-gray-400">{ent.adresse}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {ent.type === "FOURNISSEUR" ? "Fournisseur" : "Entreprise"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {ent.ville ?? "—"}
                        {ent.pays && ent.pays !== "France" && <span className="text-xs text-gray-400 ml-1">({ent.pays})</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{ent.siret || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEdit(ent)}
                          className="p-1.5 text-gray-400 hover:text-edf-blue hover:bg-edf-blue/5 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
