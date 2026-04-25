import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SiteValue, EntrepriseValue } from "@/hooks/use-referentiels";

const typeInfo: Record<string, { label: string; description: string; group: string }> = {
  TYPE_END: { label: "Types END", description: "UT, RT, ET, PT, MT...", group: "Matériels" },
  TYPE_MATERIEL: { label: "Types de matériel", description: "Traducteur, Appareil, Sonde...", group: "Matériels" },
  TYPE_TRADUCTEUR: { label: "Types de traducteur", description: "Mono-élément, Phased Array...", group: "Matériels" },
  GROUPE: { label: "Groupes", description: "UT Conventionnel, PA...", group: "Matériels" },
  ETAT_MATERIEL: { label: "États matériel", description: "Disponible, En service...", group: "Matériels" },
  COMPLETUDE: { label: "Complétude", description: "Complet, Incomplet...", group: "Matériels" },
  MOTIF_PRET: { label: "Motifs de prêt", description: "Formation, Chantier...", group: "Matériels" },
  TYPE_MAQUETTE: { label: "Types de maquette", description: "Mutualisée, Locale...", group: "Maquettes" },
  COMPOSANT: { label: "Composants", description: "Tuyauterie, Cuve...", group: "Maquettes" },
  CATEGORIE: { label: "Catégories", description: "Catégories de maquettes", group: "Maquettes" },
  FORME: { label: "Formes", description: "Tubulaire, Plane...", group: "Maquettes" },
  TYPE_ASSEMBLAGE: { label: "Types d'assemblage", description: "Soudure bout à bout...", group: "Maquettes" },
  MATIERE: { label: "Matières", description: "Acier carbone, Inox...", group: "Maquettes" },
  PROCEDURE: { label: "Procédures", description: "Procédures de contrôle", group: "Maquettes" },
  TYPE_CONTROLE: { label: "Types de contrôle", description: "ISI, Hydrotest...", group: "Maquettes" },
  ETAT_MAQUETTE: { label: "États maquette", description: "Disponible, Indisponible...", group: "Maquettes" },
  URGENCE: { label: "Urgences", description: "Normal, Urgent...", group: "Maquettes" },
};

function GroupIcon({ group }: { group: string }) {
  if (group === "Matériels") {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.88-3.39a.562.562 0 010-.974l5.88-3.39a.562.562 0 01.562 0l5.88 3.39a.562.562 0 010 .974l-5.88 3.39a.562.562 0 01-.562 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

export default function AdminReferentielsPage() {
  const { data: types } = useQuery<string[]>({
    queryKey: ["referentiels", "types"],
    queryFn: () => api.get("/referentiels/types"),
  });

  const { data: sites } = useQuery<SiteValue[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/sites"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: entreprises } = useQuery<EntrepriseValue[]>({
    queryKey: ["entreprises"],
    queryFn: () => api.get("/entreprises"),
    staleTime: 5 * 60 * 1000,
  });

  const groups = ["Matériels", "Maquettes"];

  const typesGrouped = groups.map((group) => ({
    group,
    items: (types ?? [])
      .filter((t) => (typeInfo[t]?.group ?? "Matériels") === group)
      .map((t) => ({ type: t, ...typeInfo[t] })),
  }));

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Administration des référentiels</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez les listes de valeurs utilisées dans les formulaires de l'application.
        </p>
      </div>

      {/* Entités avec adresses */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Entités
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/sites"
            className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-edf-blue/20 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-edf-blue transition-colors">
                    Sites
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {sites?.length ?? 0}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Sites EDF / CNPE avec adresses</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/entreprises"
            className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-edf-blue/20 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-edf-blue transition-colors">
                    Entreprises
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {entreprises?.length ?? 0}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Entreprises et fournisseurs</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Listes de référence par groupe */}
      {typesGrouped.map(({ group, items }) => (
        <div key={group} className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {group}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link
                key={item.type}
                to={`/admin/referentiels/${item.type}`}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-edf-blue/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-500 group-hover:bg-edf-blue/10 group-hover:text-edf-blue flex items-center justify-center flex-shrink-0 transition-colors">
                    <GroupIcon group={group} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 group-hover:text-edf-blue transition-colors">
                      {item.label ?? item.type}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{item.description ?? ""}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-edf-blue transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
