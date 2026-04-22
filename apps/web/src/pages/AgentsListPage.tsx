import { useQuery } from "@tanstack/react-query";
import type { PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import DataTable, { type Column } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import Badge from "@/components/Badge";

interface AgentWithRoles {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  actif: boolean;
  roles?: { role: { code: string; label: string } }[];
}

export default function AgentsListPage() {
  const { page, pageSize, setPage, queryParams } = usePagination();

  const { data, isLoading, isError } = useQuery<
    PaginatedResult<AgentWithRoles>
  >({
    queryKey: ["agents", queryParams],
    queryFn: () => api.get("/agents", queryParams),
  });

  const columns: Column<AgentWithRoles>[] = [
    { header: "Nom", accessor: "nom" },
    { header: "Prénom", accessor: "prenom" },
    { header: "Email", accessor: "email" },
    {
      header: "Actif",
      render: (row) =>
        row.actif ? (
          <Badge variant="success" text="Actif" />
        ) : (
          <Badge variant="danger" text="Inactif" />
        ),
    },
    {
      header: "Rôles",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles?.map((ar) => (
            <Badge
              key={ar.role.code}
              variant="info"
              text={ar.role.label}
            />
          )) ?? "-"}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agents</h1>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Chargement...</p>}
      {isError && (
        <p className="text-sm text-red-600">
          Erreur lors du chargement des agents.
        </p>
      )}

      {data && (
        <>
          <DataTable
            columns={columns}
            data={data.data}
            emptyMessage="Aucun agent trouvé"
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
