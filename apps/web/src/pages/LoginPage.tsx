import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { loginMicrosoft, loginLocal, loading, authConfig } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginLocal(email, password);
    } catch (err) {
      setError((err as Error).message || "Connexion échouée");
    } finally {
      setSubmitting(false);
    }
  };

  const showMicrosoft = authConfig?.microsoftAuth;
  const showLocal = authConfig?.localAuth;

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
            Connectez-vous pour accéder à l'application.
          </p>

          {showMicrosoft && (
            <button
              onClick={loginMicrosoft}
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
          )}

          {showMicrosoft && showLocal && (
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OU</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {showLocal && (
            <form onSubmit={handleLocalLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors"
                  placeholder="nom@exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors"
                  placeholder="Mot de passe"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="w-full bg-edf-blue text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 mt-5 text-center">
            Seuls les comptes autorisés par un administrateur peuvent accéder à l'application.
          </p>
        </div>
      </div>
    </div>
  );
}
