import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel } from "@ogade/shared";
import { api } from "@/lib/api";
import MaterielDrawer from "@/components/MaterielDrawer";

export default function MaterielDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: materiel, isLoading, isError } = useQuery<Materiel>({
    queryKey: ["materiels", id],
    queryFn: () => api.get(`/materiels/${id}`),
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

  if (isError || !materiel) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: "var(--rose-soft)", border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)",
          borderRadius: 12, padding: "32px", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--rose)" }}>Erreur lors du chargement du matériel.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 8, fontSize: 12, color: "var(--rose)", background: "none", border: 0, textDecoration: "underline", cursor: "pointer" }}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 16px 0" }}>
      <MaterielDrawer materiel={materiel} mode="page" />
    </div>
  );
}
