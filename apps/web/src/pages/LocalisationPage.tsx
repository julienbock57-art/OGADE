import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Materiel, Maquette, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";

// Fix Leaflet default marker icons in Vite bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type SiteMapData = {
  id: number;
  code: string;
  label: string;
  ville: string | null;
  latitude: number;
  longitude: number;
  materielCount: number;
  maquetteCount: number;
};

export default function LocalisationPage() {
  const navigate = useNavigate();
  const [selectedSite, setSelectedSite] = useState<SiteMapData | null>(null);

  const { data: sites, isLoading } = useQuery<SiteMapData[]>({
    queryKey: ["sites", "map-data"],
    queryFn: () => api.get("/sites/map-data"),
  });

  // Listes matériels / maquettes du site sélectionné
  const { data: materielsPage, isLoading: matLoading } = useQuery<PaginatedResult<Materiel>>({
    queryKey: ["materiels", "by-site", selectedSite?.code],
    queryFn: () =>
      api.get("/materiels", { site: selectedSite!.code, pageSize: 200, page: 1 }),
    enabled: !!selectedSite,
  });
  const { data: maquettesPage, isLoading: maqLoading } = useQuery<PaginatedResult<Maquette>>({
    queryKey: ["maquettes", "by-site", selectedSite?.code],
    queryFn: () =>
      api.get("/maquettes", { site: selectedSite!.code, pageSize: 200, page: 1 }),
    enabled: !!selectedSite,
  });

  const materiels = materielsPage?.data ?? [];
  const maquettes = maquettesPage?.data ?? [];

  const totalMateriels = (sites ?? []).reduce((s, x) => s + x.materielCount, 0);
  const totalMaquettes = (sites ?? []).reduce((s, x) => s + x.maquetteCount, 0);

  return (
    <div className="localisation-page" style={{ padding: "22px 28px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            Localisation des actifs
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4, marginBottom: 0 }}>
            {isLoading
              ? "Chargement..."
              : `${sites?.length ?? 0} site${(sites?.length ?? 0) > 1 ? "s" : ""} géolocalisé${(sites?.length ?? 0) > 1 ? "s" : ""} · ${totalMateriels} matériel${totalMateriels > 1 ? "s" : ""} · ${totalMaquettes} maquette${totalMaquettes > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {!isLoading && sites && sites.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
          {sites.map((site) => {
            const active = selectedSite?.id === site.id;
            return (
              <div
                key={site.id}
                style={{
                  background: active ? "var(--accent-soft)" : "var(--bg-panel)",
                  border: `1px solid ${active ? "var(--accent-line)" : "var(--line)"}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onClick={() => setSelectedSite(active ? null : site)}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{site.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                  {site.ville ?? "—"}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 11.5 }}>
                    <span style={{ fontWeight: 600, color: "var(--accent-ink)" }}>{site.materielCount}</span>
                    <span style={{ color: "var(--ink-3)", marginLeft: 4 }}>matériel{site.materielCount > 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ fontSize: 11.5 }}>
                    <span style={{ fontWeight: 600, color: "var(--violet)" }}>{site.maquetteCount}</span>
                    <span style={{ color: "var(--ink-3)", marginLeft: 4 }}>maquette{site.maquetteCount > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Map */}
      <div
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          overflow: "hidden",
          height: 560,
        }}
      >
        {isLoading ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "3px solid var(--line)", borderTopColor: "var(--accent)",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Chargement de la carte...</p>
            </div>
          </div>
        ) : !sites || sites.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", maxWidth: 320 }}>
              <svg width="48" height="48" fill="none" viewBox="0 0 20 20" stroke="var(--ink-4)" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
                <path d="M3 5l5-2 4 2 5-2v12l-5 2-4-2-5 2z M8 3v12 M12 5v12" />
              </svg>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)", margin: "0 0 4px" }}>
                Aucun site géolocalisé
              </p>
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>
                Renseignez l'adresse des sites dans l'administration pour les voir apparaître sur la carte.
              </p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[46.6, 2.5]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {sites.map((site) => (
              <Marker
                key={site.id}
                position={[site.latitude, site.longitude]}
                eventHandlers={{
                  click: () => setSelectedSite(site),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: "inherit" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{site.label}</div>
                    {site.ville && (
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{site.ville}</div>
                    )}
                    <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#4f46e5" }}>{site.materielCount}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>Matériel{site.materielCount > 1 ? "s" : ""}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#7c3aed" }}>{site.maquetteCount}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>Maquette{site.maquetteCount > 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedSite(site)}
                        style={{
                          flex: 1, padding: "5px 8px", fontSize: 11.5, fontWeight: 500,
                          background: "#4f46e5", color: "white", border: "none",
                          borderRadius: 6, cursor: "pointer",
                        }}
                      >
                        Voir les actifs
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/materiels?site=${site.code}`)}
                        style={{
                          flex: 1, padding: "5px 8px", fontSize: 11.5, fontWeight: 500,
                          background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db",
                          borderRadius: 6, cursor: "pointer",
                        }}
                      >
                        Liste complète
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Listes matériels + maquettes du site sélectionné */}
      {selectedSite && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                {selectedSite.label}
                {selectedSite.ville && (
                  <span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 400 }}> · {selectedSite.ville}</span>
                )}
              </h2>
              <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "2px 0 0" }}>
                {selectedSite.materielCount} matériel{selectedSite.materielCount > 1 ? "s" : ""} · {selectedSite.maquetteCount} maquette{selectedSite.maquetteCount > 1 ? "s" : ""} sur ce site
              </p>
            </div>
            <button
              type="button"
              className="obtn ghost sm"
              onClick={() => setSelectedSite(null)}
            >
              Fermer
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Matériels */}
            <ListePanel
              title="Matériels"
              count={materiels.length}
              loading={matLoading}
              emptyLabel="Aucun matériel sur ce site"
              items={materiels.map((m) => ({
                id: m.id,
                reference: m.reference,
                libelle: m.libelle,
                sub: m.typeMateriel ?? m.modele ?? "—",
                href: `/materiels/${m.id}`,
              }))}
            />
            {/* Maquettes */}
            <ListePanel
              title="Maquettes"
              count={maquettes.length}
              loading={maqLoading}
              emptyLabel="Aucune maquette sur ce site"
              items={maquettes.map((m) => ({
                id: m.id,
                reference: m.reference,
                libelle: m.libelle,
                sub: m.typeMaquette ?? m.categorie ?? "—",
                href: `/maquettes/${m.id}`,
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ListePanelItem {
  id: number;
  reference: string;
  libelle: string;
  sub: string;
  href: string;
}

function ListePanel({
  title,
  count,
  loading,
  emptyLabel,
  items,
}: {
  title: string;
  count: number;
  loading: boolean;
  emptyLabel: string;
  items: ListePanelItem[];
}) {
  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: 480,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--ink-3)",
          }}
        >
          {title} ({count})
        </span>
      </div>
      <div style={{ overflow: "auto", flex: 1 }}>
        {loading ? (
          <p style={{ padding: 14, fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>Chargement…</p>
        ) : items.length === 0 ? (
          <p style={{ padding: 14, fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>{emptyLabel}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                {["Référence", "Libellé", "Type"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      borderBottom: "1px solid var(--line-2)",
                      background: "var(--bg-panel)",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid var(--line-2)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sunken, #f9fafb)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td style={{ padding: "8px 12px" }}>
                    <Link
                      to={item.href}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--accent)",
                        textDecoration: "none",
                      }}
                    >
                      {item.reference}
                    </Link>
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-2)" }}>{item.libelle}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-3)" }}>{item.sub}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
