import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SiteValue } from "@/hooks/use-referentiels";

type SiteForm = { code: string; label: string; adresse: string; codePostal: string; ville: string; pays: string; telephone: string; email: string };

const empty: SiteForm = { code: "", label: "", adresse: "", codePostal: "", ville: "", pays: "France", telephone: "", email: "" };

const inputClass = "px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors w-full";

export default function AdminSitesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SiteForm>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: sites, isLoading } = useQuery<(SiteValue & { id: number })[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/sites"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["sites"] });

  const set = (field: keyof SiteForm, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const createMut = useMutation({
    mutationFn: (body: SiteForm) => api.post("/sites", body),
    onSuccess: () => {
      invalidate();
      setForm(empty);
      setShowForm(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: SiteForm & { id: number }) => api.patch(`/sites/${id}`, body),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setForm(empty);
    },
  });

  const startEdit = (site: SiteValue & { id: number }) => {
    setEditingId(site.id);
    setForm({
      code: site.code,
      label: site.label,
      adresse: site.adresse ?? "",
      codePostal: site.codePostal ?? "",
      ville: site.ville ?? "",
      pays: site.pays ?? "France",
      telephone: site.telephone ?? "",
      email: site.email ?? "",
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

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Sites</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {sites ? `${sites.length} site${sites.length > 1 ? "s" : ""}` : "Chargement..."}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(empty); }}
            className="inline-flex items-center gap-2 bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau site
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h3 className="text-sm font-semibold text-edf-blue mb-4">
            {editingId ? "Modifier le site" : "Ajouter un site"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Code *</label>
              <input type="text" value={form.code} onChange={(e) => set("code", e.target.value)} className={inputClass} placeholder="CNPE_XXX" disabled={editingId !== null} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
              <input type="text" value={form.label} onChange={(e) => set("label", e.target.value)} className={inputClass} placeholder="Nom du site" />
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Adresse</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ville</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(sites ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Aucun site.</td></tr>
                )}
                {(sites ?? []).map((site) => (
                  <tr key={site.id} className={`hover:bg-gray-50/50 transition-colors ${editingId === site.id ? "bg-edf-blue/5" : ""}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{site.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{site.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {site.adresse ? (
                        <span>{site.adresse}{site.codePostal ? `, ${site.codePostal}` : ""}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {site.ville ?? "—"}
                      {site.pays && site.pays !== "France" && <span className="text-xs text-gray-400 ml-1">({site.pays})</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {site.telephone || site.email ? (
                        <div>
                          {site.telephone && <div className="text-xs">{site.telephone}</div>}
                          {site.email && <div className="text-xs text-gray-400">{site.email}</div>}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(site)}
                        className="p-1.5 text-gray-400 hover:text-edf-blue hover:bg-edf-blue/5 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
