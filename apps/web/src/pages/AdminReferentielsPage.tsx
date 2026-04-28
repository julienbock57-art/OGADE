import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SiteValue, EntrepriseValue } from "@/hooks/use-referentiels";

const typeInfo: Record<string, { label: string; description: string; group: string }> = {
  TYPE_END: { label: "Types END", description: "UT, RT, ET, PT, MT...", group: "Matériels" },
  TYPE_MATERIEL: { label: "Types de matériel", description: "Traducteur, Appareil, Sonde...", group: "Matériels" },
  TYPE_TRADUCTEUR: { label: "Types de traducteur", description: "Mono-élément, Phased Array...", group: "Matériels" },
  GROUPE: { label: "Groupes", description: "UT Conventionnel, PA...", group: "Matériels" },
  ETAT_MATERIEL: { label: "États matériel", description: "Disponible, En service...", group: "Matériels" },
  COMPLETUDE: { label: "Complétude", description: "Complet, Incomplet...", group: "Matériels" },
  MOTIF_PRET: { label: "Motifs de prêt", description: "Formation, Chantier...", group: "Matériels" },
  TYPE_MAQUETTE: { label: "Types de maquette", description: "Mutualisée, Locale...", group: "Maquettes" },
  COMPOSANT: { label: "Composants", description: "Tuyauterie, Cuve...", group: "Maquettes" },
  CATEGORIE: { label: "Catégories", description: "Catégories de maquettes", group: "Maquettes" },
  FORME: { label: "Formes", description: "Tubulaire, Plane...", group: "Maquettes" },
  TYPE_ASSEMBLAGE: { label: "Types d'assemblage", description: "Soudure bout à bout...", group: "Maquettes" },
  MATIERE: { label: "Matières", description: "Acier carbone, Inox...", group: "Maquettes" },
  PROCEDURE: { label: "Procédures", description: "Procédures de contrôle", group: "Maquettes" },
  TYPE_CONTROLE: { label: "Types de contrôle", description: "ISI, Hydrotest...", group: "Maquettes" },
  ETAT_MAQUETTE: { label: "États maquette", description: "Disponible, Indisponible...", group: "Maquettes" },
  URGENCE: { label: "Urgences", description: "Normal, Urgent...", group: "Maquettes" },
};

function MaterielsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.52 12.64l-4.9-2.83a.47.47 0 010-.81l4.9-2.83a.47.47 0 01.47 0l4.9 2.83a.47.47 0 010 .81l-4.9 2.83a.47.47 0 01-.47 0z" />
    </svg>
  );
}

function MaquettesIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.67 5.83L10 2.5 3.33 5.83m13.34 0L10 9.17m6.67-3.34v8.34L10 17.5m0-8.33L3.33 5.83M10 9.17v8.33M3.33 5.83v8.34L10 17.5" />
    </svg>
  );
}

function GroupIcon({ group }: { group: string }) {
  return group === "Matériels" ? <MaterielsIcon /> : <MaquettesIcon />;
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 5l5 5-5 5" />
    </svg>
  );
}

export default function AdminReferentielsPage() {
  const { data: types } = useQuery<string[]>({
    queryKey: ["referentiels", "types"],
    queryFn: () => api.get("/referentiels/types"),
  });

  const { data: sites } = useQuery<SiteValue[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/sites"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: entreprises } = useQuery<EntrepriseValue[]>({
    queryKey: ["entreprises"],
    queryFn: () => api.get("/entreprises"),
    staleTime: 5 * 60 * 1000,
  });

  const groups = ["Matériels", "Maquettes"];

  const allKnownTypes = Object.keys(typeInfo);
  const apiTypes = types ?? [];
  const extraTypes = apiTypes.filter((t) => !typeInfo[t]);
  const allTypes = [...allKnownTypes, ...extraTypes];

  const typesGrouped = groups.map((group) => ({
    group,
    items: allTypes
      .filter((t) => (typeInfo[t]?.group ?? "Matériels") === group)
      .map((t) => ({ type: t, ...(typeInfo[t] ?? { label: t, description: "", group: "Matériels" }) })),
  }));

  return (
    <div style={{ padding: "22px 28px 40px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          Administration des référentiels
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4, marginBottom: 0 }}>
          Gérez les listes de valeurs utilisées dans les formulaires de l'application.
        </p>
      </div>

      {/* Entités avec adresses */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginBottom: 12 }}>
          Entités
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          <Link
            to="/admin/sites"
            style={{
              display: "block",
              background: "var(--bg-panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "16px 18px",
              textDecoration: "none",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-line)";
              (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
              (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "var(--emerald-soft)", color: "var(--emerald)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.71 13.88L11.18 17.42a1.67 1.67 0 01-2.36 0L5.29 13.88a6.67 6.67 0 119.42 0z" />
                  <path d="M12.5 9.17a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Sites</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", background: "var(--bg-sunken)", padding: "1px 8px", borderRadius: 999, border: "1px solid var(--line)" }}>
                    {sites?.length ?? 0}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3, marginBottom: 0 }}>
                  Sites EDF / CNPE avec adresses
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/entreprises"
            style={{
              display: "block",
              background: "var(--bg-panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "16px 18px",
              textDecoration: "none",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-line)";
              (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
              (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "var(--accent-soft)", color: "var(--accent-ink)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15.83 17.5V4.17A1.67 1.67 0 0014.17 2.5H5.83A1.67 1.67 0 004.17 4.17V17.5m11.66 0H2.5m13.33 0H17.5M7.5 5.83h.83m-.83 3.34h.83m3.34-3.34h.83m-.83 3.34h.83M7.5 14.17h5v3.33h-5z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Entreprises</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", background: "var(--bg-sunken)", padding: "1px 8px", borderRadius: 999, border: "1px solid var(--line)" }}>
                    {entreprises?.length ?? 0}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3, marginBottom: 0 }}>
                  Entreprises et fournisseurs
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Listes de référence par groupe */}
      {typesGrouped.map(({ group, items }) => (
        <div key={group} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", marginBottom: 12 }}>
            {group}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {items.map((item) => (
              <Link
                key={item.type}
                to={`/admin/referentiels/${item.type}`}
                style={{
                  display: "block",
                  background: "var(--bg-panel)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  textDecoration: "none",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-line)";
                  (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: "var(--bg-sunken)", color: "var(--ink-3)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <GroupIcon group={group} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      {item.label ?? item.type}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>
                      {item.description ?? ""}
                    </div>
                  </div>
                  <div style={{ color: "var(--ink-4)", flexShrink: 0 }}>
                    <ChevronIcon />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
