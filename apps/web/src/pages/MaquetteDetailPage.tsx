import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Maquette } from "@ogade/shared";
import { api } from "@/lib/api";
import Badge from "@/components/Badge";

const etatBadgeVariant: Record<string, string> = {
  STOCK: "success",
  EMPRUNTEE: "warning",
  EN_CONTROLE: "info",
  REBUT: "danger",
  EN_REPARATION: "orange",
  ENVOYEE: "default",
};

const etatLabel: Record<string, string> = {
  STOCK: "En stock",
  EMPRUNTEE: "Empruntée",
  EN_CONTROLE: "En contrôle",
  REBUT: "Rebut",
  EN_REPARATION: "En réparation",
  ENVOYEE: "Envoyée",
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function MaquetteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: maquette,
    isLoading,
    isError,
  } = useQuery<Maquette>({
    queryKey: ["maquettes", id],
    queryFn: () => api.get(`/maquettes/${id}`),
    enabled: !!id,
  });

  const emprunterMutation = useMutation({
    mutationFn: () => api.post(`/maquettes/${id}/emprunter`, { emprunteurId: 1 }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["maquettes", id] }),
  });

  const retournerMutation = useMutation({
    mutationFn: () => api.post(`/maquettes/${id}/retourner`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["maquettes", id] }),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (isError || !maquette)
    return (
      <p className="text-sm text-red-600">
        Erreur lors du chargement de la maquette.
      </p>
    );

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Référence", value: maquette.reference },
    { label: "Libellé", value: maquette.libelle },
    {
      label: "État",
      value: (
        <Badge
          variant={etatBadgeVariant[maquette.etat] ?? "default"}
          text={etatLabel[maquette.etat] ?? maquette.etat}
        />
      ),
    },
    { label: "Type de maquette", value: maquette.typeMaquette ?? "-" },
    { label: "Site", value: maquette.site ?? "-" },
    { label: "Localisation", value: maquette.localisation ?? "-" },
    { label: "Description", value: maquette.description ?? "-" },
    { label: "Date d'emprunt", value: formatDate(maquette.dateEmprunt) },
    { label: "Date de retour", value: formatDate(maquette.dateRetour) },
    { label: "Créé le", value: formatDate(maquette.createdAt) },
    { label: "Modifié le", value: formatDate(maquette.updatedAt) },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Maquette : {maquette.reference}
        </h1>
        <div className="flex gap-3">
          <Link
            to={`/maquettes/${id}/edit`}
            className="bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors"
          >
            Modifier
          </Link>
          <Link
            to="/maquettes"
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Retour à la liste
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {field.label}
              </dt>
              <dd className="text-sm text-gray-900">{field.value}</dd>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {maquette.etat === "STOCK" && (
          <button
            onClick={() => emprunterMutation.mutate()}
            disabled={emprunterMutation.isPending}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            Emprunter
          </button>
        )}
        {maquette.etat === "EMPRUNTEE" && (
          <button
            onClick={() => retournerMutation.mutate()}
            disabled={retournerMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Retourner
          </button>
        )}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">QR Code</h2>
        <img
          src={`/api/v1/qrcode/maquette/${id}`}
          alt={`QR code de la maquette ${maquette.reference}`}
          className="w-48 h-48"
        />
      </div>
    </div>
  );
}
