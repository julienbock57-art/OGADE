import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type StatsResponse = {
  materiels: { total: number; data: { etat: string }[] };
  maquettes: { total: number; data: { etat: string }[] };
  demandes: { total: number; data: { statut: string }[] };
};

function useStats() {
  const materiels = useQuery({
    queryKey: ["materiels", "stats"],
    queryFn: () => api.get<StatsResponse["materiels"]>("/materiels", { page: 1, pageSize: 200 }),
  });
  const maquettes = useQuery({
    queryKey: ["maquettes", "stats"],
    queryFn: () => api.get<StatsResponse["maquettes"]>("/maquettes", { page: 1, pageSize: 200 }),
  });
  const demandes = useQuery({
    queryKey: ["demandes-envoi", "stats"],
    queryFn: () => api.get<StatsResponse["demandes"]>("/demandes-envoi", { page: 1, pageSize: 200 }),
  });
  return { materiels, maquettes, demandes };
}

// Icon components using the design system paths
function IconWrench({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3l-3 3 1 1-7 7-3 3 2 2 3-3 7-7 1 1 3-3z" />
    </svg>
  );
}

function IconBox({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" />
      <path d="M3 6l7 3 7-3" />
      <path d="M10 9v8" />
    </svg>
  );
}

function IconTruck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h10v9H2z" />
      <path d="M12 8h4l2 3v3h-6" />
      <path d="M5 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" />
      <path d="M14 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" />
    </svg>
  );
}

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10l4 4 8-8" />
    </svg>
  );
}

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function IconUser({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M4 17a6 6 0 0 1 12 0" />
    </svg>
  );
}

function IconChevRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 5l5 5-5 5" />
    </svg>
  );
}

// KPI card using the design system .kpi class
function KpiCard({
  title,
  value,
  subtitle,
  accentColor,
  icon,
  to,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  accentColor: string;
  icon: React.ReactNode;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="kpi"
      style={{ "--kpi-accent": accentColor, textDecoration: "none", color: "inherit" } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kpi-label">{title}</div>
          <div className="kpi-value" style={{ color: accentColor }}>{value}</div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: `color-mix(in oklch, ${accentColor} 12%, transparent)`,
            display: "grid",
            placeItems: "center",
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
      <div className="kpi-sub">{subtitle}</div>
    </Link>
  );
}

// Status bar row inside breakdown panels
function StatusRow({
  label,
  count,
  total,
  fillColor,
}: {
  label: string;
  count: number;
  total: number;
  fillColor: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontSize: 12,
          color: "var(--ink-3)",
          width: 108,
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: "var(--line)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: fillColor,
            width: `${pct}%`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--ink-2)",
          width: 24,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        {count}
      </span>
    </div>
  );
}

