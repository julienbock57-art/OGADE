import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type StatsResponse = {
  materiels: { total: number; data: { etat: string }[] };
  maquettes: { total: number; data: { etat: string }[] };
  demandes: { total: number; data: { statut: string }[] };
};

function useStats() {
  const materiels = useQuery({
    queryKey: ["materiels", "stats"],
    queryFn: () => api.get<StatsResponse["materiels"]>("/materiels", { page: 1, pageSize: 200 }),
  });
  const maquettes = useQuery({
    queryKey: ["maquettes", "stats"],
    queryFn: () => api.get<StatsResponse["maquettes"]>("/maquettes", { page: 1, pageSize: 200 }),
  });
  const demandes = useQuery({
    queryKey: ["demandes-envoi", "stats"],
    queryFn: () => api.get<StatsResponse["demandes"]>("/demandes-envoi", { page: 1, pageSize: 200 }),
  });
  return { materiels, maquettes, demandes };
}

function KpiCard({
  title,
  value,
  subtitle,
  color,
  icon,
  to,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${color.replace("text-", "bg-")}/10 group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
      </div>
    </Link>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</span>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { materiels, maquettes, demandes } = useStats();

  const matData = materiels.data?.data ?? [];
  const maqData = maquettes.data?.data ?? [];
  const demData = demandes.data?.data ?? [];

  const matTotal = materiels.data?.total ?? 0;
  const maqTotal = maquettes.data?.total ?? 0;
  const demTotal = demandes.data?.total ?? 0;

  const countBy = <T,>(arr: T[], field: keyof T, value: string) =>
    arr.filter((item) => item[field] === value).length;

  const matDispo = countBy(matData, "etat" as keyof typeof matData[0], "DISPONIBLE");
  const matEnService = countBy(matData, "etat" as keyof typeof matData[0], "EN_SERVICE");
  const matPrete = countBy(matData, "etat" as keyof typeof matData[0], "PRETE");
  const matReparation = countBy(matData, "etat" as keyof typeof matData[0], "EN_REPARATION");

  const maqStock = countBy(maqData, "etat" as keyof typeof maqData[0], "STOCK");
  const maqEmpruntee = countBy(maqData, "etat" as keyof typeof maqData[0], "EMPRUNTEE");
  const maqControle = countBy(maqData, "etat" as keyof typeof maqData[0], "EN_CONTROLE");
  const maqEnvoyee = countBy(maqData, "etat" as keyof typeof maqData[0], "ENVOYEE");

  const demBrouillon = countBy(demData, "statut" as keyof typeof demData[0], "BROUILLON");
  const demEnvoyee = countBy(demData, "statut" as keyof typeof demData[0], "ENVOYEE");
  const demTransit = countBy(demData, "statut" as keyof typeof demData[0], "EN_TRANSIT");
  const demRecue = countBy(demData, "statut" as keyof typeof demData[0], "RECUE");

  const isLoading = materiels.isLoading || maquettes.isLoading || demandes.isLoading;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Bonjour, {user?.prenom ?? "Utilisateur"}
        </h1>
        <p className="text-gray-500 mt-1">
          Tableau de bord OGADE — Vue d'ensemble des actifs END de la DQI
        </p>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Matériels END"
            value={matTotal}
            subtitle={`${matDispo} disponibles`}
            color="text-blue-600"
            to="/materiels"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.88-3.39a.562.562 0 010-.974l5.88-3.39a.562.562 0 01.562 0l5.88 3.39a.562.562 0 010 .974l-5.88 3.39a.562.562 0 01-.562 0z" />
              </svg>
            }
          />
          <KpiCard
            title="Maquettes"
            value={maqTotal}
            subtitle={`${maqStock} en stock`}
            color="text-indigo-600"
            to="/maquettes"
            icon={
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <KpiCard
            title="Demandes d'envoi"
            value={demTotal}
            subtitle={`${demTransit} en transit`}
            color="text-amber-600"
            to="/demandes-envoi"
            icon={
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            }
          />
          <KpiCard
            title="Taux disponibilité"
            value={matTotal > 0 ? `${Math.round((matDispo / matTotal) * 100)}%` : "—"}
            subtitle="Matériels disponibles"
            color="text-emerald-600"
            to="/materiels"
            icon={
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Matériels breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Répartition Matériels</h2>
            <Link to="/materiels" className="text-xs text-edf-blue hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            <StatusBar label="Disponible" count={matDispo} total={matTotal} color="bg-emerald-500" />
            <StatusBar label="En service" count={matEnService} total={matTotal} color="bg-blue-500" />
            <StatusBar label="Prêté" count={matPrete} total={matTotal} color="bg-amber-500" />
            <StatusBar label="En réparation" count={matReparation} total={matTotal} color="bg-red-500" />
          </div>
        </div>

        {/* Maquettes breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Répartition Maquettes</h2>
            <Link to="/maquettes" className="text-xs text-edf-blue hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            <StatusBar label="En stock" count={maqStock} total={maqTotal} color="bg-emerald-500" />
            <StatusBar label="Empruntée" count={maqEmpruntee} total={maqTotal} color="bg-amber-500" />
            <StatusBar label="En contrôle" count={maqControle} total={maqTotal} color="bg-blue-500" />
            <StatusBar label="Envoyée" count={maqEnvoyee} total={maqTotal} color="bg-purple-500" />
          </div>
        </div>

        {/* Demandes breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Suivi Demandes</h2>
            <Link to="/demandes-envoi" className="text-xs text-edf-blue hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            <StatusBar label="Brouillon" count={demBrouillon} total={demTotal} color="bg-gray-400" />
            <StatusBar label="Envoyée" count={demEnvoyee} total={demTotal} color="bg-blue-500" />
            <StatusBar label="En transit" count={demTransit} total={demTotal} color="bg-amber-500" />
            <StatusBar label="Reçue" count={demRecue} total={demTotal} color="bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/materiels/nouveau"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-edf-blue/30 hover:bg-edf-blue/5 transition-colors group"
          >
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 font-medium">Nouveau matériel</span>
          </Link>
          <Link
            to="/maquettes/nouveau"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-edf-blue/30 hover:bg-edf-blue/5 transition-colors group"
          >
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 font-medium">Nouvelle maquette</span>
          </Link>
          <Link
            to="/demandes-envoi/nouveau"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-edf-blue/30 hover:bg-edf-blue/5 transition-colors group"
          >
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 font-medium">Demande d'envoi</span>
          </Link>
          <Link
            to="/agents"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-edf-blue/30 hover:bg-edf-blue/5 transition-colors group"
          >
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 font-medium">Gérer les agents</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
