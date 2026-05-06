/**
 * PhotoUploader — Section "Photos" pour une demande d'envoi.
 * Affiche les photos déjà attachées (galerie) et permet d'en uploader
 * via /fichiers/upload (entityType=DEMANDE_ENVOI, typeFichier=PHOTO).
 */
import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Fichier } from "@ogade/shared";
import { api } from "@/lib/api";
import { clearFichierBlobCache, openFichier, useFichierBlobUrl } from "@/lib/fichiers";

function PhotoThumb({ id, alt }: { id: number; alt: string }) {
  const url = useFichierBlobUrl(id);
  if (!url) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "var(--bg-sunken, #f3f4f6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "var(--ink-3)",
        }}
      >
        …
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

interface Props {
  demandeId: number;
  context?: string; // ex: "expedition" | "reception" | "retour"
  title?: string;
  readOnly?: boolean;
}

export default function PhotoUploader({ demandeId, context, title = "Photos", readOnly = false }: Props) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: photos = [], isLoading } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO"],
    queryFn: () => api.get(`/fichiers/entity/DEMANDE_ENVOI/${demandeId}`, { typeFichier: "PHOTO" }),
  });

  const filtered = context
    ? photos.filter((p) => p.context === context)
    : photos;

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const results: Fichier[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("entityType", "DEMANDE_ENVOI");
        fd.append("entityId", String(demandeId));
        fd.append("typeFichier", "PHOTO");
        fd.append("demandeEnvoiId", String(demandeId));
        if (context) fd.append("context", context);
        const r = await api.upload<Fichier>("/fichiers/upload", fd);
        results.push(r);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/fichiers/${id}`),
    onSuccess: (_, id) => {
      clearFichierBlobCache(id);
      queryClient.invalidateQueries({ queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO"] });
    },
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    uploadMut.mutate(files);
    e.target.value = "";
  }

  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: 0 }}>
          {title} ({filtered.length})
        </h3>
        {!readOnly && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
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
              {uploadMut.isPending ? "Envoi…" : "Ajouter des photos"}
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: 0 }}>
          Aucune photo {readOnly ? "" : "— cliquez sur \"Ajouter des photos\""}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {filtered.map((p) => (
            <div key={p.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", cursor: "pointer" }} onClick={() => openFichier(p.id)}>
              <PhotoThumb id={p.id} alt={p.nomOriginal ?? "photo"} />
              {!readOnly && (
                <button
                  type="button"
                  className="icon-btn"
                  style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.55)", color: "white", borderRadius: 4 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Supprimer cette photo ?")) deleteMut.mutate(p.id);
                  }}
                  aria-label="Supprimer"
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