// Skeleton loader for KPI cards
function KpiSkeleton() {
  return (
    <div
      className="kpi"
      style={{ gap: 10 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 10,
              borderRadius: 4,
              background: "var(--line)",
              width: "60%",
              marginBottom: 10,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              height: 26,
              borderRadius: 4,
              background: "var(--line)",
              width: "40%",
            }}
          />
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "var(--line)",
            flexShrink: 0,
          }}
        />
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 4,
          background: "var(--line-2)",
          width: "70%",
        }}
      />
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { materiels, maquettes, demandes } = useStats();

  const matData = materiels.data?.data ?? [];
  const maqData = maquettes.data?.data ?? [];
  const demData = demandes.data?.data ?? [];

  const matTotal = materiels.data?.total ?? 0;
  const maqTotal = maquettes.data?.total ?? 0;
  const demTotal = demandes.data?.total ?? 0;

  const countBy = <T,>(arr: T[], field: keyof T, value: string) =>
    arr.filter((item) => item[field] === value).length;

  const matDispo = countBy(matData, "etat" as keyof typeof matData[0], "DISPONIBLE");
  const matEnService = countBy(matData, "etat" as keyof typeof matData[0], "EN_SERVICE");
  const matPrete = countBy(matData, "etat" as keyof typeof matData[0], "PRETE");
  const matReparation = countBy(matData, "etat" as keyof typeof matData[0], "EN_REPARATION");

  const maqStock = countBy(maqData, "etat" as keyof typeof maqData[0], "STOCK");
  const maqEmpruntee = countBy(maqData, "etat" as keyof typeof maqData[0], "EMPRUNTEE");
  const maqControle = countBy(maqData, "etat" as keyof typeof maqData[0], "EN_CONTROLE");
  const maqEnvoyee = countBy(maqData, "etat" as keyof typeof maqData[0], "ENVOYEE");

  const demBrouillon = countBy(demData, "statut" as keyof typeof demData[0], "BROUILLON");
  const demEnvoyee = countBy(demData, "statut" as keyof typeof demData[0], "ENVOYEE");
  const demTransit = countBy(demData, "statut" as keyof typeof demData[0], "EN_TRANSIT");
  const demRecue = countBy(demData, "statut" as keyof typeof demData[0], "RECUE");

  const isLoading = materiels.isLoading || maquettes.isLoading || demandes.isLoading;

  const availabilityPct = matTotal > 0 ? Math.round((matDispo / matTotal) * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Page header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">
            Bonjour, {user?.prenom ?? "Utilisateur"}
          </h1>
          <p className="page-sub">
            Tableau de bord — Vue d'ensemble des actifs END de la DQI
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link to="/materiels/nouveau" className="obtn accent" style={{ textDecoration: "none" }}>
            <IconPlus size={14} />
            Nouveau matériel
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid">
        {isLoading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              title="Matériels END"
              value={matTotal}
              subtitle={`${matDispo} disponibles`}
              accentColor="var(--accent)"
              to="/materiels"
              icon={<IconWrench size={18} />}
            />
            <KpiCard
              title="Maquettes"
              value={maqTotal}
              subtitle={`${maqStock} en stock`}
              accentColor="var(--violet)"
              to="/maquettes"
              icon={<IconBox size={18} />}
            />
            <KpiCard
              title="Demandes d'envoi"
              value={demTotal}
              subtitle={`${demTransit} en transit`}
              accentColor="var(--amber)"
              to="/demandes-envoi"
              icon={<IconTruck size={18} />}
            />
            <KpiCard
              title="Taux disponibilité"
              value={availabilityPct !== null ? `${availabilityPct}%` : "—"}
              subtitle="Matériels disponibles"
              accentColor="var(--emerald)"
              to="/materiels"
              icon={<IconCheck size={18} />}
            />
          </>
        )}
      </div>

      {/* Breakdown panels */}
      <div className="kpi-grid">
        {/* Matériels breakdown */}
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ink-3)",
              }}
            >
              Répartition Matériels
            </span>
            <Link
              to="/materiels"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 12,
                color: "var(--accent-ink)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Voir tout <IconChevRight size={13} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatusRow label="Disponible" count={matDispo} total={matTotal} fillColor="var(--emerald)" />
            <StatusRow label="En service" count={matEnService} total={matTotal} fillColor="var(--accent)" />
            <StatusRow label="Prêté" count={matPrete} total={matTotal} fillColor="var(--amber)" />
            <StatusRow label="En réparation" count={matReparation} total={matTotal} fillColor="var(--rose)" />
          </div>
          {!isLoading && matTotal > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span className="pill c-emerald">
                <span className="dot" />
                {matDispo} disponibles
              </span>
              {matReparation > 0 && (
                <span className="pill c-rose">
                  <span className="dot" />
                  {matReparation} en réparation
                </span>
              )}
            </div>
          )}
        </div>

        {/* Maquettes breakdown */}
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ink-3)",
              }}
            >
              Répartition Maquettes
            </span>
            <Link
              to="/maquettes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 12,
                color: "var(--accent-ink)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Voir tout <IconChevRight size={13} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatusRow label="En stock" count={maqStock} total={maqTotal} fillColor="var(--emerald)" />
            <StatusRow label="Empruntée" count={maqEmpruntee} total={maqTotal} fillColor="var(--amber)" />
            <StatusRow label="En contrôle" count={maqControle} total={maqTotal} fillColor="var(--sky)" />
            <StatusRow label="Envoyée" count={maqEnvoyee} total={maqTotal} fillColor="var(--violet)" />
          </div>
          {!isLoading && maqTotal > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
              <span className="pill c-emerald">
                <span className="dot" />
                {maqStock} en stock
              </span>
              {maqEmpruntee > 0 && (
                <span className="pill c-amber">
                  <span className="dot" />
                  {maqEmpruntee} empruntées
                </span>
              )}
            </div>
          )}
        </div>

        {/* Demandes breakdown */}
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ink-3)",
              }}
            >
              Suivi Demandes
            </span>
            <Link
              to="/demandes-envoi"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 12,
                color: "var(--accent-ink)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Voir tout <IconChevRight size={13} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatusRow label="Brouillon" count={demBrouillon} total={demTotal} fillColor="var(--ink-4)" />
            <StatusRow label="Envoyée" count={demEnvoyee} total={demTotal} fillColor="var(--sky)" />
            <StatusRow label="En transit" count={demTransit} total={demTotal} fillColor="var(--amber)" />
            <StatusRow label="Reçue" count={demRecue} total={demTotal} fillColor="var(--emerald)" />
          </div>
          {!isLoading && demTotal > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
              {demTransit > 0 && (
                <span className="pill c-amber">
                  <span className="dot" />
                  {demTransit} en transit
                </span>
              )}
              {demRecue > 0 && (
                <span className="pill c-emerald">
                  <span className="dot" />
                  {demRecue} reçues
                </span>
              )}
              {demTransit === 0 && demRecue === 0 && (
                <span className="pill c-neutral">
                  <span className="dot" />
                  {demBrouillon} brouillons
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "0 24px 24px" }}>
        <div
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--ink-3)",
              marginBottom: 14,
            }}
          >
            Actions rapides
          </div>
          <div
            className="filter-grid"
          >
            {/* New material */}
            <Link
              to="/materiels/nouveau"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 9,
                border: "1px solid var(--line)",
                background: "var(--bg-panel)",
                textDecoration: "none",
                color: "var(--ink)",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-line)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--accent-soft)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--accent-ink)",
                  flexShrink: 0,
                }}
              >
                <IconPlus size={15} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Nouveau matériel</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>Ajouter un équipement</div>
              </div>
            </Link>

            {/* New maquette */}
            <Link
              to="/maquettes/nouveau"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 9,
                border: "1px solid var(--line)",
                background: "var(--bg-panel)",
                textDecoration: "none",
                color: "var(--ink)",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--violet-soft)";
                (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in oklch, var(--violet) 25%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--violet-soft)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--violet)",
                  flexShrink: 0,
                }}
              >
                <IconPlus size={15} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Nouvelle maquette</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>Créer un modèle</div>
              </div>
            </Link>

            {/* New demande */}
            <Link
              to="/demandes-envoi/nouveau"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 9,
                border: "1px solid var(--line)",
                background: "var(--bg-panel)",
                textDecoration: "none",
                color: "var(--ink)",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--amber-soft)";
                (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in oklch, var(--amber) 30%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--amber-soft)",
                  display: "grid",
                  placeItems: "center",
                  color: "oklch(0.50 0.17 60)",
                  flexShrink: 0,
                }}
              >
                <IconTruck size={15} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Demande d'envoi</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>Créer un envoi</div>
              </div>
            </Link>

            {/* Manage agents */}
            <Link
              to="/agents"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 9,
                border: "1px solid var(--line)",
                background: "var(--bg-panel)",
                textDecoration: "none",
                color: "var(--ink)",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--emerald-soft)";
                (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in oklch, var(--emerald) 25%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: "var(--emerald-soft)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--emerald)",
                  flexShrink: 0,
                }}
              >
                <IconUser size={15} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Gérer les agents</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>Utilisateurs et rôles</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
