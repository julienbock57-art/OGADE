/**
 * Maquette3DSection — Section "Modèles 3D" pour une maquette :
 *  - liste les fichiers STL / STEP attachés (typeFichier=DOCUMENT,
 *    context="modele-3d")
 *  - viewer 3D intégré (Maquette3DViewer) pour chaque fichier
 *  - en mode édition : input file pour ajouter de nouveaux fichiers
 *
 * Pratique : la "maquette" doit déjà exister (avoir un id). On l'utilise
 * directement comme entityType=MAQUETTE pour le module Fichier.
 */
import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Fichier } from "@ogade/shared";
import { api } from "@/lib/api";
import { clearFichierBlobCache } from "@/lib/fichiers";
import Maquette3DViewer from "./Maquette3DViewer";

const ACCEPT = ".stl,.step,.stp,application/sla,model/stl,model/step";

function isModele3D(f: Fichier): boolean {
  const n = (f.nomOriginal ?? "").toLowerCase();
  return n.endsWith(".stl") || n.endsWith(".step") || n.endsWith(".stp");
}

interface Props {
  maquetteId: number;
  readOnly?: boolean;
}

export default function Maquette3DSection({ maquetteId, readOnly = false }: Props) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: fichiers = [], isLoading } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "MAQUETTE", maquetteId, "3D"],
    queryFn: async () => {
      const all = await api.get<Fichier[]>(
        `/fichiers/entity/MAQUETTE/${maquetteId}`,
        { typeFichier: "DOCUMENT" },
      );
      // On filtre côté front car le module Fichier n'a pas de filtre
      // par extension. Le context "modele-3d" est ce qu'on associe à
      // l'upload mais on tolère aussi les anciens uploads sans context.
      return all.filter((f) => f.context === "modele-3d" || isModele3D(f));
    },
  });

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const results: Fichier[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("entityType", "MAQUETTE");
        fd.append("entityId", String(maquetteId));
        fd.append("typeFichier", "DOCUMENT");
        fd.append("context", "modele-3d");
        const r = await api.upload<Fichier>("/fichiers/upload", fd);
        results.push(r);
      }
      return results;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "MAQUETTE", maquetteId, "3D"],
      }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/fichiers/${id}`),
    onSuccess: (_, id) => {
      clearFichierBlobCache(id);
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "MAQUETTE", maquetteId, "3D"],
      });
    },
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    // Garde-fou: rejette les fichiers > 50 Mo
    const tooBig = files.filter((f) => f.size > 50 * 1024 * 1024);
    if (tooBig.length > 0) {
      alert(`Fichier trop volumineux (> 50 Mo) : ${tooBig.map((f) => f.name).join(", ")}`);
      e.target.value = "";
      return;
    }
    uploadMut.mutate(files);
    e.target.value = "";
  }

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "20px 24px",
        marginTop: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: "1px solid var(--line-2)",
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--ink-3)",
            margin: 0,
          }}
        >
          Modèles 3D ({fichiers.length})
        </h2>
        {!readOnly && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              multiple
              style={{ display: "none" }}
              onChange={onPick}
            />
            <button
              type="button"
              className="obtn ghost sm"
              disabled={uploadMut.isPending}
              onClick={() => fileInput.current?.click()}
            >
              {uploadMut.isPending ? "Envoi…" : "+ Ajouter un fichier 3D"}
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Chargement…</p>
      ) : fichiers.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>
          Aucun modèle 3D attaché.
          {!readOnly && " Formats acceptés : STL, STEP."}
        </p>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))" }}>
          {fichiers.map((f) => (
            <div key={f.id} style={{ position: "relative" }}>
              <Maquette3DViewer fichier={f} height={340} />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Supprimer ${f.nomOriginal ?? "ce fichier"} ?`)) {
                      deleteMut.mutate(f.id);
                    }
                  }}
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    background: "rgba(0,0,0,0.55)",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 11,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                  title="Supprimer"
                >
                  ✕ Supprimer
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadMut.isError && (
        <p style={{ marginTop: 8, color: "var(--rose)", fontSize: 12.5 }}>
          {(uploadMut.error as Error).message}
        </p>
      )}
    </div>
  );
}
