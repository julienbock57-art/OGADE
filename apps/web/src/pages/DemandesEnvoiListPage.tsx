import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DemandeEnvoi, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import DataTable, { type Column } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
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

export default function DemandesEnvoiListPage() {
  const [search, setSearch] = useState("");
  const { page, pageSize, setPage, queryParams } = usePagination();

  const { data, isLoading, isError } = useQuery<
    PaginatedResult<DemandeEnvoi>
  >({
    queryKey: ["demandes-envoi", { ...queryParams, search }],
    queryFn: () =>
      api.get("/demandes-envoi", {
        ...queryParams,
        search: search || undefined,
      }),
  });

  const columns: Column<DemandeEnvoi>[] = [
    { header: "Numéro", accessor: "numero" },
    {
      header: "Type",
      render: (row) => typeLabel[row.type] ?? row.type,
    },
    { header: "Destinataire", accessor: "destinataire" },
    {
      header: "Statut",
      render: (row) => (
        <Badge
          variant={statutBadgeVariant[row.statut] ?? "default"}
          text={statutLabel[row.statut] ?? row.statut}
        />
      ),
    },
    {
      header: "Date souhaitée",
      render: (row) => formatDate(row.dateSouhaitee),
    },
    {
      header: "Date envoi",
      render: (row) => formatDate(row.dateEnvoi),
    },
    {
      header: "Actions",
      render: (row) => (
        <Link
          to={`/demandes-envoi/${row.id}`}
          className="text-edf-blue hover:underline text-sm font-medium"
        >
          Voir
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Demandes d'envoi
        </h1>
        <Link
          to="/demandes-envoi/nouveau"
          className="bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors"
        >
          Nouvelle demande
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par numéro, destinataire..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
        />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Chargement...</p>}
      {isError && (
        <p className="text-sm text-red-600">
          Erreur lors du chargement des demandes.
        </p>
      )}

      {data && (
        <>
          <DataTable
            columns={columns}
            data={data.data}
            emptyMessage="Aucune demande d'envoi trouvée"
          />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
