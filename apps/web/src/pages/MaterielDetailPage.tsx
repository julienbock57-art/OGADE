import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel } from "@ogade/shared";
import { api } from "@/lib/api";
import Badge from "@/components/Badge";

const etatBadgeVariant: Record<string, string> = {
  DISPONIBLE: "success",
  EN_SERVICE: "info",
  EN_REPARATION: "warning",
  REBUT: "danger",
  PRETE: "purple",
  ENVOYEE: "default",
};

const etatLabel: Record<string, string> = {
  DISPONIBLE: "Disponible",
  EN_SERVICE: "En service",
  EN_REPARATION: "En réparation",
  REBUT: "Rebut",
  PRETE: "Prêtée",
  ENVOYEE: "Envoyée",
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function MaterielDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: materiel, isLoading, isError } = useQuery<Materiel>({
    queryKey: ["materiels", id],
    queryFn: () => api.get(`/materiels/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (isError || !materiel)
    return (
      <p className="text-sm text-red-600">
        Erreur lors du chargement du matériel.
      </p>
    );

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Référence", value: materiel.reference },
    { label: "Libellé", value: materiel.libelle },
    {
      label: "État",
      value: (
        <Badge
          variant={etatBadgeVariant[materiel.etat] ?? "default"}
          text={etatLabel[materiel.etat] ?? materiel.etat}
        />
      ),
    },
    { label: "Type de matériel", value: materiel.typeMateriel ?? "-" },
    { label: "Numéro de série", value: materiel.numeroSerie ?? "-" },
    { label: "Site", value: materiel.site ?? "-" },
    { label: "Localisation", value: materiel.localisation ?? "-" },
    { label: "Description", value: materiel.description ?? "-" },
    { label: "Date étalonnage", value: formatDate(materiel.dateEtalonnage) },
    {
      label: "Prochain étalonnage",
      value: formatDate(materiel.dateProchainEtalonnage),
    },
    { label: "Créé le", value: formatDate(materiel.createdAt) },
    { label: "Modifié le", value: formatDate(materiel.updatedAt) },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Matériel : {materiel.reference}
        </h1>
        <div className="flex gap-3">
          <Link
            to={`/materiels/${id}/edit`}
            className="bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors"
          >
            Modifier
          </Link>
          <Link
            to="/materiels"
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

      {/* QR Code */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">QR Code</h2>
        <img
          src={`/api/v1/qrcode/materiel/${id}`}
          alt={`QR code du matériel ${materiel.reference}`}
          className="w-48 h-48"
        />
      </div>
    </div>
  );
}
