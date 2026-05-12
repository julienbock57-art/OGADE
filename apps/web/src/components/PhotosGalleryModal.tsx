/**
 * PhotosGalleryModal — Modale plein-écran pour parcourir une série de
 * photos (rattachées à une demande d'envoi).
 *
 * Charge les images via api.fetchBlob (auth JWT) puis génère des URLs
 * blob: éphémères. Permet de naviguer avec les flèches clavier / les
 * miniatures / les boutons Prev/Next, et d'ouvrir le fichier original
 * dans un nouvel onglet via le bouton "Ouvrir".
 */
import { useEffect, useState } from "react";
import type { Fichier } from "@ogade/shared";
import { openFichier, useFichierBlobUrl } from "@/lib/fichiers";

interface Props {
  photos: Fichier[];
  title?: string;
  onClose: () => void;
}

function MainImage({ id, alt }: { id: number; alt: string }) {
  const url = useFichierBlobUrl(id);
  if (!url) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 13,
        }}
      >
        Chargement…
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
    />
  );
}

function Thumb({
  id,
  active,
  onClick,
}: {
  id: number;
  active: boolean;
  onClick: () => void;
}) {
  const url = useFichierBlobUrl(id);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 64,
        height: 64,
        flexShrink: 0,
        border: active ? "2px solid var(--accent, #6366f1)" : "1px solid rgba(255,255,255,0.25)",
        borderRadius: 6,
        padding: 0,
        background: "rgba(255,255,255,0.06)",
        cursor: "pointer",
        overflow: "hidden",
        opacity: active ? 1 : 0.7,
      }}
    >
      {url ? (
        <img
          src={url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <span style={{ color: "white", fontSize: 10 }}>…</span>
      )}
    </button>
  );
}

export default function PhotosGalleryModal({ photos, title = "Photos", onClose }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= photos.length) setIdx(0);
  }, [photos.length, idx]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIdx((i) => (i + 1) % photos.length);
      else if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, photos.length]);

  if (photos.length === 0) return null;

  const current = photos[idx];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 20px",
          color: "white",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {idx + 1} / {photos.length}
            {current.nomOriginal && ` · ${current.nomOriginal}`}
          </div>
        </div>
        <button
          type="button"
          className="obtn ghost sm"
          onClick={() => openFichier(current.id)}
          style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
        >
          Ouvrir dans un onglet
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            width: 32,
            height: 32,
            borderRadius: 6,
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {/* Main viewer + arrows */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 60px",
          position: "relative",
          minHeight: 0,
        }}
      >
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            aria-label="Précédent"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
              width: 40,
              height: 40,
              borderRadius: 999,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ‹
          </button>
        )}
        <MainImage id={current.id} alt={current.nomOriginal ?? `photo ${idx + 1}`} />
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            aria-label="Suivant"
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
              width: 40,
              height: 40,
              borderRadius: 999,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 20px",
            overflowX: "auto",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          {photos.map((p, i) => (
            <Thumb key={p.id} id={p.id} active={i === idx} onClick={() => setIdx(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
