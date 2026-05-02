import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ThemePreference, UserSettings } from "@ogade/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type SettingsContextValue = {
  settings: UserSettings;
  /** Thème actuellement appliqué (résout "auto" en "light"/"dark"). */
  resolvedTheme: "light" | "dark";
  /** Met à jour des préférences (merge + persistance backend). */
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
};

const LOCAL_KEY = "ogade_user_settings";

const SettingsContext = createContext<SettingsContextValue>({
  settings: {},
  resolvedTheme: "light",
  updateSettings: async () => {},
});

function loadLocal(): UserSettings {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as UserSettings) : {};
  } catch {
    return {};
  }
}

function saveLocal(s: UserSettings) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

function applyTheme(pref: ThemePreference): "light" | "dark" {
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved: "light" | "dark" =
    pref === "dark" ? "dark" :
    pref === "light" ? "light" :
    (sysDark ? "dark" : "light");
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => loadLocal());
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    applyTheme(loadLocal().theme ?? "auto"),
  );

  // Quand la pref `theme` change, applique au DOM
  useEffect(() => {
    setResolvedTheme(applyTheme(settings.theme ?? "auto"));
  }, [settings.theme]);

  // Si "auto", suit les changements système
  useEffect(() => {
    if (settings.theme && settings.theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(applyTheme("auto"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  // Au login : récupère les settings côté serveur et merge
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .get<UserSettings | null>("/auth/me/settings")
      .then((server) => {
        if (cancelled || !server) return;
        const merged: UserSettings = { ...loadLocal(), ...server };
        setSettings(merged);
        saveLocal(merged);
      })
      .catch(() => { /* silencieux : reste sur la version locale */ });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...patch };
      saveLocal(merged);
      return merged;
    });
    if (!user) return; // mode dev sans compte → uniquement local
    try {
      await api.patch<UserSettings>("/auth/me/settings", patch);
    } catch {
      // Network error → on garde la version locale ; sera resync au prochain refresh
    }
  }, [user]);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, resolvedTheme, updateSettings }),
    [settings, resolvedTheme, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
