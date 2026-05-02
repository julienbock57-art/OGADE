import { useEffect } from "react";
import type { ThemePreference } from "@ogade/shared";
import { useSettings } from "@/lib/settings";

const ICONS: Record<string, string> = {
  x:     "M5 5l10 10M15 5L5 15",
  sun:   "M10 3v2 M10 15v2 M3 10h2 M15 10h2 M5.6 5.6l1.4 1.4 M13 13l1.4 1.4 M5.6 14.4L7 13 M13 7l1.4-1.4 M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  moon:  "M16 11.5A6.5 6.5 0 1 1 8.5 4a5 5 0 0 0 7.5 7.5z",
  auto:  "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M10 2v16",
};

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const d = ICONS[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string; sub: string }[] = [
  { value: "light", label: "Mode clair",  icon: "sun",  sub: "Fond clair, texte sombre"  },
  { value: "dark",  label: "Mode sombre", icon: "moon", sub: "Fond sombre, texte clair"  },
  { value: "auto",  label: "Automatique", icon: "auto", sub: "Suit le système d'exploitation" },
];

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const currentTheme: ThemePreference = settings.theme ?? "auto";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <h2 className="modal-title">Paramètres</h2>
            <div className="modal-sub">
              Préférences personnelles enregistrées sur ton compte
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer" type="button">
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="modal-body">
          <section>
            <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 10px" }}>
              Apparence
            </h3>
            <div className="vstack" style={{ gap: 8 }}>
              {THEME_OPTIONS.map((opt) => {
                const active = currentTheme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { void updateSettings({ theme: opt.value }); }}
                    style={{
                      appearance: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1.5px solid ${active ? "var(--accent)" : "var(--line)"}`,
                      background: active ? "var(--accent-soft)" : "var(--bg-panel)",
                      color: "var(--ink)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      transition: "border-color 0.12s, background 0.12s",
                    }}
                  >
                    <span
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        display: "grid", placeItems: "center",
                        background: active ? "var(--accent)" : "var(--bg-sunken)",
                        color: active ? "white" : "var(--ink-2)",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={opt.icon} size={18} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? "var(--accent-ink)" : "var(--ink)" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {opt.sub}
                      </div>
                    </span>
                    <span
                      style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--line)"}`,
                        background: active ? "var(--accent)" : "transparent",
                        display: "grid", placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {active && (
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth={3}>
                          <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="modal-foot">
          <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            Les changements sont enregistrés automatiquement
          </span>
          <button type="button" className="obtn accent" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
