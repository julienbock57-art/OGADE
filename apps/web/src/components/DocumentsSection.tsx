/**
 * DocumentsSection — Section "Pièces jointes" (PDF / fichiers) pour une
 * demande d'envoi. Toujours consultable (lecture seule pour les rôles
 * non-magasinier / non-demandeur), upload possible pour ceux qui peuvent
 * éditer.
 */
import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Fichier } from "@ogade/shared";
import { api } from "@/lib/api";

interface Props {
  demandeId: number;
  /** Filtre par contexte (ex: "convention"). Si omis, montre tous les
   *  documents. */
  context?: string;
  title?: string;
  readOnly?: boolean;
}

export default function DocumentsSection({
  demandeId,
  context,
  title = "Pièces jointes",
  readOnly = false,
}: Props) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "DOCUMENT"],
    queryFn: () =>
      api.get(`/fichiers/entity/DEMANDE_ENVOI/${demandeId}`, {
        typeFichier: "DOCUMENT",
      }),
  });

  const filtered = context ? docs.filter((d) => d.context === context) : docs;

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const results: Fichier[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("entityType", "DEMANDE_ENVOI");
        fd.append("entityId", String(demandeId));
        fd.append("typeFichier", "DOCUMENT");
        fd.append("demandeEnvoiId", String(demandeId));
        if (context) fd.append("context", context);
        const r = await api.upload<Fichier>("/fichiers/upload", fd);
        results.push(r);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "DOCUMENT"],
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/fichiers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "DOCUMENT"],
      });
    },
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    uploadMut.mutate(files);
    e.target.value = "";
  }

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--ink-3)",
            margin: 0,
          }}
        >
          {title} ({filtered.length})
        </h3>
        {!readOnly && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,image/*"
              multiple
              onChange={onPick}
              style={{ display: "none" }}
            />
            <button
              className="obtn ghost sm"
              type="button"
              disabled={uploadMut.isPending}
              onClick={() => fileInput.current?.click()}
            >
              {uploadMut.isPending ? "Envoi…" : "Ajouter un fichier"}
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: 0 }}>
          Aucun document {readOnly ? "" : '— cliquez sur "Ajouter un fichier"'}
        </p>
      ) : (
        <div className="vstack" style={{ gap: 6 }}>
          {filtered.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                border: "1px solid var(--line)",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>📎</span>
              <a
                href={`/api/v1/fichiers/${d.id}/download`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  minWidth: 0,
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {d.nomOriginal ?? `Fichier #${d.id}`}
              </a>
              {d.context && (
                <span
                  className="tag"
                  style={{ fontSize: 10, textTransform: "uppercase" }}
                >
                  {d.context}
                </span>
              )}
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {d.tailleOctets
                  ? `${Math.round(d.tailleOctets / 1024)} Ko`
                  : ""}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    if (confirm("Supprimer ce fichier ?")) deleteMut.mutate(d.id);
                  }}
                  aria-label="Supprimer"
                  style={{ color: "var(--ink-3)" }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadMut.isError && (
        <div style={{ marginTop: 8, color: "var(--rose)", fontSize: 12.5 }}>
          {(uploadMut.error as Error).message}
        </div>
      )}
    </div>
  );
}
