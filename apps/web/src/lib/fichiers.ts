/**
 * Helpers pour télécharger / afficher un Fichier en tenant compte de
 * l'authentification : on ne peut pas mettre un Authorization header sur
 * une balise <a href> ou <img src>, donc on récupère le binaire via
 * fetch authentifié puis on génère une URL `blob:` éphémère.
 */
import { api } from "@/lib/api";

const blobUrlCache = new Map<number, string>();

async function getBlobUrl(id: number): Promise<string> {
  const cached = blobUrlCache.get(id);
  if (cached) return cached;
  const blob = await api.fetchBlob(`/fichiers/${id}/download`);
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(id, url);
  return url;
}

/** Vide le cache (à appeler après suppression). */
export function clearFichierBlobCache(id?: number) {
  if (id != null) {
    const u = blobUrlCache.get(id);
    if (u) URL.revokeObjectURL(u);
    blobUrlCache.delete(id);
  } else {
    for (const u of blobUrlCache.values()) URL.revokeObjectURL(u);
    blobUrlCache.clear();
  }
}

/** Télécharge un fichier (provoque un download dans le navigateur). */
export async function downloadFichier(id: number, filename = "fichier") {
  const url = await getBlobUrl(id);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Ouvre un fichier dans un nouvel onglet (preview PDF/image). */
export async function openFichier(id: number) {
  const url = await getBlobUrl(id);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Hook léger : retourne la blob URL d'un fichier (image notamment),
 * idéal pour <img src={url}>.
 */
import { useEffect, useState } from "react";
export function useFichierBlobUrl(id: number | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (id == null) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    getBlobUrl(id)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return url;
}
