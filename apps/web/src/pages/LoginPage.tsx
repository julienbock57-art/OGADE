import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-edf-blue rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">O</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-wide">OGADE</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des Actifs END</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Connexion</h2>
          <p className="text-sm text-gray-500 mb-6">
            Connectez-vous avec votre compte Microsoft professionnel pour accéder à l'application.
          </p>

          <button
            onClick={login}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 bg-[#2F2F2F] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            {loading ? "Chargement..." : "Se connecter avec Microsoft"}
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Seuls les comptes autorisés par un administrateur peuvent accéder à l'application.
          </p>
        </div>
      </div>
    </div>
  );
}
