/**
 * ExpeditionModal — Modal d'expédition magasinier (statut PRETE_A_EXPEDIER
 * ou VALIDEE → EN_TRANSIT). Permet :
 *  - de saisir le numéro de bon de transport + transporteur
 *  - de joindre le bon d'envoi en PJ (PDF/image)
 *  - pour chaque matériel/maquette : choisir l'état physique au départ +
 *    joindre au moins une photo
 *  - le bouton "Confirmer l'expédition" n'est actif que lorsque
 *    chaque ligne a au moins une photo et que le BL + transporteur +
 *    PJ bon de transport sont renseignés.
 */
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Fichier } from "@ogade/shared";
import { api } from "@/lib/api";
import {
  clearFichierBlobCache,
  openFichier,
  useFichierBlobUrl,
} from "@/lib/fichiers";

type Etat = "CORRECT" | "LEGER_DEFAUT" | "HS";
const ETATS: { value: Etat; label: string }[] = [
  { value: "CORRECT", label: "Correct" },
  { value: "LEGER_DEFAUT", label: "Léger défaut" },
  { value: "HS", label: "HS" },
];

export type ExpedierLigne = {
  id: number;
  reference: string;
  libelle: string;
  kind: "materiel" | "maquette";
};

export type ExpedierSubmitPayload = {
  numeroBonTransport: string;
  transporteur: string;
  commentaire?: string;
  lignesEtat: { ligneId: number; etat: Etat }[];
};

interface Props {
  demandeId: number;
  lignes: ExpedierLigne[];
  onClose: () => void;
  onConfirm: (payload: ExpedierSubmitPayload) => void;
  submitting?: boolean;
  serverError?: string | null;
}

