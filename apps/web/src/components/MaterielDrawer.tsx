import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel, Evenement } from "@ogade/shared";
import { api } from "@/lib/api";
import { useReferentiel, useSites, useEntreprises } from "@/hooks/use-referentiels";

// ─── LOCAL ICON COMPONENT ──────────────────────────────────────────────────
const iconPaths: Record<string, string> = {
  eye:     "M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  clip:    "M7 9l5-5 3 3-7 7-3-3a2 2 0 0 1 0-3",
  photo:   "M3 5h14v10H3z M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M3 13l4-4 4 4 3-3 3 3",
  alert:   "M10 7v4m0 2v.01 M2 16L10 3l8 13H2z",
  history: "M10 18a8 8 0 1 0-8-8 M2 4v4h4 M10 6v4l3 2",
  qr:      "M3 3h6v6H3z M11 3h6v6h-6z M3 11h6v6H3z M11 11h2v2h-2z M15 11h2v2h-2z M11 15h2v2h-2z M15 15h2v2h-2z M5 5h2v2H5z M13 5h2v2h-2z M5 13h2v2H5z",
  x:       "M5 5l10 10M15 5L5 15",
  pin:     "M10 18s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z M10 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  check:   "M4 10l4 4 8-8",
  dl:      "M10 3v10m0 0l-4-4m4 4l4-4M4 16h12",
  copy:    "M6 4h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M10 2h4a2 2 0 0 1 2 2v4",
  edit:    "M12 4l4 4-8 8H4v-4l8-8z",
  cart:    "M3 4h2l2 9h10l2-7H7 M8 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M16 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  dots:    "M5 10h.01M10 10h.01M15 10h.01",
};

function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const d = iconPaths[name] ?? "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i === 0 ? p : "M" + p} />
      ))}
    </svg>
  );
}

// ─── PILL HELPERS ──────────────────────────────────────────────────────────
const etatPillClass: Record<string, string> = {
  CORRECT:     "emerald",
  LEGER_DEFAUT:"amber",
  HS:          "rose",
  PERDU:       "neutral",
};
const etatLabels: Record<string, string> = {
  CORRECT: "Correct",
  LEGER_DEFAUT: "Léger défaut",
  HS: "HS",
  PERDU: "Perdu",
};
const compPillClass: Record<string, string> = {
  COMPLET:   "emerald",
  INCOMPLET: "amber",
};
const compLabels: Record<string, string> = {
  COMPLET: "Complet",
  INCOMPLET: "Incomplet",
};

function EtatPill({ etat }: { etat: string }) {
  const cls = etatPillClass[etat] ?? "neutral";
  return (
    <span className={`pill ${cls}`}>
      <span className="dot" />
      {etatLabels[etat] ?? etat}
    </span>
  );
}

function CompPill({ completude }: { completude: string }) {
  const cls = compPillClass[completude] ?? "neutral";
  return (
    <span className={`pill ${cls}`}>
      <span className="dot" />
      {compLabels[completude] ?? completude}
    </span>
  );
}

// ─── VALIDITY BAR ──────────────────────────────────────────────────────────
function ValidityBar({ m }: { m: Materiel }) {
  if (!m.soumisVerification || !m.dateProchainEtalonnage) return null;
  const echeance = new Date(m.dateProchainEtalonnage);
  const now = new Date();
  const jours = Math.round((echeance.getTime() - now.getTime()) / 86400000);
  const totalDays = (m.validiteEtalonnage ?? 12) * 30;
  const pct = Math.max(0, Math.min(100, 100 - (jours / totalDays) * 100));

  let restCls = "ok";
  let fill = "var(--emerald)";
  let label = `dans ${jours} j`;
  if (jours < 0) {
    restCls = "late";
    fill = "var(--rose)";
    label = `${-jours} j retard`;
  } else if (jours <= 30) {
    restCls = "warn";
    fill = "oklch(0.72 0.17 75)";
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="validity" style={{ marginTop: 10 }}>
      <div className="validity-top">
        <span className="validity-date">{fmt(echeance)}</span>
        <span className={`validity-rest ${restCls}`}>{label}</span>
      </div>
      <div className="validity-bar">
        <div style={{ width: `${pct}%`, background: fill }} />
      </div>
    </div>
  );
}

