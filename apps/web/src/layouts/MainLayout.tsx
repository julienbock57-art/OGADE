import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="h-16 bg-edf-blue text-white flex items-center px-6 shadow-md">
        <Link to="/" className="text-xl font-bold tracking-wide mr-10">
          OGADE
        </Link>

        <div className="flex items-center space-x-6 text-sm font-medium">
          <Link
            to="/materiels"
            className="hover:text-gray-200 transition-colors"
          >
            Matériels END
          </Link>
          <Link
            to="/maquettes"
            className="hover:text-gray-200 transition-colors"
          >
            Maquettes
          </Link>
          <Link
            to="/demandes-envoi"
            className="hover:text-gray-200 transition-colors"
          >
            Demandes d'envoi
          </Link>
        </div>

        <div className="ml-auto flex items-center space-x-4 text-sm">
          <span>{user?.email ?? "utilisateur@edf.fr"}</span>
          <a
            href="#"
            title="Mode opératoire"
            className="hover:text-gray-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </a>
        </div>
      </nav>

      {/* Welcome banner — home page only */}
      {isHome && (
        <div className="bg-edf-blue/90 text-white py-6 px-6 text-center">
          <h1 className="text-2xl font-semibold">
            Bienvenue sur OGADE, l'outil de gestion des actifs END de la DQI
          </h1>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
