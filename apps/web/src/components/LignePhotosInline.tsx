/**
 * LignePhotosInline — Affiche en lecture seule les photos prises par
 * le magasinier pour une ligne (matériel/maquette) à un moment donné
 * du workflow : départ (`expedition-ligne-{id}`), réception
 * (`reception-ligne-{id}`) ou retour (`retour-ligne-{id}`).
 *
 * Permet de regrouper visuellement les photos avec la ligne concernée
 * plutôt que dans une galerie globale.
 */
import { useQuery } from "@tanstack/react-query";
import type { Fichier } from "@ogade/shared";
import { api } from "@/lib/api";
import { openFichier, useFichierBlobUrl } from "@/lib/fichiers";

function Thumb({ id, alt }: { id: number; alt: string }) {
  const url = useFichierBlobUrl(id);
  return (
    <button
      type="button"
      onClick={() => openFichier(id)}
      title={alt}
      style={{
        width: 56,
        height: 56,
        padding: 0,
        border: "1px solid var(--line)",
        borderRadius: 6,
        overflow: "hidden",
        cursor: "pointer",
        background: "var(--bg-sunken, #f3f4f6)",
        flexShrink: 0,
      }}
    >
      {url && (
        <img
          src={url}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </button>
  );
}

interface SectionProps {
  label: string;
  photos: Fichier[];
}

function Section({ label, photos }: SectionProps) {
  if (photos.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", marginBottom: 4 }}>
        {label} ({photos.length})
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {photos.map((p) => (
          <Thumb key={p.id} id={p.id} alt={p.nomOriginal ?? "photo"} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  demandeId: number;
  ligneId: number;
}

export default function LignePhotosInline({ demandeId, ligneId }: Props) {
  const { data: photos = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demandeId, "PHOTO", "for-ligne", ligneId],
    queryFn: () =>
      api.get<Fichier[]>(`/fichiers/entity/DEMANDE_ENVOI/${demandeId}`, { typeFichier: "PHOTO" }),
  });

  const expedition = photos.filter((p) => p.context === `expedition-ligne-${ligneId}`);
  const reception = photos.filter((p) => p.context === `reception-ligne-${ligneId}`);
  const retour = photos.filter((p) => p.context === `retour-ligne-${ligneId}`);

  if (expedition.length === 0 && reception.length === 0 && retour.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 10,
        padding: 10,
        background: "var(--bg-sunken, #f9fafb)",
        borderRadius: 8,
        border: "1px solid var(--line-2)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <Section label="Photos départ" photos={expedition} />
      <Section label="Photos réception" photos={reception} />
      <Section label="Photos retour" photos={retour} />
    </div>
  );
}
