/**
 * NotificationsPage — page complète /notifications.
 * Liste paginée des notifications du user avec onglets (Non lues / Toutes),
 * actions (marquer lue, supprimer, ouvrir le lien), et accès aux préférences.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import Pagination from "@/components/Pagination";
import {
  formatAbsoluteDateTime,
  notifBadgeClass,
  notifTypeFullLabel,
  notifTypeLabel,
  type Notification,
  type NotificationListResponse,
} from "@/lib/notifications";

type Tab = "unread" | "all";

function Icon({
  name,
  size = 14,
}: {
  name: "check" | "trash" | "external" | "bell" | "settings";
  size?: number;
}) {
  const paths: Record<string, string> = {
    check: "M4 10l4 4 8-8",
    trash:
      "M4 6h12 M8 6V4h4v2 M5 6l1 11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-11 M9 9v7 M11 9v7",
    external: "M9 4H4v12h12v-5 M11 3h6v6 M9 11l8-8",
    bell: "M5 8a5 5 0 0 1 10 0v3l1.5 2.5h-13L5 11V8z M8 15a2 2 0 0 0 4 0",
    settings:
      "M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16 10a6 6 0 0 1-.1 1l2 1.5-2 3.4-2.3-1a6 6 0 0 1-1.7 1l-.3 2.5h-3.2l-.3-2.5a6 6 0 0 1-1.7-1l-2.3 1-2-3.4 2-1.5a6 6 0 0 1 0-2l-2-1.5 2-3.4 2.3 1a6 6 0 0 1 1.7-1L8.4 2h3.2l.3 2.5a6 6 0 0 1 1.7 1l2.3-1 2 3.4-2 1.5a6 6 0 0 1 .1 1z",
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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, setPage, pageSize, queryParams } = usePagination();
  const [tab, setTab] = useState<Tab>("unread");

  const { data, isLoading, isError } = useQuery<NotificationListResponse>({
    queryKey: ["notifications", "list", { ...queryParams, tab }],
    queryFn: () =>
      api.get("/notifications", {
        ...queryParams,
        unread: tab === "unread" ? true : undefined,
      }),
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

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const rows = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const total = data?.total ?? 0;

  function handleRowClick(notif: Notification) {
    if (!notif.readAt) {
      markOneMut.mutate(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  }

  function handleSwitchTab(next: Tab) {
    setTab(next);
    setPage(1);
  }

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
            Espace END / Notifications
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="bell" size={18} />
            Notifications
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-3)",
              marginTop: 2,
              marginBottom: 0,
            }}
          >
            {tab === "unread"
              ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : `${total} notification${total > 1 ? "s" : ""} au total`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to="/parametres/notifications"
            className="obtn"
            style={{ textDecoration: "none" }}
          >
            <Icon name="settings" size={13} />
            Préférences
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-panel)",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div className="seg" role="tablist">
          <button
            role="tab"
            className={tab === "unread" ? "on" : ""}
            onClick={() => handleSwitchTab("unread")}
          >
            Non lues
          </button>
          <button
            role="tab"
            className={tab === "all" ? "on" : ""}
            onClick={() => handleSwitchTab("all")}
          >
            Toutes
          </button>
        </div>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="obtn"
          disabled={unreadCount === 0 || markAllMut.isPending}
          onClick={() => markAllMut.mutate()}
        >
          <Icon name="check" size={13} />
          Tout marquer lu
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-panel)",
          borderTop: "1px solid var(--line)",
          overflow: "auto",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "32px 24px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: 56,
                  background: "var(--bg-sunken)",
                  borderRadius: 6,
                  marginBottom: 10,
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : isError ? (
          <p style={{ padding: "32px 24px", color: "var(--rose)", fontSize: 13 }}>
            Erreur lors du chargement des notifications.
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
                {["TYPE", "TITRE", "MESSAGE", "REÇUE LE", "STATUT", ""].map((h, idx) => (
                  <th
                    key={h + idx}
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
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "48px 14px",
                      textAlign: "center",
                      color: "var(--ink-3)",
                      fontSize: 13,
                    }}
                  >
                    {tab === "unread"
                      ? "Aucune notification non lue."
                      : "Aucune notification."}
                  </td>
                </tr>
              ) : (
                rows.map((notif) => {
                  const unread = !notif.readAt;
                  return (
                    <tr
                      key={notif.id}
                      style={{
                        borderBottom: "1px solid var(--line-2)",
                        background: unread ? "var(--accent-soft)" : undefined,
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onClick={() => handleRowClick(notif)}
                    >
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <span
                          className={`pill ${notifBadgeClass(notif.type)}`}
                          title={notifTypeFullLabel(notif.type)}
                        >
                          <span className="dot" />
                          {notifTypeLabel(notif.type)}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: unread ? 600 : 500,
                            color: "var(--ink)",
                          }}
                        >
                          {notif.title}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: 12,
                          color: "var(--ink-3)",
                          maxWidth: 420,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {notif.message ?? "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: 12,
                          color: "var(--ink-3)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatAbsoluteDateTime(notif.createdAt)}
                      </td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        {unread ? (
                          <span className="pill c-accent">
                            <span className="dot" />
                            Non lue
                          </span>
                        ) : (
                          <span
                            style={{ fontSize: 11.5, color: "var(--ink-4)" }}
                          >
                            Lue
                          </span>
                        )}
                      </td>
                      <td
                        style={{ padding: "6px 10px", whiteSpace: "nowrap", textAlign: "right" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "inline-flex", gap: 4 }}>
                          {notif.link && (
                            <button
                              type="button"
                              className="icon-btn"
                              title="Ouvrir le lien"
                              aria-label="Ouvrir le lien"
                              onClick={() => {
                                if (!notif.readAt) markOneMut.mutate(notif.id);
                                if (notif.link) navigate(notif.link);
                              }}
                            >
                              <Icon name="external" size={13} />
                            </button>
                          )}
                          {unread && (
                            <button
                              type="button"
                              className="icon-btn"
                              title="Marquer comme lue"
                              aria-label="Marquer comme lue"
                              onClick={() => markOneMut.mutate(notif.id)}
                              disabled={markOneMut.isPending}
                            >
                              <Icon name="check" size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="icon-btn"
                            title="Supprimer"
                            aria-label="Supprimer"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Supprimer cette notification ?",
                                )
                              ) {
                                deleteMut.mutate(notif.id);
                              }
                            }}
                            disabled={deleteMut.isPending}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div style={{ padding: "0 24px" }}>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              textAlign: "center",
              marginTop: 4,
              paddingBottom: 16,
            }}
          >
            {rows.length} affichée{rows.length > 1 ? "s" : ""} sur {total} ·
            {" "}page {data.page} ({pageSize} par page)
          </div>
        </div>
      )}
    </div>
  );
}
