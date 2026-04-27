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
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{ maxWidth: 400, width: "100%" }}>
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, var(--accent) 0%, oklch(0.55 0.20 320) 100%)",
            marginBottom: 14,
            boxShadow: "0 1px 0 rgba(255,255,255,.2) inset, 0 2px 8px oklch(0.50 0.20 275 / .3)",
          }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 22, letterSpacing: "-0.01em" }}>O</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>OGADE</h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Gestion des Actifs END</p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          padding: "28px 28px 24px",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "0 0 6px" }}>Connexion</h2>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 22px" }}>
            Connectez-vous pour accéder à l'application.
          </p>

          {showMicrosoft && (
            <button
              onClick={loginMicrosoft}
              disabled={loading}
              style={{
                width: "100%",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "#2F2F2F", color: "white",
                border: "1px solid #2F2F2F",
                padding: "9px 16px", borderRadius: 8,
                fontWeight: 500, fontSize: 13,
                cursor: "pointer", opacity: loading ? 0.5 : 1,
                transition: "background 0.12s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              {loading ? "Chargement..." : "Se connecter avec Microsoft"}
            </button>
          )}

          {showMicrosoft && showLocal && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 500, letterSpacing: "0.04em" }}>OU</span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
          )}

          {showLocal && (
            <form onSubmit={handleLocalLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-2)", marginBottom: 5 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="oinput"
                  placeholder="nom@exemple.com"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-2)", marginBottom: 5 }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="oinput"
                  placeholder="Mot de passe"
                />
              </div>

              {error && (
                <div style={{
                  background: "var(--rose-soft)",
                  border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)",
                  borderRadius: 8, padding: "10px 14px",
                }}>
                  <p style={{ fontSize: 13, color: "var(--rose)", margin: 0 }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="obtn accent"
                style={{ width: "100%", justifyContent: "center", padding: "9px 16px" }}
              >
                {submitting ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          )}

          <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 20, textAlign: "center" }}>
            Seuls les comptes autorisés par un administrateur peuvent accéder à l'application.
          </p>
        </div>
      </div>
    </div>
  );
}
