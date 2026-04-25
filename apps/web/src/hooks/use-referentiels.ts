import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type RefValue = { id: number; code: string; label: string; position: number };
export type SiteValue = { id: number; code: string; label: string; adresse?: string; codePostal?: string; ville?: string; pays?: string; telephone?: string; email?: string };
export type EntrepriseValue = SiteValue & { type: string; siret?: string };

export function useReferentiel(type: string) {
  return useQuery<RefValue[]>({
    queryKey: ["referentiels", type],
    queryFn: () => api.get("/referentiels", { type }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSites() {
  return useQuery<SiteValue[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/sites"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEntreprises(type?: string) {
  return useQuery<EntrepriseValue[]>({
    queryKey: ["entreprises", type],
    queryFn: () => api.get("/entreprises", type ? { type } : {}),
    staleTime: 5 * 60 * 1000,
  });
}
