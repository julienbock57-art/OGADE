import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Maquette } from "@ogade/shared";
import { api } from "@/lib/api";
import MaquetteDrawer from "@/components/MaquetteDrawer";

export default function MaquetteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<Maquette>({
    queryKey: ["maquettes", id],
    queryFn: () => api.get(`/maquettes/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: "2.5px solid var(--accent-soft)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.7s linear infinite",
        }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: "var(--rose-soft)",
          border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)",
          borderRadius: 12,
          padding: 32,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--rose)" }}>Erreur lors du chargement de la maquette.</p>
          <button
            onClick={() => navigate(-1)}
            style={{ marginTop: 8, fontSize: 12, color: "var(--rose)", background: "none", border: 0, textDecoration: "underline", cursor: "pointer" }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 16px 0" }}>
      <MaquetteDrawer maquette={data} mode="page" />
    </div>
  );
}
