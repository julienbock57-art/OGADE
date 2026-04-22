import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DemandeEnvoi } from "@ogade/shared";
import { api } from "@/lib/api";
import Badge from "@/components/Badge";

const statutBadgeVariant: Record<string, string> = {
  BROUILLON: "default",
  ENVOYEE: "info",
  EN_TRANSIT: "warning",
  RECUE: "success",
  CLOTUREE: "purple",
  ANNULEE: "danger",
};

const statutLabel: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYEE: "Envoyée",
  EN_TRANSIT: "En transit",
  RECUE: "Reçue",
  CLOTUREE: "Clôturée",
  ANNULEE: "Annulée",
};

const typeLabel: Record<string, string> = {
  MATERIEL: "Matériel",
  MAQUETTE: "Maquette",
  MUTUALISEE: "Mutualisée",
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

interface DemandeEnvoiWithLignes extends DemandeEnvoi {
  lignes?: {
    id: number;
    materielId?: number | null;
    maquetteId?: number | null;
    quantite: number;
    recue: boolean;
    dateReception?: string | Date | null;
    materiel?: { reference: string; libelle: string } | null;
    maquette?: { reference: string; libelle: string } | null;
  }[];
}

export default function DemandeEnvoiDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: demande,
    isLoading,
    isError,
  } = useQuery<DemandeEnvoiWithLignes>({
    queryKey: ["demandes-envoi", id],
    queryFn: () => api.get(`/demandes-envoi/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-sm text-gray-500">Chargement...</p>;
  if (isError || !demande)
    return (
      <p className="text-sm text-red-600">
        Erreur lors du chargement de la demande.
      </p>
    );

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Numéro", value: demande.numero },
    { label: "Type", value: typeLabel[demande.type] ?? demande.type },
    {
      label: "Statut",
      value: (
        <Badge
          variant={statutBadgeVariant[demande.statut] ?? "default"}
          text={statutLabel[demande.statut] ?? demande.statut}
        />
      ),
    },
    { label: "Destinataire", value: demande.destinataire },
    { label: "Site destinataire", value: demande.siteDestinataire ?? "-" },
    { label: "Motif", value: demande.motif ?? "-" },
    { label: "Date souhaitée", value: formatDate(demande.dateSouhaitee) },
    { label: "Date d'envoi", value: formatDate(demande.dateEnvoi) },
    { label: "Date de réception", value: formatDate(demande.dateReception) },
    { label: "Commentaire", value: demande.commentaire ?? "-" },
    { label: "Créé le", value: formatDate(demande.createdAt) },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Demande : {demande.numero}
        </h1>
        <Link
          to="/demandes-envoi"
          className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Retour à la liste
        </Link>
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

      {demande.lignes && demande.lignes.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Lignes ({demande.lignes.length})
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                  Élément
                </th>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                  Référence
                </th>
                <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase">
                  Quantité
                </th>
                <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase">
                  Reçue
                </th>
              </tr>
            </thead>
            <tbody>
              {demande.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-gray-100">
                  <td className="py-2">
                    {ligne.materiel ? "Matériel" : "Maquette"}
                  </td>
                  <td className="py-2">
                    {ligne.materiel?.reference ??
                      ligne.maquette?.reference ??
                      "-"}
                  </td>
                  <td className="py-2 text-center">{ligne.quantite}</td>
                  <td className="py-2 text-center">
                    {ligne.recue ? (
                      <span className="text-green-600 font-medium">Oui</span>
                    ) : (
                      <span className="text-gray-400">Non</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