// ─── DRAWER SECTION ────────────────────────────────────────────────────────
function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="drawer-section" style={{ background: "var(--bg-panel)", borderRadius: 12, border: "1px solid var(--line)", padding: 16 }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

// ─── QR SECTION ───────────────────────────────────────────────────────────
function QrSection({ id, reference, entity }: { id: number; reference: string; entity: "materiel" | "maquette" }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const apiPath = `/qrcode/${entity}/${id}`;

  useEffect(() => {
    let revoke: string | null = null;
    api.fetchBlob(apiPath).then(blob => {
      const url = URL.createObjectURL(blob);
      revoke = url;
      setImgSrc(url);
    }).catch(() => setError(true));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [apiPath]);

  const handleDownload = async () => {
    try {
      const blob = await api.fetchBlob(apiPath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-${reference}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleCopy = async () => {
    try {
      const blob = await api.fetchBlob(apiPath);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const blob = await api.fetchBlob(apiPath);
        const url = URL.createObjectURL(blob);
        window.open(url);
      } catch { /* ignore */ }
    }
  };

  return (
    <DrawerSection title="QR Code de traçabilité">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "12px 0" }}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={`QR Code ${reference}`}
            style={{ width: 200, height: 200, border: "1px solid var(--line)", borderRadius: 12, background: "white", padding: 8 }}
          />
        )}
        {error && <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Impossible de charger le QR code</div>}
        {!imgSrc && !error && (
          <div style={{ width: 200, height: 200, borderRadius: 12, background: "var(--bg-sunken)", display: "grid", placeItems: "center" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>OGADE/{reference}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="obtn" onClick={handleDownload} disabled={!imgSrc}>
            <Icon name="dl" size={13} />
            Télécharger le QR
          </button>
          <button className="obtn" onClick={handleCopy} disabled={!imgSrc}>
            <Icon name={copied ? "check" : "copy"} size={13} />
            {copied ? "Copié !" : "Copier l'image"}
          </button>
        </div>
      </div>
    </DrawerSection>
  );
}

// ─── FIELD ─────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <span className="field-value">{children}</span>
    </div>
  );
}

// ─── FIELD LABEL MAP ──────────────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  reference: "Référence",
  libelle: "Libellé",
  etat: "État",
  typeMateriel: "Type de matériel",
  numeroSerie: "Numéro de série",
  localisation: "Localisation",
  site: "Site",
  description: "Description",
  dateEtalonnage: "Date d'étalonnage",
  dateProchainEtalonnage: "Prochaine échéance",
  modele: "Modèle",
  typeTraducteur: "Type traducteur",
  typeEND: "Type d'END",
  groupe: "Groupe",
  fournisseur: "Fournisseur",
  validiteEtalonnage: "Validité (mois)",
  soumisVerification: "Soumis à vérification",
  enPret: "En prêt",
  motifPret: "Motif du prêt",
  dateRetourPret: "Date retour prêt",
  completude: "Complétude",
  informationVerifiee: "Information vérifiée",
  produitsChimiques: "Produits chimiques",
  commentaires: "Commentaires",
  entreprise: "Entreprise",
  responsableId: "Responsable",
  commentaireEtat: "Commentaire état",
  commentairesCompletude: "Commentaire complétude",
  numeroFIEC: "N° FIEC",
  enTransit: "En transit",
  lotChaine: "Lot / Chaîne",
  complementsLocalisation: "Compléments localisation",
  proprietaire: "Propriétaire",
};

const EVENT_TITLES: Record<string, string> = {
  CREATED: "Création de la fiche",
  UPDATED: "Modification",
  DELETED: "Suppression de la fiche",
};

const EVENT_DOT_COLORS: Record<string, string> = {
  CREATED: "emerald",
  UPDATED: "accent",
  DELETED: "rose",
};

function formatFieldValue(v: any): string {
  if (v === null || v === undefined) return "—";
  if (v === true) return "Oui";
  if (v === false) return "Non";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Date(v).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return String(v);
}

// ─── HISTORIQUE TAB ───────────────────────────────────────────────────────
function HistoriqueTab({ materielId }: { materielId: number }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: events, isLoading } = useQuery<Evenement[]>({
    queryKey: ["materiels", materielId, "historique"],
    queryFn: () => api.get(`/materiels/${materielId}/historique`),
  });

  const fmtEvt = (d: string | Date) =>
    new Date(d).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <DrawerSection title="Historique des modifications & mouvements">
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: "var(--ink-3)", fontSize: 13 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
          Chargement...
        </div>
      </DrawerSection>
    );
  }

  if (!events || events.length === 0) {
    return (
      <DrawerSection title="Historique des modifications & mouvements">
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Aucun historique disponible.</p>
      </DrawerSection>
    );
  }

  return (
    <DrawerSection title="Historique des modifications & mouvements">
      <div className="timeline">
        {events.map((evt) => {
          const title = EVENT_TITLES[evt.eventType] ?? evt.eventType;
          const dotColor = EVENT_DOT_COLORS[evt.eventType] ?? "neutral";
          const acteur = evt.acteur;
          const payload = evt.payload;
          const changedFields = payload?.changedFields;
          const fieldCount = changedFields ? Object.keys(changedFields).length : 0;
          const isExpanded = expandedId === evt.id;
          const hasDetails = fieldCount > 0;

          let meta = acteur ? `${acteur.prenom} ${acteur.nom}` : "Système";
          if (evt.eventType === "UPDATED" && fieldCount > 0) {
            meta += ` · ${fieldCount} champ${fieldCount > 1 ? "s" : ""} modifié${fieldCount > 1 ? "s" : ""}`;
          } else if (evt.eventType === "CREATED") {
            meta += " · Saisie initiale";
          }

          const dotStyle =
            dotColor === "accent"
              ? { background: "var(--accent)", boxShadow: "0 0 0 1.5px var(--accent)" }
              : dotColor === "rose"
                ? { background: "var(--rose)", boxShadow: "0 0 0 1.5px var(--rose)" }
                : undefined;

          return (
            <div key={evt.id} className="timeline-item done">
              <div className="timeline-dot" style={dotStyle} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div className="timeline-title">{title}</div>
                  {hasDetails && (
                    <button
                      className="obtn"
                      style={{ fontSize: 10, padding: "2px 8px", minHeight: 0 }}
                      onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                    >
                      {isExpanded ? "Masquer" : "Détails"}
                    </button>
                  )}
                </div>
                <div className="timeline-meta">
                  {fmtEvt(evt.occurredAt)} · {meta}
                </div>
                {isExpanded && changedFields && (
                  <div style={{ marginTop: 10, background: "var(--bg-sunken)", borderRadius: 8, border: "1px solid var(--line)", overflow: "hidden" }}>
                    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--line)" }}>
                          <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-3)" }}>Champ</th>
                          {evt.eventType === "UPDATED" && (
                            <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-3)" }}>Avant</th>
                          )}
                          <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-3)" }}>
                            {evt.eventType === "UPDATED" ? "Après" : "Valeur initiale"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(changedFields).map(([field, diff]) => (
                          <tr key={field} style={{ borderBottom: "1px solid var(--line-2)" }}>
                            <td style={{ padding: "5px 10px", fontWeight: 500, color: "var(--ink)" }}>{FIELD_LABELS[field] ?? field}</td>
                            {evt.eventType === "UPDATED" && (
                              <td style={{ padding: "5px 10px", color: "var(--rose)", textDecoration: diff.old !== null ? "line-through" : undefined }}>{formatFieldValue(diff.old)}</td>
                            )}
                            <td style={{ padding: "5px 10px", color: "var(--emerald)", fontWeight: 500 }}>{formatFieldValue(diff.new)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DrawerSection>
  );
}

// ─── TAB TYPE ──────────────────────────────────────────────────────────────
type TabId = "infos" | "pj" | "photos" | "etat" | "historique" | "qr";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "infos",      label: "Infos",            icon: "eye"     },
  { id: "pj",         label: "Pièces jointes",   icon: "clip"    },
  { id: "photos",     label: "Photos",           icon: "photo"   },
  { id: "etat",       label: "État · Complétude",icon: "alert"   },
  { id: "historique", label: "Historique",        icon: "history" },
  { id: "qr",         label: "QR code",          icon: "qr"      },
];

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function MaterielDrawer({
  materiel: m,
  onClose,
  initialTab = "infos",
}: {
  materiel: Materiel;
  onClose: () => void;
  initialTab?: TabId;
}) {
  const [tab, setTab] = useState<TabId>(initialTab);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const { data: typesEnd }    = useReferentiel("TYPE_END");
  const { data: typesMat }    = useReferentiel("TYPE_MATERIEL");
  const { data: motifs }      = useReferentiel("MOTIF_PRET");
  const { data: sites }       = useSites();
  const { data: entreprises } = useEntreprises();

  const refLabel = (
    list: { code: string; label: string }[] | undefined,
    code: string | null | undefined
  ) => (code ? (list ?? []).find((r) => r.code === code)?.label ?? code : "—");

  const fmt = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  const fmtShort = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const fmtTime = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resp = m.responsable as { id: number; prenom: string; nom: string } | null | undefined;

  // Derive echéance flag
  const isLate =
    m.soumisVerification &&
    m.dateProchainEtalonnage &&
    new Date(m.dateProchainEtalonnage) < new Date();

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Drawer panel */}
      <div className="drawer">
        {/* Header */}
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="hstack" style={{ gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <EtatPill etat={m.etat} />
              {m.completude && <CompPill completude={m.completude} />}
              {m.enPret && (
                <span className="pill sky">
                  <span className="dot" />
                  En prêt{m.motifPret ? ` · ${refLabel(motifs, m.motifPret)}` : ""}
                </span>
              )}
              {isLate && (
                <span className="flag late">ÉTALONNAGE ÉCHU</span>
              )}
              {m.informationVerifiee && (
                <span className="pill emerald" style={{ fontSize: 10 }}>
                  <Icon name="check" size={10} stroke={3} />
                  Vérifié
                </span>
              )}
            </div>
            <h2 className="title" style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
              {refLabel(typesMat, m.typeMateriel) || m.libelle}{" "}
              <span className="muted" style={{ fontWeight: 400 }}>
                · {m.modele ?? m.libelle}
              </span>
            </h2>
            <div className="id hstack" style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              <span className="mono">{m.reference}</span>
              <span>·</span>
              <span>{m.fournisseur ?? "—"}</span>
              <span>·</span>
              <span>{refLabel(sites, m.site)}</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="otabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`otab${tab === t.id ? " on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* ── Tab: Infos ── */}
          {tab === "infos" && (
            <>
              <DrawerSection title="Informations générales">
                <div className="drawer-grid">
                  <Field label="ID">
                    <span className="mono">{m.reference}</span>
                  </Field>
                  <Field label="N° de FIEC">
                    <span className="mono">{m.numeroFIEC ?? "—"}</span>
                  </Field>
                  <Field label="Pôle propriétaire">{m.proprietaire ?? "—"}</Field>
                  <Field label="Type de matériel">{refLabel(typesMat, m.typeMateriel)}</Field>
                  <Field label="Fournisseur">{m.fournisseur ?? "—"}</Field>
                  <Field label="Modèle">{m.modele ?? "—"}</Field>
                  <Field label="Type d'END">
                    {m.typeEND ? (
                      <span className="tag mono">{refLabel(typesEnd, m.typeEND)}</span>
                    ) : (
                      "—"
                    )}
                  </Field>
                  {m.typeTraducteur && (
                    <Field label="Type traducteur">{m.typeTraducteur}</Field>
                  )}
                  <Field label="Référence lot/chaîne">
                    <span className="mono">{m.lotChaine ?? "—"}</span>
                  </Field>
                  <Field label="Responsable">
                    {resp ? (
                      <span className="hstack" style={{ gap: 6 }}>
                        <span
                          className="avatar"
                          style={{
                            width: 22,
                            height: 22,
                            fontSize: 9,
                            background: "var(--accent)",
                          }}
                        >
                          {resp.prenom?.[0]}
                          {resp.nom?.[0]}
                        </span>
                        {resp.prenom} {resp.nom}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Field>
                  <Field label="Vérification périodique">
                    {m.soumisVerification ? "Oui" : "Non"}
                  </Field>
                  <Field label="Information vérifiée">
                    {m.informationVerifiee ? "Oui" : "Non"}
                  </Field>
                </div>
              </DrawerSection>

              <DrawerSection title="Étalonnage & validité">
                <div className="drawer-grid">
                  <Field label="Dernier étalonnage">{fmt(m.dateEtalonnage)}</Field>
                  <Field label="Validité">
                    {m.validiteEtalonnage ? `${m.validiteEtalonnage} mois` : "—"}
                  </Field>
                  <Field label="Date d'échéance">{fmt(m.dateProchainEtalonnage)}</Field>
                </div>
                <ValidityBar m={m} />
              </DrawerSection>

              <DrawerSection title="Localisation">
                <div className="drawer-grid">
                  <Field label="Localisation">
                    <span className="hstack" style={{ gap: 4 }}>
                      <Icon name="pin" size={13} />
                      {m.localisation ?? "—"}
                    </span>
                  </Field>
                  <Field label="Groupe">{m.groupe ?? "—"}</Field>
                  <Field label="Site">{refLabel(sites, m.site)}</Field>
                  <Field label="Entreprise">
                    {refLabel(entreprises as { code: string; label: string }[] | undefined, m.entreprise)}
                  </Field>
                  <Field label="En prêt">{m.enPret ? "Oui" : "Non"}</Field>
                  <Field label="Motif du prêt">
                    {m.motifPret ? refLabel(motifs, m.motifPret) : "—"}
                  </Field>
                  <Field label="En transit">{m.enTransit ?? "NON"}</Field>
                  <Field label="Date retour prêt">{fmtShort(m.dateRetourPret)}</Field>
                </div>
                {m.complementsLocalisation && (
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: 12,
                      color: "var(--ink-2)",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.55,
                    }}
                  >
                    {m.complementsLocalisation}
                  </p>
                )}
              </DrawerSection>

              <DrawerSection title="Métadonnées">
                <div className="drawer-grid">
                  <Field label="Créé">{fmtTime(m.createdAt)}</Field>
                  <Field label="Modifié">{fmtTime(m.updatedAt)}</Field>
                  {resp && (
                    <Field label="Modifié par">
                      {resp.prenom} {resp.nom}
                    </Field>
                  )}
                </div>
              </DrawerSection>
            </>
          )}

          {/* ── Tab: Pièces jointes ── */}
          {tab === "pj" && (
            <DrawerSection title="Pièces jointes">
              <div className="attach-list">
                {[
                  { nom: `Certificat-etalonnage-${m.reference}.pdf`, taille: "1.4 Mo" },
                  { nom: `Notice-${m.modele ?? m.libelle}.pdf`,       taille: "3.2 Mo" },
                  { nom: `FIEC-${m.numeroFIEC ?? "N-A"}.pdf`,         taille: "820 Ko" },
                ].map((p, i) => (
                  <div key={i} className="attach">
                    <div className="attach-icon">PDF</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="attach-name" title={p.nom}>
                        {p.nom}
                      </div>
                      <div className="attach-meta">{p.taille}</div>
                    </div>
                    <button className="icon-btn" style={{ padding: 5 }}>
                      <Icon name="dl" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}

          {/* ── Tab: Photos ── */}
          {tab === "photos" && (
            <DrawerSection title="Photos du matériel">
              <div className="photo-grid">
                <div className="photo has-img">
                  <span className="photo-label">Photo envoi · 12/03/2026</span>
                </div>
                <div className="photo has-img">
                  <span className="photo-label">Photo réception · 18/03/2026</span>
                </div>
                <div className="photo">
                  <div style={{ textAlign: "center", color: "var(--ink-3)" }}>
                    <Icon name="photo" size={20} />
                    <div className="xs" style={{ marginTop: 6 }}>
                      Ajouter une photo
                    </div>
                  </div>
                </div>
              </div>
            </DrawerSection>
          )}

          {/* ── Tab: État · Complétude ── */}
          {tab === "etat" && (
            <>
              <DrawerSection title="État du matériel">
                <div className="hstack" style={{ gap: 14, marginBottom: 10 }}>
                  <EtatPill etat={m.etat} />
                  <span className="muted xs">Évalué le {fmtTime(m.updatedAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
                  {m.commentaireEtat ||
                    "Aucun commentaire d'état. Le matériel est dans un état conforme et opérationnel."}
                </p>
              </DrawerSection>

              <DrawerSection title="Complétude">
                <div className="hstack" style={{ gap: 14, marginBottom: 10 }}>
                  {m.completude ? (
                    <CompPill completude={m.completude} />
                  ) : (
                    <span className="pill neutral">
                      <span className="dot" />
                      Non renseigné
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
                  {m.commentairesCompletude ||
                    (m.completude === "COMPLET"
                      ? "Tous les accessoires et documents sont présents."
                      : "Aucun commentaire de complétude.")}
                </p>
              </DrawerSection>

              {m.commentaires && (
                <DrawerSection title="Commentaires généraux">
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: "var(--ink-2)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.commentaires}
                  </p>
                </DrawerSection>
              )}
            </>
          )}

          {/* ── Tab: Historique ── */}
          {tab === "historique" && <HistoriqueTab materielId={m.id} />}

          {/* ── Tab: QR code ── */}
          {tab === "qr" && (
            <QrSection id={m.id} reference={m.reference} entity="materiel" />
          )}
        </div>

        {/* Footer */}
        <div className="drawer-foot">
          <div className="left">
            <Link
              to={`/materiels/${m.id}`}
              className="obtn ghost"
            >
              <Icon name="eye" size={13} />
              Exporter
            </Link>
          </div>
          <div className="right">
            <Link to={`/materiels/${m.id}`} className="obtn">
              <Icon name="eye" size={13} />
              Page détail
            </Link>
            <Link to={`/materiels/${m.id}/edit`} className="obtn accent">
              <Icon name="edit" size={13} />
              Modifier
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
