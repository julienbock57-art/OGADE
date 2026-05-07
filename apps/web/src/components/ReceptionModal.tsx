/**
 * ReceptionModal — Modal de réception magasinier (utilisé pour
 * `receptionner` et `receptionner-retour`).
 *
 * Pour chaque matériel/maquette éligible, impose :
 *   - le choix de l'état physique
 *   - au moins une photo (preuve visuelle de l'état réel à l'arrivée)
 *
 * Le bouton "Confirmer" reste désactivé tant que toutes les lignes
 * n'ont pas une photo.
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
import { useSites, useEntreprises } from "@/hooks/use-referentiels";

type Etat = "CORRECT" | "LEGER_DEFAUT" | "HS";
const ETATS: { value: Etat; label: string }[] = [
  { value: "CORRECT", label: "Correct" },
  { value: "LEGER_DEFAUT", label: "Léger défaut" },
  { value: "HS", label: "HS" },
];

export type ReceptionLigne = {
  id: number;
  reference: string;
  libelle: string;
  kind: "materiel" | "maquette";
};

type LocalisationInput = {
  entreprise?: string;
  site?: string;
  rayonnage?: string;
  salle?: string;
  complements?: string;
};

export type ReceptionSubmitPayload = {
  commentaire?: string;
  lignesEtat: {
    ligneId: number;
    etat: Etat;
    localisation?: LocalisationInput;
  }[];
};

interface Props {
  demandeId: number;
  lignes: ReceptionLigne[];
  /** "reception" → photos taguées "reception-ligne-{id}".
   *  "retour"    → photos taguées "retour-ligne-{id}". */
  mode: "reception" | "retour";
  title: string;
  onClose: () => void;
  onConfirm: (payload: ReceptionSubmitPayload) => void;
  submitting?: boolean;
  serverError?: string | null;
}

function PhotoThumb({
  id,
  alt,
  onRemove,
}: {
  id: number;
  alt: string;
  onRemove: () => void;
}) {
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
  contextPrefix,
  etat,
  onEtatChange,
}: {
  demandeId: number;
  ligne: ReceptionLigne;
  contextPrefix: string;
  etat: Etat;
  onEtatChange: (e: Etat) => void;
}) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const context = `${contextPrefix}-ligne-${ligne.id}`;

  const { data: photos = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", contextPrefix, ligne.id],
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
        queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", contextPrefix, ligne.id],
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/fichiers/${id}`),
    onSuccess: (_, id) => {
      clearFichierBlobCache(id);
      queryClient.invalidateQueries({
        queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", contextPrefix, ligne.id],
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
        <span
          className={`tag ${ligne.kind === "materiel" ? "c-accent" : ""}`}
          style={{ fontSize: 10 }}
        >
          {ligne.kind === "materiel" ? "MAT" : "MAQ"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
            {ligne.reference}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{ligne.libelle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label
            style={{
              fontSize: 10,
              color: "var(--ink-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            État à l'arrivée
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: hasPhotos ? "var(--emerald, #10b981)" : "var(--rose)",
            }}
          >
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

function LocalisationFields({
  ligne,
  value,
  onChange,
}: {
  ligne: ReceptionLigne;
  value: LocalisationInput;
  onChange: (v: LocalisationInput) => void;
}) {
  const { data: sites = [] } = useSites();
  const { data: entreprises = [] } = useEntreprises();

  const set = <K extends keyof LocalisationInput>(k: K, v: LocalisationInput[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 12px",
        background: "var(--bg-sunken, #f9fafb)",
        borderRadius: 8,
        border: "1px solid var(--line-2)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--ink-3)",
          marginBottom: 8,
        }}
      >
        Informations réception {ligne.kind === "materiel" ? "du matériel" : "de la maquette"} «{ligne.reference}»
      </div>
      <div className="detail-grid-2" style={{ gap: 10 }}>
        <div className="field">
          <label className="field-label" style={{ fontSize: 11 }}>Localisation : Entreprise</label>
          <select
            className="oselect"
            value={value.entreprise ?? ""}
            onChange={(e) => set("entreprise", e.target.value || undefined)}
          >
            <option value="">— Sélectionner —</option>
            {entreprises.map((e) => (
              <option key={e.code} value={e.label}>{e.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" style={{ fontSize: 11 }}>Localisation (site)</label>
          <select
            className="oselect"
            value={value.site ?? ""}
            onChange={(e) => set("site", e.target.value || undefined)}
          >
            <option value="">— Sélectionner —</option>
            {sites.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
                {s.adresse ? ` · ${s.adresse}` : ""}
                {s.codePostal ? ` ${s.codePostal}` : ""}
                {s.ville ? ` ${s.ville}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" style={{ fontSize: 11 }}>Localisation_Rayonnage</label>
          <input
            type="text"
            className="oinput"
            value={value.rayonnage ?? ""}
            placeholder="A4"
            onChange={(e) => set("rayonnage", e.target.value || undefined)}
          />
        </div>
        <div className="field">
          <label className="field-label" style={{ fontSize: 11 }}>Localisation_Salle</label>
          <input
            type="text"
            className="oinput"
            value={value.salle ?? ""}
            placeholder="L0-513"
            onChange={(e) => set("salle", e.target.value || undefined)}
          />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label className="field-label" style={{ fontSize: 11 }}>Compléments localisation</label>
          <textarea
            className="otextarea"
            rows={2}
            value={value.complements ?? ""}
            onChange={(e) => set("complements", e.target.value || undefined)}
          />
        </div>
      </div>
    </div>
  );
}

