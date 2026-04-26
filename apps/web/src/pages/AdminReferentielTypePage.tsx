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

  const inputClass = "px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors";

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/referentiels"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {typeLabels[type ?? ""] ?? type}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items ? `${items.length} valeur${items.length > 1 ? "s" : ""}` : "Chargement..."}
          </p>
        </div>
      </div>

      {/* Query error */}
      {queryError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-700 font-medium">Erreur de chargement</p>
          <p className="text-xs text-red-600 mt-1">{(queryErr as Error)?.message}</p>
        </div>
      )}

      {/* Add form */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Code</label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className={inputClass + " w-full"}
              placeholder="CODE_VALEUR"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Libellé</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className={inputClass + " w-full"}
              placeholder="Libellé de la valeur"
            />
          </div>
          <button
            type="submit"
            disabled={createMut.isPending || !newCode.trim() || !newLabel.trim()}
            className="inline-flex items-center gap-2 bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        </div>
        {createMut.isError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{(createMut.error as Error).message}</p>
          </div>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Libellé
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  Position
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(items ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                    Aucune valeur pour ce type.
                  </td>
                </tr>
              )}
              {(items ?? []).map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  {editingId === item.id ? (
                    <>
                      <td className="px-4 py-2 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 font-mono">{item.code}</td>
                      <td className="px-4 py-2">
                        <form id={`edit-${item.id}`} onSubmit={handleUpdate}>
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className={inputClass + " w-full"}
                            autoFocus
                          />
                        </form>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editPosition}
                          onChange={(e) => setEditPosition(Number(e.target.value))}
                          form={`edit-${item.id}`}
                          className={inputClass + " w-20"}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="submit"
                            form={`edit-${item.id}`}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Enregistrer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Annuler"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.label}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{item.position}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-edf-blue hover:bg-edf-blue/5 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer la valeur "${item.label}" ?`)) {
                                deleteMut.mutate(item.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
