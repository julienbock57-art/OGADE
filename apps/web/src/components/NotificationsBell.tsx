/**
 * NotificationsBell — cloche du topbar avec compteur non-lues et dropdown
 * listant les 10 dernières notifications. Polling silencieux toutes les 30s.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  formatRelativeTime,
  notifBadgeClass,
  notifTypeLabel,
  type Notification,
  type NotificationListResponse,
} from "@/lib/notifications";

function BellIcon({ size = 14 }: { size?: number }) {
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
    >
      <path d="M5 8a5 5 0 0 1 10 0v3l1.5 2.5h-13L5 11V8z" />
      <path d="M8 15a2 2 0 0 0 4 0" />
    </svg>
  );
}

export default function NotificationsBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Polling silencieux du compteur — toujours actif (que le dropdown soit ouvert ou non)
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.get("/notifications/unread-count"),
    refetchInterval: 30_000,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const unreadCount = countData?.count ?? 0;

  // Liste des 10 dernières — chargée seulement à l'ouverture
  const { data: listData, isLoading } = useQuery<NotificationListResponse>({
    queryKey: ["notifications", "dropdown"],
    queryFn: () => api.get("/notifications", { page: 1, pageSize: 10 }),
    enabled: open,
    staleTime: 0,
  });

  const markOneMut = useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => api.post("/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fermer à Escape
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleClickNotif = (notif: Notification) => {
    if (!notif.readAt) {
      markOneMut.mutate(notif.id);
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const notifications = listData?.data ?? [];

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="icon-btn"
        title="Notifications"
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
            : "Notifications"
        }
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative" }}
      >
        <BellIcon size={14} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "var(--rose)",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              lineHeight: 1,
              boxShadow: "0 0 0 2px var(--bg-panel)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 380,
            maxWidth: "90vw",
            background: "var(--bg-panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Head */}
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-3)",
                  }}
                >
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              className="obtn ghost sm"
              onClick={() => markAllMut.mutate()}
              disabled={unreadCount === 0 || markAllMut.isPending}
              style={{ fontSize: 11, padding: "3px 8px" }}
            >
              Tout marquer lu
            </button>
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: 420,
              overflowY: "auto",
            }}
          >
            {isLoading && (
              <div
                style={{
                  padding: "24px 14px",
                  fontSize: 12,
                  color: "var(--ink-3)",
                  textAlign: "center",
                }}
              >
                Chargement...
              </div>
            )}
            {!isLoading && notifications.length === 0 && (
              <div
                style={{
                  padding: "32px 14px",
                  fontSize: 13,
                  color: "var(--ink-3)",
                  textAlign: "center",
                }}
              >
                Aucune notification.
              </div>
            )}
            {!isLoading &&
              notifications.map((notif) => {
                const unread = !notif.readAt;
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleClickNotif(notif)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--line-2)",
                      background: unread ? "var(--accent-soft)" : "transparent",
                      border: "none",
                      borderLeft: unread
                        ? "3px solid var(--accent)"
                        : "3px solid transparent",
                      cursor: "pointer",
                      display: "block",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        unread
                          ? "color-mix(in oklch, var(--accent-soft) 80%, white)"
                          : "var(--bg-sunken)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = unread
                        ? "var(--accent-soft)"
                        : "transparent";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <span className={`pill ${notifBadgeClass(notif.type)}`}>
                        <span className="dot" />
                        {notifTypeLabel(notif.type)}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 10.5,
                          color: "var(--ink-4)",
                        }}
                      >
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: unread ? 600 : 500,
                        color: "var(--ink)",
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {notif.title}
                    </div>
                    {notif.message && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--ink-3)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {notif.message}
                      </div>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Foot */}
          <div
            style={{
              borderTop: "1px solid var(--line)",
              padding: 8,
            }}
          >
            <button
              type="button"
              className="obtn ghost"
              style={{ width: "100%", justifyContent: "center", fontSize: 12 }}
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