export default function ReceptionModal({
  demandeId,
  lignes,
  mode,
  title,
  onClose,
  onConfirm,
  submitting,
  serverError,
}: Props) {
  const contextPrefix = mode === "reception" ? "reception" : "retour";
  const [commentaire, setCommentaire] = useState("");
  const [etats, setEtats] = useState<Record<number, Etat>>(() =>
    Object.fromEntries(lignes.map((l) => [l.id, "CORRECT" as Etat])),
  );
  const [localisations, setLocalisations] = useState<Record<number, LocalisationInput>>(
    () => Object.fromEntries(lignes.map((l) => [l.id, {}])),
  );

  // Polling pour suivre les uploads des sous-composants et activer
  // le bouton "Confirmer" en temps réel.
  const { data: allPhotos = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", "all-rcp", contextPrefix],
    queryFn: () =>
      api.get<Fichier[]>(`/fichiers/entity/DEMANDE_ENVOI/${demandeId}`, { typeFichier: "PHOTO" }),
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
    allPhotos.some((p) => p.context === `${contextPrefix}-ligne-${l.id}`),
  );
  const lignesSansPhoto = lignes.filter(
    (l) => !allPhotos.some((p) => p.context === `${contextPrefix}-ligne-${l.id}`),
  );
  const allLignesPhoto = lignesSansPhoto.length === 0;

  function handleSubmit() {
    onConfirm({
      commentaire: commentaire.trim() || undefined,
      lignesEtat: lignes.map((l) => {
        const loc = localisations[l.id] ?? {};
        // On n'envoie le bloc que si au moins un champ est rempli
        const hasLoc = Object.values(loc).some((v) => v && String(v).trim() !== "");
        return {
          ligneId: l.id,
          etat: etats[l.id] ?? "CORRECT",
          ...(hasLoc ? { localisation: loc } : {}),
        };
      }),
    });
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ width: "min(820px, 96vw)" }}>
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="drawer-title" style={{ margin: 0 }}>{title}</h2>
            <div className="drawer-sub">
              {lignes.length} ligne{lignes.length > 1 ? "s" : ""} · {lignesAvecPhoto.length}/{lignes.length} avec photo
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <div className="drawer-body" style={{ padding: 16 }}>
          <h3
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--ink-3)",
              margin: "0 0 12px",
            }}
          >
            État + photo par matériel/maquette
          </h3>
          <div className="vstack" style={{ gap: 10 }}>
            {lignes.map((ligne) => (
              <div key={ligne.id}>
                <LignePhotos
                  demandeId={demandeId}
                  ligne={ligne}
                  contextPrefix={contextPrefix}
                  etat={etats[ligne.id] ?? "CORRECT"}
                  onEtatChange={(e) => setEtats((s) => ({ ...s, [ligne.id]: e }))}
                />
                <LocalisationFields
                  ligne={ligne}
                  value={localisations[ligne.id] ?? {}}
                  onChange={(v) =>
                    setLocalisations((s) => ({ ...s, [ligne.id]: v }))
                  }
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Commentaire (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              placeholder="Notes sur la réception (état général, conditions de transport…)"
              className="otextarea"
              style={{ width: "100%" }}
            />
          </div>

          {!allLignesPhoto && (
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
                <li>
                  ajouter au moins une photo pour {lignesSansPhoto.length} ligne
                  {lignesSansPhoto.length > 1 ? "s" : ""} :{" "}
                  {lignesSansPhoto.map((l) => l.reference).join(", ")}
                </li>
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
              disabled={!allLignesPhoto || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Envoi…" : "Confirmer la réception"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
