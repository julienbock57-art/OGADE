import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    home:     "M3 10l7-7 7 7v6a2 2 0 0 1-2 2h-3v-5H8v5H5a2 2 0 0 1-2-2v-6z",
    list:     "M4 5h12M4 10h12M4 15h12",
    box:      "M3 6l7-3 7 3v8l-7 3-7-3V6z M3 6l7 3 7-3 M10 9v8",
    truck:    "M2 5h10v9H2z M12 8h4l2 3v3h-6 M5 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3 M14 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
    user:     "M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M4 17a6 6 0 0 1 12 0",
    star:     "M10 3l2.3 4.6 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.4l5.2-.8L10 3z",
    alert:    "M10 7v4m0 2v.01 M2 16L10 3l8 13H2z",
    swap:     "M5 7h11l-3-3 M15 13H4l3 3",
    cal:      "M4 5h12v12H4z M4 8h12 M7 3v4 M13 3v4",
    flask:    "M8 3h4 M9 3v5l-4 8a2 2 0 0 0 2 3h6a2 2 0 0 0 2-3l-4-8V3",
    map:      "M3 5l5-2 4 2 5-2v12l-5 2-4-2-5 2z M8 3v12 M12 5v12",
    settings: "M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16 10a6 6 0 0 1-.1 1l2 1.5-2 3.4-2.3-1a6 6 0 0 1-1.7 1l-.3 2.5h-3.2l-.3-2.5a6 6 0 0 1-1.7-1l-2.3 1-2-3.4 2-1.5a6 6 0 0 1 0-2l-2-1.5 2-3.4 2.3 1a6 6 0 0 1 1.7-1L8.4 2h3.2l.3 2.5a6 6 0 0 1 1.7 1l2.3-1 2 3.4-2 1.5a6 6 0 0 1 .1 1z",
    logout:   "M14 10l3 0M14 10l-2-2m2 2l-2 2 M10 14v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1",
  };
  const d = paths[name] || "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const navSections = [
  {
    label: "Inventaire",
    items: [
      { to: "/", label: "Tableau de bord", icon: "home" },
      { to: "/materiels", label: "Matériels END", icon: "list" },
      { to: "/maquettes", label: "Maquettes", icon: "box" },
      { to: "/demandes-envoi", label: "Envois & retours", icon: "truck" },
      { to: "/localisation", label: "Localisation", icon: "map" },
      { to: "/agents", label: "Agents", icon: "user" },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/referentiels", label: "Référentiels", icon: "settings" },
      { to: "/admin/sites", label: "Sites & groupes", icon: "map" },
      { to: "/admin/entreprises", label: "Entreprises", icon: "flask" },
      { to: "/admin/agents", label: "Agents autorisés", icon: "star" },
    ],
  },
];

export default function MainLayout() {
  const location = useLocation();
  const { user, logout, authConfig } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const authRequired = authConfig?.microsoftAuth || authConfig?.localAuth;

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: "220px 1fr" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className="fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-transform duration-200 lg:translate-x-0"
        style={{
          width: 220,
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--line)",
          padding: "18px 14px",
          gap: 4,
          height: "100vh",
          position: "sticky",
          top: 0,
          transform: sidebarOpen ? undefined : undefined,
        }}
      >
        {/* Brand */}
        <Link to="/" className="flex items-center gap-[10px] px-1.5 pb-4 mb-2" style={{ borderBottom: "1px solid var(--line-2)" }} onClick={() => setSidebarOpen(false)}>
          <div
            className="w-[30px] h-[30px] rounded-lg grid place-items-center text-white font-bold text-[13px]"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, oklch(0.55 0.20 320) 100%)",
              boxShadow: "0 1px 0 rgba(255,255,255,.3) inset, 0 1px 2px rgba(0,0,0,.15)",
            }}
          >
            O
          </div>
          <div>
            <div className="font-bold text-[14px] tracking-[0.02em]" style={{ color: "var(--ink)" }}>OGADE</div>
            <div className="text-[10px] tracking-[0.06em] uppercase" style={{ color: "var(--ink-3)" }}>Matériel END</div>
          </div>
        </Link>

        {/* Nav sections */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="nav-sect">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`nav-item ${isActive(item.to) ? "active" : ""}`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer — user */}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line-2)" }}>
          <div className="flex items-center gap-[10px] p-1.5 rounded-lg hover:bg-[var(--bg-sunken)] transition-colors">
            <span
              className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-semibold text-white shrink-0"
              style={{ background: "oklch(0.70 0.15 275)", boxShadow: "0 0 0 2px white, 0 0 0 3px var(--line-2)" }}
            >
              {(user?.prenom?.[0] ?? "U") + (user?.nom?.[0] ?? "")}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium truncate" style={{ color: "var(--ink)" }}>
                {user ? `${user.prenom} ${user.nom}` : "Utilisateur"}
              </div>
              <div className="text-[10.5px] truncate" style={{ color: "var(--ink-3)" }}>
                {user?.roles?.[0] ?? user?.email ?? ""}
              </div>
            </div>
            {authRequired && (
              <button
                onClick={logout}
                className="icon-btn"
                style={{ padding: 5, border: 0 }}
                title="Déconnexion"
              >
                <Icon name="logout" size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col min-w-0" style={{ background: "var(--bg)" }}>
        {/* Topbar */}
        <header
          className="flex items-center gap-3.5 sticky top-0 z-20"
          style={{
            padding: "14px 24px",
            background: "var(--bg-panel)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2"
            style={{ color: "var(--ink-2)" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6}>
              <path d="M4 5h12M4 10h12M4 15h12" />
            </svg>
          </button>

          <div className="text-[12px]" style={{ color: "var(--ink-3)" }}>
            Espace END <span style={{ color: "var(--ink-4)" }}>/</span>{" "}
            <b style={{ color: "var(--ink)", fontWeight: 600 }}>
              {location.pathname === "/" && "Tableau de bord"}
              {location.pathname.startsWith("/materiels") && "Gestion du matériel"}
              {location.pathname.startsWith("/maquettes") && "Maquettes"}
              {location.pathname.startsWith("/demandes") && "Envois & retours"}
              {location.pathname.startsWith("/localisation") && "Localisation des actifs"}
              {location.pathname.startsWith("/agents") && "Agents"}
              {location.pathname.startsWith("/admin") && "Administration"}
            </b>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button className="icon-btn"><Icon name="settings" size={14} /></button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
