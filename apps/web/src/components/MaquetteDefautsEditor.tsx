import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Defaut } from "@ogade/shared";
import { api } from "@/lib/api";
import { useReferentiel } from "@/hooks/use-referentiels";
import { defautColor } from "@/lib/maquette-helpers";

const ICONS: Record<string, string> = {
  plus:  "M10 4v12M4 10h12",
  edit:  "M12 4l4 4-8 8H4v-4l8-8z",
  trash: "M5 6h10 M8 6V4h4v2 M6 6v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6",
  x:     "M5 5l10 10M15 5L5 15",
  check: "M4 10l4 4 8-8",
};
function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const d = ICONS[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

type EditableDefaut = {
  id?: number;
  typeDefaut: string;
  position?: string;
  longueur?: number;
  largeur?: number;
  profondeur?: number;
  diametre?: number;
  cote?: string;
  certifie?: boolean;
  posX?: number;
  posY?: number;
  description?: string;
};

const empty: EditableDefaut = {
  typeDefaut: "",
  position: "",
  longueur: undefined,
  largeur: undefined,
  profondeur: undefined,
  diametre: undefined,
  cote: "",
  certifie: false,
  posX: undefined,
  posY: undefined,
  description: "",
};

export default function MaquetteDefautsEditor({ maquetteId }: { maquetteId: number }) {
  const qc = useQueryClient();
  const { data: typesDefaut } = useReferentiel("TYPE_DEFAUT");
  const [editing, setEditing] = useState<EditableDefaut | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: defauts = [], isLoading } = useQuery<Defaut[]>({
    queryKey: ["maquette-defauts", maquetteId],
    queryFn: () => api.get(`/maquettes/${maquetteId}/defauts`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["maquette-defauts", maquetteId] });
    qc.invalidateQueries({ queryKey: ["maquettes", String(maquetteId)] });
    qc.invalidateQueries({ queryKey: ["maquettes"] });
  };

  const createMut = useMutation({
    mutationFn: (data: any) =>
      api.post<Defaut>(`/maquettes/${maquetteId}/defauts`, data),
    onSuccess: () => { invalidate(); setEditing(null); setError(null); },
    onError: (e: Error) => setError(e.message ?? "Erreur lors de la création"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.patch<Defaut>(`/maquettes/${maquetteId}/defauts/${id}`, data),
    onSuccess: () => { invalidate(); setEditing(null); setError(null); },
    onError: (e: Error) => setError(e.message ?? "Erreur lors de la mise à jour"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/maquettes/${maquetteId}/defauts/${id}`),
    onSuccess: invalidate,
  });

  const submit = () => {
    if (!editing) return;
    if (!editing.typeDefaut) {
      setError("Le type de défaut est requis");
      return;
    }
    setError(null);
    const payload = {
      typeDefaut: editing.typeDefaut,
      position: editing.position || undefined,
      longueur: editing.longueur,
      largeur: editing.largeur,
      profondeur: editing.profondeur,
      diametre: editing.diametre,
      cote: editing.cote || undefined,
      certifie: !!editing.certifie,
      posX: editing.posX,
      posY: editing.posY,
      description: editing.description || undefined,
    };
    if (editing.id) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const startEdit = (d: Defaut) => {
    setEditing({
      id: d.id,
      typeDefaut: d.typeDefaut,
      position: d.position ?? "",
      longueur: d.longueur ?? undefined,
      largeur: d.largeur ?? undefined,
      profondeur: d.profondeur ?? undefined,
      diametre: d.diametre ?? undefined,
      cote: d.cote ?? "",
      certifie: !!d.certifie,
      posX: d.posX ?? undefined,
      posY: d.posY ?? undefined,
      description: d.description ?? "",
    });
    setError(null);
  };

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Défauts artificiels</h3>
          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "2px 0 0" }}>
            {isLoading ? "Chargement…" : `${defauts.length} défaut${defauts.length > 1 ? "s" : ""} enregistré${defauts.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          className="obtn accent sm"
          onClick={() => { setEditing({ ...empty }); setError(null); }}
        >
          <Icon name="plus" size={11} />
          Ajouter un défaut
        </button>
      </div>

      <div className="defects-sub">
        <table className="defects">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Type</th>
              <th>Position</th>
              <th style={{ width: 70 }}>L (mm)</th>
              <th style={{ width: 70 }}>l (mm)</th>
              <th style={{ width: 80 }}>Profond.</th>
              <th style={{ width: 70 }}>Ø (mm)</th>
              <th>Côté</th>
              <th style={{ width: 80 }}>Statut</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {defauts.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 28, color: "var(--ink-3)", fontSize: 12.5 }}>
                  Aucun défaut enregistré pour cette maquette.
                </td>
              </tr>
            ) : (
              defauts.map((d, idx) => (
                <tr key={d.id}>
                  <td className="mono" style={{ color: "var(--ink-3)" }}>D{idx + 1}</td>
                  <td>
                    <span
                      className="defect-pill"
                      style={{ ["--def-color" as string]: defautColor(d.couleur ?? d.typeDefaut) } as React.CSSProperties}
                    >
                      {d.typeDefaut}
                    </span>
                  </td>
                  <td className="mono xs">{d.position ?? "—"}</td>
                  <td>{d.longueur ?? "—"}</td>
                  <td>{d.largeur ?? "—"}</td>
                  <td>{d.profondeur ?? "—"}</td>
                  <td>{d.diametre ?? "—"}</td>
                  <td className="xs">{d.cote ?? "—"}</td>
                  <td>
                    {d.certifie ? (
                      <span className="tag" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>Certifié</span>
                    ) : (
                      <span className="tag" style={{ background: "var(--amber-soft)", color: "oklch(0.50 0.17 60)" }}>À vérifier</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Modifier"
                        onClick={() => startEdit(d)}
                      >
                        <Icon name="edit" size={12} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Supprimer"
                        style={{ color: "var(--rose)" }}
                        onClick={() => {
                          if (confirm(`Supprimer le défaut « ${d.typeDefaut} » ?`)) {
                            deleteMut.mutate(d.id);
                          }
                        }}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inline editor */}
      {editing && (
        <div className="prop-card" style={{ borderColor: "var(--accent-line)", background: "var(--accent-soft)" }}>
          <div className="h">
            {editing.id ? "Modifier le défaut" : "Nouveau défaut"}
            <span style={{ flex: 1 }} />
            <button
              type="button"
              className="icon-btn"
              onClick={() => { setEditing(null); setError(null); }}
              aria-label="Fermer"
            >
              <Icon name="x" size={13} />
            </button>
          </div>

          <div className="form-grid two">
            <div className="field">
              <label className="field-label">Type de défaut *</label>
              <select
                className="oselect"
                value={editing.typeDefaut}
                onChange={(e) => setEditing({ ...editing, typeDefaut: e.target.value })}
              >
                <option value="">— Sélectionner —</option>
                {(typesDefaut ?? []).map((t) => (
                  <option key={t.code} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Position (texte libre)</label>
              <input
                type="text"
                className="oinput mono"
                value={editing.position ?? ""}
                onChange={(e) => setEditing({ ...editing, position: e.target.value })}
                placeholder="ex. X120 Y45 Z3"
              />
            </div>
            <div className="field">
              <label className="field-label">Longueur (mm)</label>
              <input
                type="number"
                step="any"
                className="oinput"
                value={editing.longueur ?? ""}
                onChange={(e) => setEditing({ ...editing, longueur: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label className="field-label">Largeur (mm)</label>
              <input
                type="number"
                step="any"
                className="oinput"
                value={editing.largeur ?? ""}
                onChange={(e) => setEditing({ ...editing, largeur: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label className="field-label">Profondeur (mm)</label>
              <input
                type="number"
                step="any"
                className="oinput"
                value={editing.profondeur ?? ""}
                onChange={(e) => setEditing({ ...editing, profondeur: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label className="field-label">Diamètre (mm)</label>
              <input
                type="number"
                step="any"
                className="oinput"
                value={editing.diametre ?? ""}
                onChange={(e) => setEditing({ ...editing, diametre: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label className="field-label">Côté</label>
              <input
                type="text"
                className="oinput"
                value={editing.cote ?? ""}
                onChange={(e) => setEditing({ ...editing, cote: e.target.value })}
                placeholder="Ex. extérieur, intérieur, racine…"
              />
            </div>
            <div className="field">
              <label className="field-label">Plan — pos X (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                className="oinput"
                value={editing.posX ?? ""}
                onChange={(e) => setEditing({ ...editing, posX: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label className="field-label">Plan — pos Y (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                className="oinput"
                value={editing.posY ?? ""}
                onChange={(e) => setEditing({ ...editing, posY: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="field full">
              <label className="field-label">Description</label>
              <textarea
                className="otextarea"
                rows={2}
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
            <div className="field full">
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!editing.certifie}
                  onChange={(e) => setEditing({ ...editing, certifie: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                Défaut certifié
              </label>
            </div>
          </div>

          {error && (
            <p style={{ marginTop: 10, padding: "8px 10px", background: "var(--rose-soft)", border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)", color: "var(--rose)", borderRadius: 6, fontSize: 12 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className="obtn ghost"
              onClick={() => { setEditing(null); setError(null); }}
            >
              Annuler
            </button>
            <button
              type="button"
              className="obtn accent"
              onClick={submit}
              disabled={createMut.isPending || updateMut.isPending}
            >
              <Icon name="check" size={11} stroke={2.5} />
              {editing.id ? "Enregistrer" : "Ajouter le défaut"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
