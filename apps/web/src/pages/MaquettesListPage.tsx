import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Maquette, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import DataTable, { type Column } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
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

export default function MaquettesListPage() {
  const [search, setSearch] = useState("");
  const { page, pageSize, setPage, queryParams } = usePagination();

  const { data, isLoading, isError } = useQuery<PaginatedResult<Maquette>>({
    queryKey: ["maquettes", { ...queryParams, search }],
    queryFn: () =>
      api.get("/maquettes", { ...queryParams, search: search || undefined }),
  });

  const columns: Column<Maquette>[] = [
    { header: "Référence", accessor: "reference" },
    { header: "Libellé", accessor: "libelle" },
    {
      header: "État",
      render: (row) => (
        <Badge
          variant={etatBadgeVariant[row.etat] ?? "default"}
          text={etatLabel[row.etat] ?? row.etat}
        />
      ),
    },
    { header: "Type", accessor: "typeMaquette" },
    { header: "Site", accessor: "site" },
    {
      header: "Actions",
      render: (row) => (
        <Link
          to={`/maquettes/${row.id}`}
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
        <h1 className="text-2xl font-bold text-gray-800">Maquettes</h1>
        <Link
          to="/maquettes/nouveau"
          className="bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors"
        >
          Nouvelle maquette
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par référence, libellé..."
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
          Erreur lors du chargement des maquettes.
        </p>
      )}

      {data && (
        <>
          <DataTable
            columns={columns}
            data={data.data}
            emptyMessage="Aucune maquette trouvée"
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
