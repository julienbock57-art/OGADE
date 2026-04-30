import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel, PaginatedResult, Reservation } from "@ogade/shared";
import { api } from "@/lib/api";
import { useReferentiel, useSites } from "@/hooks/use-referentiels";
import GanttCalendar, {
  reservationsToEvents,
  calibrationMarkers,
  type CalendarEvent,
  type CalendarMateriel,
} from "@/components/GanttCalendar";
import ReservationModal from "@/components/ReservationModal";

const ICONS: Record<string, string> = {
  search: "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
  plus: "M10 4v12M4 10h12",
  chevL: "M12 5l-5 5 5 5",
  chevR: "M7 5l5 5-5 5",
  star: "M10 3l2.3 4.6 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.4l5.2-.8L10 3z",
};
function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const d = ICONS[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const VIEWS = [
  { code: "7j", label: "7 j", days: 7, lookback: 1 },
  { code: "14j", label: "14 j", days: 14, lookback: 2 },
  { code: "30j", label: "30 j", days: 30, lookback: 4 },
  { code: "90j", label: "90 j", days: 90, lookback: 14 },
] as const;

type ViewCode = (typeof VIEWS)[number]["code"];

export default function CalendrierPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewCode>("14j");
  const [offset, setOffset] = useState(0); // shift in days from "today - lookback"
  const [filterTypeEnd, setFilterTypeEnd] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterTypeMat, setFilterTypeMat] = useState("");
  const [search, setSearch] = useState("");
  const [createForMat, setCreateForMat] = useState<{
    materiel: Materiel;
    date: Date;
  } | null>(null);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);

  const viewCfg = VIEWS.find((v) => v.code === view) ?? VIEWS[1];

  const startDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - viewCfg.lookback + offset);
    return d;
  }, [view, offset, viewCfg]);

  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + viewCfg.days);
    return d;
  }, [startDate, viewCfg]);

  const { data: typesEnd } = useReferentiel("TYPE_END");
  const { data: typesMat } = useReferentiel("TYPE_MATERIEL");
  const { data: sites } = useSites();

  // Fetch matériels (paginated, take a generous chunk)
  const { data: matResults, isLoading: matLoading } = useQuery<
    PaginatedResult<Materiel>
  >({
    queryKey: ["materiels", "calendar", { filterTypeEnd, filterSite, filterTypeMat, search }],
    queryFn: () =>
      api.get("/materiels", {
        page: 1,
        pageSize: 50,
        typeEND: filterTypeEnd || undefined,
        site: filterSite || undefined,
        typeMateriel: filterTypeMat || undefined,
        search: search || undefined,
      }),
  });

  const materiels: CalendarMateriel[] = matResults?.data ?? [];
  const materielIds = materiels.map((m) => m.id);

  // Fetch reservations within the visible window for the current matériels
  const { data: resResults } = useQuery<PaginatedResult<Reservation>>({
    queryKey: [
      "reservations",
      "calendar",
      { startDate, endDate, materielIds: materielIds.join(",") },
    ],
    queryFn: () =>
      api.get("/reservations", {
        pageSize: 200,
        dateMin: startDate.toISOString(),
        dateMax: endDate.toISOString(),
      }),
    enabled: materielIds.length > 0,
  });

  const events: CalendarEvent[] = useMemo(() => {
    const reservationEvents = (resResults?.data ?? []).filter((r) =>
      materielIds.includes(r.materielId),
    );
    return [
      ...reservationsToEvents(reservationEvents),
      ...calibrationMarkers(materiels),
    ];
  }, [resResults, materielIds, materiels]);

  const fmtRange = () => {
    const d = startDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
    const eDate = new Date(endDate);
    eDate.setDate(eDate.getDate() - 1);
    const e = eDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${d} → ${e}`;
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Calendrier matériel</h1>
          <p className="page-sub">
            Disponibilité — réservations et échéances d'étalonnage
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="seg">
            {VIEWS.map((v) => (
              <button
                key={v.code}
                className={view === v.code ? "on" : ""}
                onClick={() => {
                  setView(v.code);
                  setOffset(0);
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            className="obtn accent"
            onClick={() => navigate("/reservations")}
          >
            <Icon name="star" size={13} />
            Voir les réservations
          </button>
        </div>
      </div>

      <div className="cal-toolbar">
        <button
          className="obtn sm"
          onClick={() => setOffset((o) => o - viewCfg.days)}
          title="Période précédente"
        >
          <Icon name="chevL" size={12} />
        </button>
        <button
          className="obtn sm"
          onClick={() => setOffset(0)}
        >
          Aujourd'hui
        </button>
        <button
          className="obtn sm"
          onClick={() => setOffset((o) => o + viewCfg.days)}
          title="Période suivante"
        >
          <Icon name="chevR" size={12} />
        </button>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500, marginLeft: 4 }}>
          {fmtRange()}
        </span>

        <span style={{ width: 14 }} />

        <div className="search-bar" style={{ minWidth: 220 }}>
          <Icon name="search" />
          <input
            type="text"
            placeholder="Recherche matériel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="oselect"
          value={filterTypeEnd}
          onChange={(e) => setFilterTypeEnd(e.target.value)}
        >
          <option value="">Type END — Tous</option>
          {(typesEnd ?? []).map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          className="oselect"
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
        >
          <option value="">Site — Tous</option>
          {(sites ?? []).map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="oselect"
          value={filterTypeMat}
          onChange={(e) => setFilterTypeMat(e.target.value)}
        >
          <option value="">Type matériel — Tous</option>
          {(typesMat ?? []).map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>

        <span style={{ flex: 1 }} />

        <div className="legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: "var(--violet)" }} />
            Étalonnage
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: "var(--sky)" }} />
            Transfert
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: "oklch(0.66 0.17 70)" }} />
            Prêt externe
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: "var(--emerald)" }} />
            Prêt interne
          </span>
          <span className="legend-item">
            <span className="legend-swatch hatch" style={{ color: "var(--accent)" }} />
            Réservation
          </span>
          <span className="legend-item" style={{ color: "var(--rose)" }}>
            <span style={{ display: "inline-block", width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid var(--rose)" }} />
            Échéance étalonnage
          </span>
        </div>
      </div>

      {matLoading ? (
        <div style={{ padding: "40px 24px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: 56,
                background: "var(--bg-sunken)",
                borderRadius: 6,
                marginBottom: 6,
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <GanttCalendar
          materiels={materiels}
          events={events}
          startDate={startDate}
          days={viewCfg.days}
          onMaterielClick={(m) => navigate(`/materiels/${m.id}`)}
          onEventClick={(ev) => {
            if (ev.kind === "reservation") {
              const r = (resResults?.data ?? []).find((x) => x.id === ev.id);
              if (r) setEditingReservation(r);
            }
          }}
          onSlotClick={(m, d) => {
            setCreateForMat({ materiel: m as Materiel, date: d });
          }}
        />
      )}

      {matResults && matResults.total > materiels.length && (
        <div style={{ padding: "12px 24px", fontSize: 12, color: "var(--ink-3)" }}>
          {materiels.length} sur {matResults.total} matériels affichés. Affinez les filtres pour réduire la liste.
        </div>
      )}

      {createForMat && (
        <ReservationModal
          onClose={() => setCreateForMat(null)}
          initialMateriel={createForMat.materiel}
        />
      )}
      {editingReservation && (
        <ReservationModal
          onClose={() => setEditingReservation(null)}
          reservation={editingReservation}
        />
      )}
    </div>
  );
}