function PhotoThumb({ id, alt, onRemove }: { id: number; alt: string; onRemove: () => void }) {
  const url = useFichierBlobUrl(id);
  return (
    <div
      style={{
        position: "relative",
        width: 70,
        height: 70,
        borderRadius: 6,
        overflow: "hidden",
        border: "1px solid var(--line)",
        cursor: "pointer",
        flexShrink: 0,
      }}
      onClick={() => openFichier(id)}
      title={alt}
    >
      {url ? (
        <img
          src={url}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "var(--bg-sunken, #f3f4f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--ink-3)" }}>…</div>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Supprimer"
        style={{
          position: "absolute",
          top: 2,
          right: 2,
          background: "rgba(0,0,0,0.55)",
          color: "white",
          border: "none",
          borderRadius: 4,
          width: 18,
          height: 18,
          fontSize: 12,
          lineHeight: "18px",
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}

function LignePhotos({
  demandeId,
  ligne,
  etat,
  onEtatChange,
}: {
  demandeId: number;
  ligne: ExpedierLigne;
  etat: Etat;
  onEtatChange: (e: Etat) => void;
}) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const context = `expedition-ligne-${ligne.id}`;

  const { data: photos = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", "exp", ligne.id],
    queryFn: async () => {
      const all = await api.get<Fichier[]>(
        `/fichiers/entity/DEMANDE_ENVOI/${demandeId}`,
        { typeFichier: "PHOTO" },
      );
      return all.filter((f) => f.context === context);
    },
  });

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("entityType", "DEMANDE_ENVOI");
        fd.append("entityId", String(demandeId));
        fd.append("typeFichier", "PHOTO");
        fd.append("demandeEnvoiId", String(demandeId));
        fd.append("context", context);
        await api.upload<Fichier>("/fichiers/upload", fd);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", "exp", ligne.id],
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/fichiers/${id}`),
    onSuccess: (_, id) => {
      clearFichierBlobCache(id);
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", "exp", ligne.id],
      });
    },
  });

  const hasPhotos = photos.length > 0;

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: "12px 14px",
        background: hasPhotos ? "var(--bg-panel)" : "var(--bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span className={`tag ${ligne.kind === "materiel" ? "c-accent" : ""}`} style={{ fontSize: 10 }}>
          {ligne.kind === "materiel" ? "MAT" : "MAQ"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
            {ligne.reference}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{ligne.libelle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            État au départ
          </label>
          <select
            value={etat}
            onChange={(e) => onEtatChange(e.target.value as Etat)}
            style={{
              fontSize: 13,
              padding: "5px 8px",
              borderRadius: 6,
              border: "1px solid var(--line)",
              background: "var(--bg)",
              color: "var(--ink)",
            }}
          >
            {ETATS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: hasPhotos ? "var(--emerald, #10b981)" : "var(--rose)" }}>
            Photos ({photos.length}) {hasPhotos ? "✓" : "* requis"}
          </span>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) uploadMut.mutate(files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="obtn ghost sm"
            disabled={uploadMut.isPending}
            onClick={() => fileInput.current?.click()}
          >
            {uploadMut.isPending ? "Envoi…" : "+ Ajouter photo"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {photos.map((p) => (
            <PhotoThumb
              key={p.id}
              id={p.id}
              alt={p.nomOriginal ?? "photo"}
              onRemove={() => {
                if (confirm("Supprimer cette photo ?")) deleteMut.mutate(p.id);
              }}
            />
          ))}
          {photos.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
              Au moins une photo est requise pour cette ligne.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BonTransportUpload({ demandeId }: { demandeId: number }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: docs = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "DOCUMENT", "bon-transport"],
    queryFn: async () => {
      const all = await api.get<Fichier[]>(
        `/fichiers/entity/DEMANDE_ENVOI/${demandeId}`,
        { typeFichier: "DOCUMENT" },
      );
      return all.filter((f) => f.context === "bon-transport");
    },
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", "DEMANDE_ENVOI");
      fd.append("entityId", String(demandeId));
      fd.append("typeFichier", "DOCUMENT");
      fd.append("demandeEnvoiId", String(demandeId));
      fd.append("context", "bon-transport");
      await api.upload<Fichier>("/fichiers/upload", fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "DOCUMENT", "bon-transport"],
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/fichiers/${id}`),
    onSuccess: (_, id) => {
      clearFichierBlobCache(id);
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "DOCUMENT", "bon-transport"],
      });
    },
  });

  const hasFile = docs.length > 0;

  return (
    <div>
      <label style={{ fontSize: 12, color: hasFile ? "var(--ink-3)" : "var(--rose)", display: "block", marginBottom: 4 }}>
        Bon d'envoi (PDF / image) {hasFile ? "✓" : "* requis"}
      </label>
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadMut.mutate(f);
          e.target.value = "";
        }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="obtn"
          disabled={uploadMut.isPending}
          onClick={() => fileInput.current?.click()}
        >
          {uploadMut.isPending ? "Envoi…" : hasFile ? "Ajouter / remplacer" : "Choisir un fichier"}
        </button>
        {docs.map((d) => (
          <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 6, fontSize: 12.5 }}>
            <button
              type="button"
              onClick={() => openFichier(d.id)}
              style={{ background: "none", border: "none", color: "var(--accent)", textDecoration: "none", padding: 0, cursor: "pointer", fontSize: 12.5 }}
            >
              📎 {d.nomOriginal ?? `Bon-${d.id}`}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Supprimer ce bon ?")) deleteMut.mutate(d.id);
              }}
              aria-label="Supprimer"
              style={{ background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 14 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ExpeditionModal({
  demandeId,
  lignes,
  onClose,
  onConfirm,
  submitting,
  serverError,
}: Props) {
  const [numeroBonTransport, setNumeroBonTransport] = useState("");
  const [transporteur, setTransporteur] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [etats, setEtats] = useState<Record<number, Etat>>(() =>
    Object.fromEntries(lignes.map((l) => [l.id, "CORRECT" as Etat])),
  );

  // On a besoin de connaître le statut "photos OK" et "bon-transport OK"
  // pour griser/activer le bouton. Ces infos viennent du cache React Query
  // alimenté par les sous-composants.
  const { data: allPhotos = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", "all-exp"],
    queryFn: () =>
      api.get<Fichier[]>(`/fichiers/entity/DEMANDE_ENVOI/${demandeId}`, { typeFichier: "PHOTO" }),
    refetchInterval: 2000, // re-poll pour suivre les uploads des sous-composants
  });
  const { data: allBons = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "DOCUMENT", "all-exp"],
    queryFn: () =>
      api.get<Fichier[]>(`/fichiers/entity/DEMANDE_ENVOI/${demandeId}`, { typeFichier: "DOCUMENT" }),
    refetchInterval: 2000,
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const lignesAvecPhoto = lignes.filter((l) =>
    allPhotos.some((p) => p.context === `expedition-ligne-${l.id}`),
  );
  const lignesSansPhoto = lignes.filter(
    (l) => !allPhotos.some((p) => p.context === `expedition-ligne-${l.id}`),
  );
  const hasBonTransport = allBons.some((d) => d.context === "bon-transport");
  const allLignesPhoto = lignesSansPhoto.length === 0;
  const allFieldsOk =
    numeroBonTransport.trim().length > 0 &&
    transporteur.trim().length > 0 &&
    hasBonTransport &&
    allLignesPhoto;

  function handleSubmit() {
    onConfirm({
      numeroBonTransport: numeroBonTransport.trim(),
      transporteur: transporteur.trim(),
      commentaire: commentaire.trim() || undefined,
      lignesEtat: lignes.map((l) => ({ ligneId: l.id, etat: etats[l.id] ?? "CORRECT" })),
    });
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ width: "min(820px, 96vw)" }}>
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="drawer-title" style={{ margin: 0 }}>Expédier la demande</h2>
            <div className="drawer-sub">
              {lignes.length} ligne{lignes.length > 1 ? "s" : ""} · {lignesAvecPhoto.length}/{lignes.length} avec photo
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <div className="drawer-body" style={{ padding: 16 }}>
          {/* Bloc transport */}
          <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 12px" }}>
            Bon de transport
          </h3>
          <div className="vstack" style={{ gap: 10, marginBottom: 16 }}>
            <div className="detail-grid-2" style={{ gap: 12 }}>
              <div className="field">
                <label style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>
                  Numéro de bon de transport <span style={{ color: "var(--rose)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={numeroBonTransport}
                  onChange={(e) => setNumeroBonTransport(e.target.value)}
                  placeholder="BL-2026-0001"
                  className="oinput"
                />
              </div>
              <div className="field">
                <label style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>
                  Transporteur <span style={{ color: "var(--rose)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={transporteur}
                  onChange={(e) => setTransporteur(e.target.value)}
                  placeholder="DHL, Chronopost, Coursier interne…"
                  className="oinput"
                />
              </div>
            </div>
            <BonTransportUpload demandeId={demandeId} />
          </div>

          {/* Bloc lignes */}
          <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "16px 0 12px" }}>
            Matériels et maquettes — état + photo par ligne
          </h3>
          <div className="vstack" style={{ gap: 10 }}>
            {lignes.map((ligne) => (
              <LignePhotos
                key={ligne.id}
                demandeId={demandeId}
                ligne={ligne}
                etat={etats[ligne.id] ?? "CORRECT"}
                onEtatChange={(e) => setEtats((s) => ({ ...s, [ligne.id]: e }))}
              />
            ))}
          </div>

          {/* Commentaire */}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>
              Commentaire (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              placeholder="Notes (état général du colis, conditions de transport…)"
              className="otextarea"
              style={{ width: "100%" }}
            />
          </div>

          {/* Récap blocages */}
          {!allFieldsOk && (
            <div
              style={{
                marginTop: 14,
                padding: 10,
                background: "var(--bg-sunken, #f9fafb)",
                border: "1px dashed var(--line)",
                borderRadius: 8,
                fontSize: 12.5,
                color: "var(--ink-3)",
              }}
            >
              <strong>Avant de confirmer :</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {!numeroBonTransport.trim() && <li>renseigner le numéro de bon de transport</li>}
                {!transporteur.trim() && <li>renseigner le transporteur</li>}
                {!hasBonTransport && <li>joindre le bon d'envoi (PDF/image)</li>}
                {!allLignesPhoto && (
                  <li>
                    ajouter au moins une photo pour {lignesSansPhoto.length} ligne
                    {lignesSansPhoto.length > 1 ? "s" : ""} :{" "}
                    {lignesSansPhoto.map((l) => l.reference).join(", ")}
                  </li>
                )}
              </ul>
            </div>
          )}

          {serverError && (
            <div style={{ marginTop: 10, color: "var(--rose)", fontSize: 12.5 }}>
              {serverError}
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <div className="left">
            <button className="obtn ghost" type="button" onClick={onClose}>
              Annuler
            </button>
          </div>
          <div className="right">
            <button
              className="obtn accent"
              type="button"
              disabled={!allFieldsOk || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Envoi…" : "Confirmer l'expédition"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
