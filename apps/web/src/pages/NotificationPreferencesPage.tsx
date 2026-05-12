/**
 * NotificationPreferencesPage — /parametres/notifications.
 * Permet à l'utilisateur d'activer / désactiver les notifications in-app
 * par type d'événement. La colonne email est grisée (à venir).
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  NOTIFICATION_TYPES,
  notifBadgeClass,
  notifTypeLabel,
  type NotificationPreference,
  type NotificationType,
} from "@/lib/notifications";

type PrefItem = { notifType: string; inApp: boolean; email?: boolean };

function Icon({ name, size = 14 }: { name: "save" | "info"; size?: number }) {
  const paths: Record<string, string> = {
    save: "M4 4h10l2 2v10H4z M7 4v5h6V4 M7 16v-4h6v4",
    info: "M10 9v5 M10 6.01V6 M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0z",
  };
  const d = paths[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-2px" }}
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i === 0 ? p : "M" + p} />
      ))}
    </svg>
  );
}

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<NotificationPreference[]>({
    queryKey: ["notifications", "preferences"],
    queryFn: () => api.get("/notifications/preferences"),
  });

  // État local — initialisé à la réception des données serveur.
  const [state, setState] = useState<Record<string, boolean>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map serveur (par défaut : tout activé in-app si pas de préférence sauvegardée).
  const serverMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const item of data ?? []) {
      m[item.notifType] = item.inApp;
    }
    return m;
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, boolean> = {};
    for (const t of NOTIFICATION_TYPES) {
      next[t.type] = t.type in serverMap ? serverMap[t.type] : true;
    }
    setState(next);
  }, [data, serverMap]);

  const isDirty = useMemo(() => {
    for (const t of NOTIFICATION_TYPES) {
      const current = state[t.type] ?? true;
      const saved = t.type in serverMap ? serverMap[t.type] : true;
      if (current !== saved) return true;
    }
    return false;
  }, [state, serverMap]);

  const putPrefsMut = useMutation({
    mutationFn: (items: PrefItem[]) =>
      api.put<{ ok: true }>("/notifications/preferences", { items }),
    onSuccess: () => {
      setSavedMessage("Préférences enregistrées.");
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      window.setTimeout(() => setSavedMessage(null), 3000);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setErrorMessage(msg);
      setSavedMessage(null);
    },
  });

  function toggle(type: NotificationType) {
    setState((prev) => ({ ...prev, [type]: !(prev[type] ?? true) }));
  }

  function handleSave() {
    const items: PrefItem[] = NOTIFICATION_TYPES.map((t) => ({
      notifType: t.type,
      inApp: state[t.type] ?? true,
    }));
    putPrefsMut.mutate(items);
  }

  function handleReset() {
    const next: Record<string, boolean> = {};
    for (const t of NOTIFICATION_TYPES) {
      next[t.type] = t.type in serverMap ? serverMap[t.type] : true;
    }
    setState(next);
  }

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
            Espace END / Paramètres
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              color: "var(--ink)",
            }}
          >
            Préférences de notifications
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-3)",
              marginTop: 2,
              marginBottom: 0,
            }}
          >
            Choisis les événements pour lesquels tu souhaites recevoir une notification.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="obtn"
            onClick={handleReset}
            disabled={!isDirty || putPrefsMut.isPending}
          >
            Annuler
          </button>
          <button
            type="button"
            className="obtn accent"
            onClick={handleSave}
            disabled={!isDirty || putPrefsMut.isPending}
          >
            <Icon name="save" size={13} />
            {putPrefsMut.isPending ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ padding: "0 24px", marginBottom: 12 }}>
        <div
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-line, color-mix(in oklch, var(--accent) 25%, transparent))",
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            fontSize: 12.5,
            color: "var(--accent-ink, var(--ink))",
          }}
        >
          <Icon name="info" size={16} />
          <div>
            Les notifications email seront ajoutées dans une prochaine version.
            Désactive les types qui te gênent pour ne plus les recevoir dans la cloche.
          </div>
        </div>
      </div>

      {/* Feedback */}
      {savedMessage && (
        <div style={{ padding: "0 24px", marginBottom: 12 }}>
          <div
            style={{
              background: "var(--emerald-soft, color-mix(in oklch, var(--emerald, #10b981) 14%, transparent))",
              border: "1px solid color-mix(in oklch, var(--emerald, #10b981) 30%, transparent)",
              color: "var(--emerald, #047857)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12.5,
            }}
          >
            {savedMessage}
          </div>
        </div>
      )}
      {errorMessage && (
        <div style={{ padding: "0 24px", marginBottom: 12 }}>
          <div
            style={{
              background: "var(--rose-soft, color-mix(in oklch, var(--rose, #ef4444) 14%, transparent))",
              border: "1px solid color-mix(in oklch, var(--rose, #ef4444) 30%, transparent)",
              color: "var(--rose, #b91c1c)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12.5,
            }}
          >
            {errorMessage}
          </div>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "var(--bg-panel)",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          overflow: "auto",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "32px 24px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: 44,
                  background: "var(--bg-sunken)",
                  borderRadius: 6,
                  marginBottom: 8,
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : isError ? (
          <p style={{ padding: "32px 24px", color: "var(--rose)", fontSize: 13 }}>
            Erreur lors du chargement des préférences.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "var(--ui-fs)",
            }}
          >
            <thead>
              <tr>
                {["ÉVÉNEMENT", "IN-APP (CLOCHE)", "EMAIL"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: "var(--ink-3)",
                      background: "var(--bg-panel)",
                      borderBottom: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_TYPES.map((t) => {
                const checked = state[t.type] ?? true;
                return (
                  <tr
                    key={t.type}
                    style={{ borderBottom: "1px solid var(--line-2)" }}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          className={`pill ${notifBadgeClass(t.type)}`}
                          style={{ minWidth: 110, justifyContent: "center" }}
                        >
                          <span className="dot" />
                          {notifTypeLabel(t.type)}
                        </span>
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "var(--ink)",
                            fontWeight: 500,
                          }}
                        >
                          {t.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(t.type)}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: "var(--accent)",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                          {checked ? "Activé" : "Désactivé"}
                        </span>
                      </label>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        whiteSpace: "nowrap",
                        opacity: 0.5,
                      }}
                    >
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "not-allowed",
                          userSelect: "none",
                        }}
                        title="La notification par email sera disponible dans une prochaine version."
                      >
                        <input
                          type="checkbox"
                          checked={false}
                          disabled
                          style={{ width: 16, height: 16, cursor: "not-allowed" }}
                        />
                        <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>
                          À venir
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
