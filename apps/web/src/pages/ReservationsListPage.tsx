import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PaginatedResult,
  Reservation,
  ReservationStats,
} from "@ogade/shared";
import { TypeReservation } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePagination } from "@/hooks/use-pagination";
import Pagination from "@/components/Pagination";
import ReservationModal from "@/components/ReservationModal";

const ICONS: Record<string, string> = {
  search: "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
  plus: "M10 4v12M4 10h12",
  star: "M10 3l2.3 4.6 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.4l5.2-.8L10 3z",
  swap: "M5 7h11l-3-3 M15 13H4l3 3",
  flask: "M8 3h4 M9 3v5l-4 8a2 2 0 0 0 2 3h6a2 2 0 0 0 2-3l-4-8V3",
  truck: "M3 6h10v9H3z M13 9h4l2 3v3h-6 M6 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M15 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  edit: "M12 4l4 4-8 8H4v-4l8-8z",
  trash: "M4 6h12 M6 6V4h8v2 M5 6l1 11h8l1-11",
  dots: "M5 10h.01M10 10h.01M15 10h.01",
  x: "M5 5l10 10M15 5L5 15",
};

function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const d = ICONS[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const TYPE_META: Record<string, { label: string; couleur: string; icon: string }> = {
  TRANSFERT_SITE: { label: "Transfert site", couleur: "sky", icon: "swap" },
  ETALONNAGE: { label: "Étalonnage", couleur: "violet", icon: "flask" },
  PRET_EXTERNE: { label: "Prêt externe", couleur: "amber", icon: "truck" },
  PRET_INTERNE: { label: "Prêt interne", couleur: "emerald", icon: "swap" },
  AUTRE: { label: "Autre", couleur: "neutral", icon: "star" },
};

const fmt = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const avatarColors = ["oklch(0.70 0.15 30)", "oklch(0.70 0.15 150)", "oklch(0.70 0.15 210)", "oklch(0.70 0.15 275)", "oklch(0.70 0.15 340)", "oklch(0.70 0.15 60)"];

function KpiCard({ label, value, sub, accent, active, onClick }: {
  label: string; value: number; sub: string; accent: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div
      className={`kpi${active ? " kpi-active" : ""}`}
      style={{
        "--kpi-accent": accent,
        cursor: onClick ? "pointer" : undefined,
        borderColor: active ? accent : undefined,
        boxShadow: active ? `0 0 0 1px ${accent}, 0 2px 8px ${accent}22` : undefined,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

type Period = "actuelles" | "venir" | "passees" | "aujourdhui" | "all";

export default function ReservationsListPage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("actuelles");
  const [mineOnly, setMineOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const { page, setPage, queryParams } = usePagination();

  const { data: stats } = useQuery<ReservationStats>({
    queryKey: ["reservations-stats"],
    queryFn: () => api.get("/reservations/stats"),
  });

  const { data, isLoading } = useQuery<PaginatedResult<Reservation>>({
    queryKey: ["reservations", { period, mineOnly, search, filterType, ...queryParams }],
    queryFn: () =>
      api.get("/reservations", {
        ...queryParams,
        period: period === "all" ? undefined : period,
        search: search || undefined,
        type: filterType || undefined,
        mes: mineOnly ? "true" : undefined,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.post(`/reservations/${id}/cancel`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["reservations-stats"] });
      qc.invalidateQueries({ queryKey: ["materiel-reservations"] });
      qc.invalidateQueries({ queryKey: ["materiel-calendar"] });
      qc.invalidateQueries({ queryKey: ["reservation-conflicts"] });
    },
  });

  const rows = data?.data ?? [];
  const today = new Date();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Réservations matériel</h1>
          <p className="page-sub">Pré-réservations de matériel pour campagnes EDF</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="obtn accent" onClick={() => setShowCreate(true)}>
            <Icon name="plus" />
            Nouvelle réservation
          </button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="kpi-grid">
          <KpiCard
            label="Réservations actives"
            value={stats.actives}
            sub="confirmées en cours / à venir"
            accent="var(--accent)"
            active={period === "actuelles" && filterType === "" && !mineOnly}
            onClick={() => { setPeriod("actuelles"); setFilterType(""); setMineOnly(false); setPage(1); }}
          />
          <KpiCard
            label="Cette semaine"
            value={stats.cetteSemaine}
            sub="à activer dans 7 jours"
            accent="var(--sky)"
            active={period === "venir" && !mineOnly}
            onClick={() => { setPeriod("venir"); setMineOnly(false); setPage(1); }}
          />
          <KpiCard
            label="À activer aujourd'hui"
            value={stats.aujourdhui}
            sub="démarrent aujourd'hui"
            accent="var(--amber)"
            active={period === "aujourdhui" && !mineOnly}
            onClick={() => { setPeriod("aujourdhui"); setMineOnly(false); setPage(1); }}
          />
          <KpiCard
            label="Mes réservations"
            value={stats.mesReservations}
            sub="dont je suis demandeur"
            accent="var(--violet)"
            active={mineOnly}
            onClick={() => { setMineOnly((v) => !v); setPage(1); }}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="rs-toolbar">
        <div className="search-bar">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Recherche — n°, matériel, motif…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="oselect"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
        >
          <option value="">Type — Tous</option>
          {Object.values(TypeReservation).map((t) => (
            <option key={t} value={t}>{TYPE_META[t]?.label ?? t}</option>
          ))}
        </select>
        <div className="seg">
          {(["actuelles", "venir", "passees", "all"] as const).map((k) => (
            <button
              key={k}
              className={period === k ? "on" : ""}
              onClick={() => { setPeriod(k); setPage(1); }}
            >
              {k === "actuelles" ? "En cours" : k === "venir" ? "À venir" : k === "passees" ? "Passées" : "Toutes"}
            </button>
          ))}
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--ink-4)", whiteSpace: "nowrap" }}>
          {data ? `${data.total} réservation${data.total > 1 ? "s" : ""}` : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-panel)", flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <div style={{ padding: "32px 24px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ height: 44, background: "var(--bg-sunken)", borderRadius: 6, marginBottom: 10, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : (
          <table className="rs-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Matériel</th>
                <th>Type prévu</th>
                <th>Période</th>
                <th>Demandeur</th>
                <th>Statut</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    <Icon name="star" size={28} />
                    <div style={{ marginTop: 8 }}>Aucune réservation</div>
                    <button
                      className="obtn accent sm"
                      style={{ marginTop: 12 }}
                      onClick={() => setShowCreate(true)}
                    >
                      <Icon name="plus" size={11} />
                      Nouvelle réservation
                    </button>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const t = TYPE_META[r.type] ?? TYPE_META.AUTRE;
                  const debut = new Date(r.dateDebut);
                  const fin = new Date(r.dateFin);
                  const inProgress = debut <= today && fin >= today && r.statut === "CONFIRMEE";
                  const initials = r.demandeur ? `${r.demandeur.prenom?.[0] ?? ""}${r.demandeur.nom?.[0] ?? ""}` : "";
                  const avatarColor = avatarColors[(initials.charCodeAt(0) || 0) % avatarColors.length];
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="mono" style={{ fontWeight: 500, fontSize: 11.5 }}>
                          {r.numero}
                        </span>
                      </td>
                      <td>
                        <div className="cell-two-line">
                          <span className="p">{r.materiel?.typeMateriel ?? "Matériel"}</span>
                          <span className="s mono">
                            {r.materiel?.reference} · {r.materiel?.modele ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${t.couleur}`}>
                          <Icon name={t.icon} size={10} />
                          {t.label}
                        </span>
                      </td>
                      <td>
                        <div className="cell-two-line">
                          <span className="p" style={{ fontSize: 11.5 }}>Du {fmt(r.dateDebut)}</span>
                          <span className="s">Au {fmt(r.dateFin)}</span>
                        </div>
                      </td>
                      <td>
                        {r.demandeur ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span className="avatar-circle" style={{ background: avatarColor }}>{initials}</span>
                            <span style={{ fontSize: 12 }}>
                              {r.demandeur.prenom} {r.demandeur.nom}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>—</span>
                        )}
                      </td>
                      <td>
                        {r.statut === "CONFIRMEE" && inProgress && (
                          <span className="pill c-amber pulse"><span className="dot" />En cours</span>
                        )}
                        {r.statut === "CONFIRMEE" && !inProgress && (
                          <span className="pill c-sky"><span className="dot" />Confirmée</span>
                        )}
                        {r.statut === "HONOREE" && (
                          <span className="pill c-emerald"><span className="dot" />Honorée</span>
                        )}
                        {r.statut === "ANNULEE" && (
                          <span className="pill c-neutral" style={{ textDecoration: "line-through" }}>
                            <span className="dot" />Annulée
                          </span>
                        )}
                      </td>
                      <td style={{ position: "relative" }}>
                        <button
                          className="icon-btn"
                          style={{ padding: 5 }}
                          onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)}
                          aria-label="Actions"
                        >
                          <Icon name="dots" size={13} />
                        </button>
                        {openMenu === r.id && (
                          <>
                            <div
                              style={{ position: "fixed", inset: 0, zIndex: 30 }}
                              onClick={() => setOpenMenu(null)}
                            />
                            <div
                              style={{
                                position: "absolute", right: 8, top: 32, zIndex: 31,
                                background: "var(--bg-panel)", border: "1px solid var(--line)",
                                borderRadius: 8, padding: 4, minWidth: 180,
                                boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
                                display: "flex", flexDirection: "column",
                              }}
                            >
                              <button
                                className="obtn ghost sm"
                                style={{ justifyContent: "flex-start" }}
                                onClick={() => { setEditing(r); setOpenMenu(null); }}
                              >
                                <Icon name="edit" size={12} />
                                Modifier
                              </button>
                              {r.statut === "CONFIRMEE" && (
                                <button
                                  className="obtn ghost sm"
                                  style={{ justifyContent: "flex-start", color: "var(--rose)" }}
                                  onClick={() => {
                                    if (confirm(`Annuler la réservation ${r.numero} ?`)) {
                                      cancelMutation.mutate(r.id);
                                    }
                                    setOpenMenu(null);
                                  }}
                                >
                                  <Icon name="x" size={12} />
                                  Annuler
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div style={{ padding: "16px 24px" }}>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <ReservationModal onClose={() => setShowCreate(false)} />
      )}
      {editing && (
        <ReservationModal
          onClose={() => setEditing(null)}
          reservation={editing}
        />
      )}
    </div>
  );
}
