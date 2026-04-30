import { useMemo, useState, type CSSProperties } from "react";
import type { Materiel, Reservation } from "@ogade/shared";

/**
 * Reusable Gantt-style calendar timeline matching ogade-mv-calendar.jsx.
 *
 * Renders a grid of materiels (rows) × days (columns) with:
 *  - reservation bands (hatched)
 *  - calibration deadline markers (red triangle)
 *  - today vertical line
 *
 * Used by the global /calendrier page (multi-row) and by the per-materiel
 * "Calendrier" tab inside the MaterielDrawer (single-row, compact variant).
 */

const ICONS: Record<string, string> = {
  star:  "M10 3l2.3 4.6 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.4l5.2-.8L10 3z",
  swap:  "M5 7h11l-3-3 M15 13H4l3 3",
  flask: "M8 3h4 M9 3v5l-4 8a2 2 0 0 0 2 3h6a2 2 0 0 0 2-3l-4-8V3",
  truck: "M3 6h10v9H3z M13 9h4l2 3v3h-6 M6 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M15 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
};

function Icon({ name, size = 10 }: { name: string; size?: number }) {
  const d = ICONS[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="icon">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const TYPE_META: Record<string, { couleur: string; icon: string; label: string }> = {
  TRANSFERT_SITE: { couleur: "sky",     icon: "swap",  label: "Transfert site" },
  ETALONNAGE:     { couleur: "violet",  icon: "flask", label: "Étalonnage" },
  PRET_EXTERNE:   { couleur: "amber",   icon: "truck", label: "Prêt externe" },
  PRET_INTERNE:   { couleur: "emerald", icon: "swap",  label: "Prêt interne" },
  AUTRE:          { couleur: "neutral", icon: "star",  label: "Autre" },
};

export type CalendarMateriel = Pick<
  Materiel,
  "id" | "reference" | "libelle" | "typeMateriel" | "modele" | "site" | "localisation" | "dateProchainEtalonnage" | "soumisVerification"
>;

export type CalendarEvent =
  | {
      kind: "reservation";
      id: number;
      materielId: number;
      start: Date;
      end: Date;
      type: string;
      statut: string;
      label: string;
      numero: string;
    }
  | {
      kind: "etalonnage";
      id: string;
      materielId: number;
      date: Date;
      label: string;
    };

export function reservationsToEvents(
  reservations: Reservation[],
): CalendarEvent[] {
  return reservations
    .filter((r) => r.statut !== "ANNULEE")
    .map((r) => ({
      kind: "reservation" as const,
      id: r.id,
      materielId: r.materielId,
      start: new Date(r.dateDebut),
      end: new Date(r.dateFin),
      type: r.type,
      statut: r.statut,
      label: r.numero,
      numero: r.numero,
    }));
}

export function calibrationMarkers(
  materiels: CalendarMateriel[],
): CalendarEvent[] {
  return materiels
    .filter((m) => !!m.dateProchainEtalonnage)
    .map((m) => ({
      kind: "etalonnage" as const,
      id: `etl-${m.id}`,
      materielId: m.id,
      date: new Date(m.dateProchainEtalonnage as string | Date),
      label: "Échéance étalonnage",
    }));
}

function fmtDay(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit" });
}
function fmtMonth(d: Date) {
  return d.toLocaleDateString("fr-FR", { month: "short" });
}
function fmtFull(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function isWeekend(d: Date) {
  return d.getDay() === 0 || d.getDay() === 6;
}
function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export type GanttCalendarProps = {
  materiels: CalendarMateriel[];
  events: CalendarEvent[];
  /** First day of the visible window (00:00 local). */
  startDate: Date;
  /** Number of days visible. */
  days: number;
  /** Compact single-row variant for drawer. */
  compact?: boolean;
  /** Click on a band */
  onEventClick?: (ev: CalendarEvent) => void;
  /** Click on the matériel name on the left column */
  onMaterielClick?: (m: CalendarMateriel) => void;
  /** Click on an empty slot (suggest creating a reservation) */
  onSlotClick?: (m: CalendarMateriel, date: Date) => void;
};

export default function GanttCalendar({
  materiels,
  events,
  startDate,
  days,
  compact,
  onEventClick,
  onMaterielClick,
  onSlotClick,
}: GanttCalendarProps) {
  const today = new Date();

  const dates = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [startDate, days]);

  const startMs = useMemo(() => {
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [startDate]);
  const totalMs = days * 86400000;

  const eventsByMateriel = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    materiels.forEach((m) => map.set(m.id, []));
    events.forEach((ev) => {
      if (!map.has(ev.materielId)) return;
      map.get(ev.materielId)!.push(ev);
    });
    return map;
  }, [materiels, events]);

  const todayPct = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const pct = ((t.getTime() - startMs) / totalMs) * 100;
    return pct;
  }, [startMs, totalMs]);

  const showTodayLine = todayPct >= 0 && todayPct <= 100;

  return (
    <div className={`cal-wrap${compact ? " compact" : ""}`}>
      <div
        className="cal-grid"
        style={
          compact
            ? ({ gridTemplateColumns: "1fr" } as CSSProperties)
            : undefined
        }
      >
        {/* Header row */}
        {!compact && <div className="cal-rowhead is-h">Matériel</div>}
        <div style={{ position: "relative" }}>
          <div
            className="cal-cols"
            style={{ gridTemplateColumns: `repeat(${days}, 1fr)` }}
          >
            {dates.map((d, i) => (
              <div
                key={i}
                className={`cal-col-head ${isSameDay(d, today) ? "today" : ""}`}
              >
                <span className="d">{fmtDay(d)}</span>
                <span style={{ textTransform: "uppercase" }}>
                  {i === 0 || d.getDate() === 1 ? fmtMonth(d) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {materiels.map((m) => {
          const eventsForM = eventsByMateriel.get(m.id) ?? [];
          return (
            <CalendarRow
              key={m.id}
              materiel={m}
              events={eventsForM}
              dates={dates}
              startMs={startMs}
              totalMs={totalMs}
              compact={compact}
              showTodayLine={showTodayLine}
              todayPct={todayPct}
              onEventClick={onEventClick}
              onMaterielClick={onMaterielClick}
              onSlotClick={onSlotClick}
            />
          );
        })}
        {materiels.length === 0 && (
          <>
            {!compact && <div className="cal-rowhead">—</div>}
            <div className="cal-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
              Aucun matériel sur la période
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CalendarRow({
  materiel,
  events,
  dates,
  startMs,
  totalMs,
  compact,
  showTodayLine,
  todayPct,
  onEventClick,
  onMaterielClick,
  onSlotClick,
}: {
  materiel: CalendarMateriel;
  events: CalendarEvent[];
  dates: Date[];
  startMs: number;
  totalMs: number;
  compact?: boolean;
  showTodayLine: boolean;
  todayPct: number;
  onEventClick?: (ev: CalendarEvent) => void;
  onMaterielClick?: (m: CalendarMateriel) => void;
  onSlotClick?: (m: CalendarMateriel, date: Date) => void;
}) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    meta: string;
  } | null>(null);
  const today = new Date();
  return (
    <>
      {!compact && (
        <div
          className={`cal-rowhead${onMaterielClick ? " clickable" : ""}`}
          onClick={onMaterielClick ? () => onMaterielClick(materiel) : undefined}
        >
          <span className="lbl" style={{ fontWeight: 500 }}>
            {materiel.typeMateriel ?? materiel.libelle}
          </span>
          <span className="id">
            {materiel.reference}
            {materiel.localisation || materiel.site
              ? ` · ${materiel.localisation ?? materiel.site}`
              : ""}
          </span>
        </div>
      )}
      <div
        className="cal-row"
        onClick={(e) => {
          if (!onSlotClick) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const pct = x / rect.width;
          if (pct < 0 || pct > 1) return;
          const ms = startMs + pct * totalMs;
          onSlotClick(materiel, new Date(ms));
        }}
        style={onSlotClick ? { cursor: "copy" } : undefined}
      >
        <div
          className="cal-cols"
          style={{
            gridTemplateColumns: `repeat(${dates.length}, 1fr)`,
            position: "absolute",
            inset: 0,
          }}
        >
          {dates.map((d, i) => (
            <div
              key={i}
              className={`cal-col ${isWeekend(d) ? "weekend" : ""} ${
                isSameDay(d, today) ? "today" : ""
              }`}
            />
          ))}
        </div>

        {/* Calibration markers */}
        {events
          .filter((e) => e.kind === "etalonnage")
          .map((ev) => {
            if (ev.kind !== "etalonnage") return null;
            const pct = ((ev.date.getTime() - startMs) / totalMs) * 100;
            if (pct < 0 || pct > 100) return null;
            return (
              <div
                key={ev.id}
                className="cal-marker"
                style={{ left: `${pct}%` }}
                title={`${ev.label} : ${fmtFull(ev.date)}`}
              />
            );
          })}

        {/* Today line */}
        {showTodayLine && (
          <div className="cal-today-line" style={{ left: `${todayPct}%` }} />
        )}

        {/* Reservation bars */}
        {events
          .filter((e) => e.kind === "reservation")
          .map((ev) => {
            if (ev.kind !== "reservation") return null;
            const sPct = Math.max(0, ((ev.start.getTime() - startMs) / totalMs) * 100);
            const ePct = Math.min(100, ((ev.end.getTime() - startMs) / totalMs) * 100);
            if (ePct <= 0 || sPct >= 100) return null;
            const meta = TYPE_META[ev.type] ?? TYPE_META.AUTRE;
            const cloturee = ev.statut === "HONOREE";
            const bandLabel = `${meta.label} · ${ev.numero}`;
            const periodLabel = `${fmtFull(ev.start)} → ${fmtFull(ev.end)}`;
            return (
              <div
                key={`r-${ev.id}`}
                className={`cal-bar reserv ${meta.couleur}${cloturee ? " cloturee" : ""}`}
                style={{
                  left: `${sPct}%`,
                  width: `${Math.max(2, ePct - sPct)}%`,
                }}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                  setTooltip({
                    x: e.clientX - rect.left + 8,
                    y: e.clientY - rect.top + 18,
                    title: bandLabel,
                    meta: periodLabel,
                  });
                }}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                  setTooltip((t) =>
                    t
                      ? { ...t, x: e.clientX - rect.left + 8, y: e.clientY - rect.top + 18 }
                      : t,
                  );
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(ev);
                }}
              >
                <Icon name={meta.icon} size={11} />
                {ev.numero}
              </div>
            );
          })}

        {tooltip && (
          <div
            className="cal-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="ttl">{tooltip.title}</div>
            <div className="meta">{tooltip.meta}</div>
          </div>
        )}
      </div>
    </>
  );
}
