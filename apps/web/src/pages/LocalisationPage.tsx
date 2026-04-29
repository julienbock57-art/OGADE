import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
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

  const { data: sites, isLoading } = useQuery<SiteMapData[]>({
    queryKey: ["sites", "map-data"],
    queryFn: () => api.get("/sites/map-data"),
  });

  const totalMateriels = (sites ?? []).reduce((s, x) => s + x.materielCount, 0);
  const totalMaquettes = (sites ?? []).reduce((s, x) => s + x.maquetteCount, 0);

  return (
    <div style={{ padding: "22px 28px 40px" }}>
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
          {sites.map((site) => (
            <div
              key={site.id}
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "12px 16px",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onClick={() => navigate(`/materiels?site=${site.code}`)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-line)";
                (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
              }}
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
          ))}
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
              >
                <Popup>
                  <div style={{ minWidth: 180, fontFamily: "inherit" }}>
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
                        onClick={() => navigate(`/materiels?site=${site.code}`)}
                        style={{
                          flex: 1, padding: "5px 8px", fontSize: 11.5, fontWeight: 500,
                          background: "#4f46e5", color: "white", border: "none",
                          borderRadius: 6, cursor: "pointer",
                        }}
                      >
                        Matériels
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/maquettes?site=${site.code}`)}
                        style={{
                          flex: 1, padding: "5px 8px", fontSize: 11.5, fontWeight: 500,
                          background: "#7c3aed", color: "white", border: "none",
                          borderRadius: 6, cursor: "pointer",
                        }}
                      >
                        Maquettes
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
