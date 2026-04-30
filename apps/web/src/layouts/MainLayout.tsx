import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import QrScannerModal from "@/components/QrScannerModal";
import ChatWidget from "@/components/ChatWidget";

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
    qrscan:   "M3 7V4a1 1 0 0 1 1-1h3 M13 3h3a1 1 0 0 1 1 1v3 M17 13v3a1 1 0 0 1-1 1h-3 M7 17H4a1 1 0 0 1-1-1v-3 M7 7h2v2H7z M11 7h2v2h-2z M7 11h2v2H7z M12 12h1v1h-1z",
    settings: "M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16 10a6 6 0 0 1-.1 1l2 1.5-2 3.4-2.3-1a6 6 0 0 1-1.7 1l-.3 2.5h-3.2l-.3-2.5a6 6 0 0 1-1.7-1l-2.3 1-2-3.4 2-1.5a6 6 0 0 1 0-2l-2-1.5 2-3.4 2.3 1a6 6 0 0 1 1.7-1L8.4 2h3.2l.3 2.5a6 6 0 0 1 1.7 1l2.3-1 2 3.4-2 1.5a6 6 0 0 1 .1 1z",
    logout:   "M14 10l3 0M14 10l-2-2m2 2l-2 2 M10 14v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1",
    chevl:    "M12.5 15.83L6.67 10l5.83-5.83",
    chevr:    "M7.5 4.17L13.33 10l-5.83 5.83",
    menu:     "M4 5h12M4 10h12M4 15h12",
    x:        "M5 5l10 10M15 5L5 15",
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
      { to: "/reservations", label: "Réservations", icon: "star" },
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

const SIDEBAR_EXPANDED = 220;
const SIDEBAR_COLLAPSED = 56;

export default function MainLayout() {
  const location = useLocation();
  const { user, logout, authConfig } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("ogade_sidebar") === "collapsed"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("ogade_sidebar", collapsed ? "collapsed" : "expanded"); } catch {}
  }, [collapsed]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const authRequired = authConfig?.microsoftAuth || authConfig?.localAuth;
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div className="min-h-screen" style={{ display: "grid", gridTemplateColumns: `${sidebarWidth}px 1fr`, transition: "grid-template-columns 0.2s ease" }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--line)",
          padding: collapsed ? "18px 8px" : "18px 14px",
          height: "100vh",
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          transition: "width 0.2s ease, padding 0.2s ease",
          overflow: "hidden",
          zIndex: 40,
        }}
        className="hidden lg:flex"
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile sidebar (slide-over) */}
      <aside
        className="lg:hidden"
        style={{
          position: "fixed",
          inset: "0 auto 0 0",
          width: SIDEBAR_EXPANDED,
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--line)",
          padding: "18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 40,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {renderSidebarContent(true)}
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
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden"
            style={{
              appearance: "none", border: "none", background: "none",
              padding: 6, marginLeft: -6, color: "var(--ink-2)", cursor: "pointer",
              display: "flex",
            }}
          >
            <Icon name="menu" size={18} />
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
            <button type="button" className="icon-btn" title="Scanner un QR code" onClick={() => setShowScanner(true)}><Icon name="qrscan" size={14} /></button>
            <button type="button" className="icon-btn"><Icon name="settings" size={14} /></button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>

      {showScanner && <QrScannerModal onClose={() => setShowScanner(false)} />}
      <ChatWidget />
    </div>
  );

  function renderSidebarContent(isMobile: boolean) {
    const showLabels = isMobile || !collapsed;

    return (
      <>
        {/* Brand + collapse toggle */}
        <div
          className="flex items-center pb-4 mb-2"
          style={{ borderBottom: "1px solid var(--line-2)", gap: 10, paddingLeft: collapsed && !isMobile ? 2 : 6, paddingRight: collapsed && !isMobile ? 2 : 6 }}
        >
          <Link to="/" className="flex items-center gap-[10px]" style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
            <div
              className="grid place-items-center text-white font-bold text-[13px] shrink-0"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "linear-gradient(135deg, var(--accent) 0%, oklch(0.55 0.20 320) 100%)",
                boxShadow: "0 1px 0 rgba(255,255,255,.3) inset, 0 1px 2px rgba(0,0,0,.15)",
              }}
            >
              O
            </div>
            {showLabels && (
              <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                <div className="font-bold text-[14px] tracking-[0.02em]" style={{ color: "var(--ink)" }}>OGADE</div>
                <div className="text-[10px] tracking-[0.06em] uppercase" style={{ color: "var(--ink-3)" }}>Matériel END</div>
              </div>
            )}
          </Link>

          {/* Collapse/expand toggle (desktop only) */}
          {!isMobile && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? "Déplier le menu" : "Replier le menu"}
              style={{
                appearance: "none", border: "none", background: "none",
                padding: 4, borderRadius: 6, color: "var(--ink-3)",
                cursor: "pointer", display: "flex", flexShrink: 0,
                transition: "color 0.12s, background 0.12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--bg-sunken)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "none"; }}
            >
              <Icon name={collapsed ? "chevr" : "chevl"} size={14} />
            </button>
          )}

          {/* Close button (mobile only) */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              style={{
                appearance: "none", border: "none", background: "none",
                padding: 4, borderRadius: 6, color: "var(--ink-3)",
                cursor: "pointer", display: "flex", flexShrink: 0,
              }}
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Nav sections */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              {showLabels ? (
                <div className="nav-sect">{section.label}</div>
              ) : (
                <div style={{ height: 8 }} />
              )}
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-item ${isActive(item.to) ? "active" : ""}`}
                  title={collapsed && !isMobile ? item.label : undefined}
                  style={collapsed && !isMobile ? { justifyContent: "center", padding: "7px 0" } : undefined}
                >
                  <Icon name={item.icon} />
                  {showLabels && item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer — user */}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line-2)" }}>
          <div
            className="flex items-center rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
            style={{ padding: collapsed && !isMobile ? "6px 0" : 6, gap: 10, justifyContent: collapsed && !isMobile ? "center" : undefined }}
          >
            <span
              className="grid place-items-center text-[11px] font-semibold text-white shrink-0"
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "oklch(0.70 0.15 275)",
                boxShadow: "0 0 0 2px white, 0 0 0 3px var(--line-2)",
              }}
            >
              {(user?.prenom?.[0] ?? "U") + (user?.nom?.[0] ?? "")}
            </span>
            {showLabels && (
              <>
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
                    type="button"
                    onClick={logout}
                    className="icon-btn"
                    style={{ padding: 5, border: 0 }}
                    title="Déconnexion"
                  >
                    <Icon name="logout" size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }
}
