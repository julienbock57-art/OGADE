import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Defaut, Evenement, Fichier, Maquette } from "@ogade/shared";
import { api } from "@/lib/api";
import {
  MQ_ETAT_PILL,
  defautColor,
  mqIconPaths,
  mqTypeClass,
} from "@/lib/maquette-helpers";

// ─── ICON ─────────────────────────────────────────────────────────
function Icon({
  name,
  size = 14,
  stroke = 1.6,
}: {
  name: string;
  size?: number;
  stroke?: number;
}) {
  const segments = mqIconPaths(name);
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
      {segments.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

// ─── FORME ICON ───────────────────────────────────────────────────
function FormeIcon({ forme, size = 18 }: { forme?: string | null; size?: number }) {
  const sw = 1.6;
  const f = (forme ?? "").toLowerCase();
  const stroke = "currentColor";
  if (f.includes("tube"))
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <rect x="2" y="6" width="16" height="8" rx="4" stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  if (f.includes("coude"))
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path d="M3 14 V10 a4 4 0 0 1 4 -4 H17" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  if (f.includes("té") || f === "te")
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path d="M2 13 H18 M10 13 V3" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  if (f.includes("soudure"))
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <rect x="2" y="7" width="16" height="6" stroke={stroke} strokeWidth={sw} />
        <path d="M10 5 V15" stroke="oklch(0.55 0.20 280)" strokeWidth={sw} strokeDasharray="2 2" />
      </svg>
    );
  if (f.includes("piquage"))
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <rect x="2" y="9" width="16" height="6" stroke={stroke} strokeWidth={sw} />
        <circle cx="13" cy="5" r="2.5" stroke={stroke} strokeWidth={sw} />
        <path d="M13 8 V12" stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  if (f.includes("réservoir") || f.includes("reservoir"))
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="13" rx="2" stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="6" width="14" height="9" stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}
export { FormeIcon };

// ─── HELPERS ──────────────────────────────────────────────────────
function fmtDate(d?: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function PropCard({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="prop-card">
      <div className="h">
        <span className="ic"><Icon name={icon} size={13} /></span>
        {title}
        {count !== undefined && <span className="count">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <span className="field-value">{children}</span>
    </div>
  );
}

function Avatar({ nom, prenom, size = 22 }: { nom?: string; prenom?: string; size?: number }) {
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  const palette = [
    "oklch(0.70 0.15 30)",
    "oklch(0.70 0.15 150)",
    "oklch(0.70 0.15 210)",
    "oklch(0.70 0.15 275)",
    "oklch(0.70 0.15 340)",
    "oklch(0.70 0.15 60)",
  ];
  const c = palette[(initials.charCodeAt(0) || 0) % palette.length];
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: c,
        color: "white",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.42),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

// ─── INFOS TAB ────────────────────────────────────────────────────
function InfosTab({ m }: { m: Maquette }) {
  const typesCnd = (m.typeControle ?? "")
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const procedures = (m.procedures ?? "")
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const allCertifies = (m.defauts ?? []).every((d) => d.certifie);
  const someCertifies = (m.defauts ?? []).some((d) => d.certifie);

  return (
    <div className="vstack" style={{ gap: 16 }}>
      <PropCard title="Identification" icon="box">
        <div className="drawer-grid two">
          <Field label="Référence"><span className="mono">{m.reference}</span></Field>
          <Field label="Libellé">{m.libelle}</Field>
          <Field label="N° de FIEC"><span className="mono">{m.numeroFIEC ?? "—"}</span></Field>
          <Field label="Référence unique">{m.referenceUnique ?? "—"}</Field>
          <Field label="Type de maquette">{m.typeMaquette ?? "—"}</Field>
          <Field label="Catégorie">{m.categorie ?? "—"}</Field>
          <Field label="Forme">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <FormeIcon forme={m.forme} size={14} />
              {m.forme ?? "—"}
            </span>
          </Field>
          <Field label="Matière">{m.matiere ?? "—"}</Field>
          <Field label="Composant">{m.composant ?? "—"}</Field>
          <Field label="Type d'assemblage">{m.typeAssemblage ?? "—"}</Field>
          <Field label="Type de contrôle">
            {typesCnd.length > 0 ? (
              <span className="cnd-chips">
                {typesCnd.map((t) => <span key={t} className="cnd-chip">{t}</span>)}
              </span>
            ) : "—"}
          </Field>
          <Field label="Référencée ASN">
            {m.referenceASN ? <span className="asn-flag">OUI</span> : "Non"}
          </Field>
          <Field label="Informations certifiées">
            {m.informationsCertifiees
              ? "Oui"
              : (m.defauts && m.defauts.length > 0
                  ? (allCertifies ? "Oui" : someCertifies ? "Partielles" : "Non")
                  : "—")}
          </Field>
          <Field label="Produits chimiques">{m.produitsChimiques ? "Oui" : "Non"}</Field>
        </div>
      </PropCard>

      <PropCard title="Dimensions & poids" icon="ruler">
        <div className="drawer-grid two">
          {m.longueur != null && <Field label="Longueur">{m.longueur} mm</Field>}
          {m.largeur != null && <Field label="Largeur">{m.largeur} mm</Field>}
          {m.hauteur != null && <Field label="Hauteur">{m.hauteur} mm</Field>}
          {m.dn != null && <Field label="DN">{m.dn}</Field>}
          {m.epaisseurParoi != null && <Field label="Épaisseur paroi">{m.epaisseurParoi} mm</Field>}
          {m.poids != null && <Field label="Poids">{m.poids} kg</Field>}
          {m.quantite != null && <Field label="Quantité">{m.quantite}</Field>}
        </div>
      </PropCard>

      <PropCard title="Localisation" icon="pin">
        <div className="drawer-grid two">
          <Field label="Entreprise">{m.entreprise ?? "—"}</Field>
          <Field label="Pôle / Entité">{m.poleEntite ?? "—"}</Field>
          <Field label="Site">{m.site ?? "—"}</Field>
          <Field label="Localisation">{m.localisation ?? "—"}</Field>
          <Field label="Salle">{m.localisationSalle ?? "—"}</Field>
          <Field label="Rayonnage">{m.localisationRayonnage ?? "—"}</Field>
          <Field label="Adresse">
            {[m.adresseNumVoie, m.adresseNomVoie].filter(Boolean).join(" ") || "—"}
          </Field>
          <Field label="Ville">
            {[m.adresseCodePostal, m.adresseVille].filter(Boolean).join(" ") || "—"}
          </Field>
          <Field label="Pays">{m.adressePays ?? "—"}</Field>
          <Field label="Site (libellé)">{m.adresseSite ?? "—"}</Field>
        </div>
        {m.complementsLocalisation && (
          <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>
            {m.complementsLocalisation}
          </p>
        )}
      </PropCard>

      <PropCard title="Référent & emprunt" icon="user">
        <div className="drawer-grid two">
          <Field label="Propriétaire">
            {m.proprietaire ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Avatar nom={m.proprietaire.nom} prenom={m.proprietaire.prenom} size={20} />
                {m.proprietaire.prenom} {m.proprietaire.nom}
              </span>
            ) : "—"}
          </Field>
          <Field label="Référent maquette">
            {m.referent ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Avatar nom={m.referent.nom} prenom={m.referent.prenom} size={20} />
                {m.referent.prenom} {m.referent.nom}
              </span>
            ) : "—"}
          </Field>
          <Field label="Statut">
            <span className={MQ_ETAT_PILL[m.etat]?.cls ?? "pill c-neutral"}>
              <span className="dot" />
              {MQ_ETAT_PILL[m.etat]?.label ?? m.etat}
            </span>
          </Field>
          <Field label="En transit">{m.enTransit ? "Oui" : "Non"}</Field>
          {m.etat === "EMPRUNTEE" && (
            <>
              <Field label="Emprunteur">
                {m.emprunteur ? `${m.emprunteur.prenom} ${m.emprunteur.nom}` : "—"}
              </Field>
              <Field label="Emprunteur entreprise">{m.emprunteurEntreprise ?? "—"}</Field>
              <Field label="Date d'emprunt">{fmtDate(m.dateEmprunt)}</Field>
              <Field label="Retour estimé">{fmtDate(m.dateRetour)}</Field>
            </>
          )}
        </div>
      </PropCard>

      {(m.description || m.vieMaquette || m.historiqueTexte || m.descriptionDefauts || m.commentaires) && (
        <PropCard title="Description & vie" icon="info">
          <div className="vstack" style={{ gap: 10, fontSize: 12.5, lineHeight: 1.55 }}>
            {m.description && (
              <div>
                <div className="field-label" style={{ marginBottom: 3 }}>Description</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.description}</div>
              </div>
            )}
            {m.descriptionDefauts && (
              <div>
                <div className="field-label" style={{ marginBottom: 3 }}>Description des défauts</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.descriptionDefauts}</div>
              </div>
            )}
            {m.vieMaquette && (
              <div>
                <div className="field-label" style={{ marginBottom: 3 }}>Vie de la maquette</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.vieMaquette}</div>
              </div>
            )}
            {m.historiqueTexte && (
              <div>
                <div className="field-label" style={{ marginBottom: 3 }}>Historique</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.historiqueTexte}</div>
              </div>
            )}
            {m.pieces && (
              <div>
                <div className="field-label" style={{ marginBottom: 3 }}>Pièces</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.pieces}</div>
              </div>
            )}
            {m.commentaires && (
              <div>
                <div className="field-label" style={{ marginBottom: 3 }}>Commentaires</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.commentaires}</div>
              </div>
            )}
          </div>
        </PropCard>
      )}

      {(m.lienECM || m.lienECMRFF || m.lienPhotos) && (
        <PropCard title="Liens & ECM" icon="info">
          <div className="vstack" style={{ gap: 8, fontSize: 12.5 }}>
            {m.lienECM && (
              <div><span className="field-label">Lien ECM : </span>
                <a href={m.lienECM} target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>{m.lienECM}</a>
              </div>
            )}
            {m.lienECMRFF && (
              <div><span className="field-label">Lien ECM RFF : </span>
                <a href={m.lienECMRFF} target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>{m.lienECMRFF}</a>
              </div>
            )}
            {m.lienPhotos && (
              <div><span className="field-label">Photos : </span>
                <span style={{ whiteSpace: "pre-wrap" }}>{m.lienPhotos}</span>
              </div>
            )}
          </div>
        </PropCard>
      )}

      <PropCard title="Patrimoine" icon="info">
        <div className="drawer-grid two">
          <Field label="Valeur financière">
            {m.valeurFinanciere != null ? `${m.valeurFinanciere.toLocaleString("fr-FR")} €` : "—"}
          </Field>
          <Field label="Durée de vie">
            {m.dureeVie != null ? `${m.dureeVie} ans` : "—"}
          </Field>
          <Field label="Hors patrimoine">{m.horsPatrimoine ? "Oui" : "Non"}</Field>
          <Field label="Procédures">
            {procedures.length > 0 ? (
              <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4 }}>
                {procedures.map((p) => <span key={p} className="tag mono">{p}</span>)}
              </span>
            ) : "—"}
          </Field>
          {m.amortissement && (
            <div className="field full">
              <span className="field-label">Amortissement</span>
              <span className="field-value" style={{ whiteSpace: "pre-wrap" }}>{m.amortissement}</span>
            </div>
          )}
        </div>
      </PropCard>
    </div>
  );
}

// Placeholder export — other tabs will be added by the next step.
type TabId = "infos" | "defauts" | "pj" | "photos" | "historique" | "colisage" | "qr";

const TABS: { id: TabId; label: string; icon: string; countKey?: "defauts" }[] = [
  { id: "infos",      label: "Infos générales", icon: "eye" },
  { id: "defauts",    label: "Défauts & plan",  icon: "alert", countKey: "defauts" },
  { id: "pj",         label: "Documents & ECM", icon: "clip" },
  { id: "photos",     label: "Photos",          icon: "photo" },
  { id: "historique", label: "Historique",      icon: "history" },
  { id: "colisage",   label: "Colisage",        icon: "box" },
  { id: "qr",         label: "QR / fiche",      icon: "qr" },
];

export type MaquetteDrawerProps = {
  maquette: Maquette;
  onClose?: () => void;
  initialTab?: TabId;
  mode?: "drawer" | "page";
};

export default function MaquetteDrawer({
  maquette: m,
  onClose,
  initialTab = "infos",
  mode = "drawer",
}: MaquetteDrawerProps) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const isPage = mode === "page";
  const defauts: Defaut[] = m.defauts ?? [];

  useEffect(() => {
    if (isPage || !onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, isPage]);

  const etatPill = MQ_ETAT_PILL[m.etat] ?? { cls: "pill c-neutral", label: m.etat };

  const head = (
    <div className="drawer-head">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="hstack" style={{ gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <span className={etatPill.cls}><span className="dot" />{etatPill.label}</span>
          {m.typeMaquette && (
            <span className={`mq-type ${mqTypeClass(m.typeMaquette)}`}>{m.typeMaquette}</span>
          )}
          {m.referenceASN && <span className="asn-flag">Référencée ASN</span>}
          {m.horsPatrimoine && (
            <span className="tag" style={{ background: "var(--bg-sunken)", color: "var(--ink-3)" }}>
              Hors patrimoine
            </span>
          )}
        </div>
        <h2 className="drawer-title">
          {m.reference}
          {m.forme || m.matiere ? (
            <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>
              {" — "}{[m.forme, m.matiere].filter(Boolean).join(" ")}
            </span>
          ) : null}
        </h2>
        <div className="drawer-sub">
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.libelle}</span>
          <span><Icon name="pin" size={11} />{m.site ?? "—"}{m.localisation ? ` · ${m.localisation}` : ""}</span>
          {m.poids != null && <span>{m.poids} kg</span>}
        </div>
      </div>
      <div className="hstack" style={{ gap: 6 }}>
        {!isPage && (
          <Link to={`/maquettes/${m.id}`} className="obtn">
            <Icon name="eye" size={13} />
            Page détail
          </Link>
        )}
        <Link to={`/maquettes/${m.id}/edit`} className="obtn accent">
          <Icon name="edit" size={13} />
          Modifier
        </Link>
        {!isPage && onClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    </div>
  );

  const tabsBar = (
    <div className="mq-tabs">
      {TABS.map((t) => {
        const count = t.countKey === "defauts" ? defauts.length : undefined;
        return (
          <button
            key={t.id}
            className={`mq-tab${tab === t.id ? " on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={13} />
            <span>{t.label}</span>
            {count !== undefined && <span className="mq-tab-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );

  const body = (
    <div className="drawer-body">
      {tab === "infos" && <InfosTab m={m} />}
      {/* Other tabs are mounted by extension files for clarity */}
      {tab === "defauts" && <DefautsTab m={m} defauts={defauts} />}
      {tab === "pj" && <PiecesJointesTab m={m} />}
      {tab === "photos" && <PhotosTab m={m} />}
      {tab === "historique" && <HistoriqueTab m={m} />}
      {tab === "colisage" && <ColisageTab m={m} />}
      {tab === "qr" && <QrTab m={m} />}
    </div>
  );

  const foot = (
    <div className="drawer-foot">
      <div className="left">
        {isPage ? (
          <Link to="/maquettes" className="obtn ghost">
            Retour à la liste
          </Link>
        ) : (
          <button type="button" className="obtn ghost">
            <Icon name="dl" size={13} />
            Exporter
          </button>
        )}
      </div>
      <div className="right">
        <Link to={`/maquettes/${m.id}/edit`} className="obtn accent">
          <Icon name="edit" size={13} />
          Modifier
        </Link>
      </div>
    </div>
  );

  const content = (
    <>
      {head}
      {tabsBar}
      {body}
      {foot}
    </>
  );

  if (isPage) {
    return <div className="maquette-page-view">{content}</div>;
  }
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer wide">{content}</div>
    </>
  );
}

// ─── DEFAUTS TAB (plan + table) ───────────────────────────────────
function planShapeClass(forme?: string | null): string {
  const f = (forme ?? "").toLowerCase();
  if (f.includes("tube")) return "tube";
  if (f.includes("coude")) return "coude";
  if (f.includes("soudure")) return "soudure";
  if (f.includes("té") || f === "te") return "te";
  return "";
}

function DefautsTab({ m, defauts }: { m: Maquette; defauts: Defaut[] }) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const shape = planShapeClass(m.forme);
  const scale = m.longueur
    ? `${m.longueur} mm × ${m.largeur ?? m.epaisseurParoi ?? m.dn ?? "?"} mm`
    : m.dn
      ? `DN ${m.dn} × ${m.epaisseurParoi ?? "?"} mm`
      : "—";

  return (
    <div className="vstack" style={{ gap: 16 }}>
      <PropCard title="Plan des défauts — vue de dessus" icon="map">
        <div className="mq-plan-wrap">
          <div className="mq-plan-axes">
            <span style={{ position: "absolute", top: 0, left: 0 }}>Y ↑</span>
          </div>
          <div className="mq-plan-scale">{scale}</div>
          <div className="mq-plan">
            <div className={`mq-plan-shape ${shape}`} />
            {defauts.map((d, idx) => {
              const left = d.posX != null ? d.posX : 10 + ((idx * 13) % 80);
              const top = d.posY != null ? d.posY : 30 + ((idx * 17) % 40);
              const color = defautColor(d.couleur ?? d.typeDefaut);
              const num = String(idx + 1);
              return (
                <div
                  key={d.id}
                  className={`mq-plan-defect${hoverId === d.id ? " on" : ""}`}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    ["--def-color" as string]: color,
                  } as React.CSSProperties}
                  title={`${d.typeDefaut}${d.position ? ` · ${d.position}` : ""}`}
                  onMouseEnter={() => setHoverId(d.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  {num}
                </div>
              );
            })}
            {defauts.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink-3)",
                  fontSize: 12,
                }}
              >
                Aucun défaut enregistré
              </div>
            )}
          </div>
        </div>
        <div className="hstack" style={{ gap: 6, marginTop: 10, color: "var(--ink-3)", fontSize: 11 }}>
          Survolez ou cliquez un point pour le mettre en évidence
        </div>
      </PropCard>

      <div className="defects-sub">
        <div className="defects-sub-h">
          <Icon name="alert" size={13} />
          Tableau des défauts artificiels
          <span className="count">{defauts.length}</span>
          <span style={{ flex: 1 }} />
          <button className="obtn sm" type="button">
            <Icon name="dl" size={11} />Exporter CSV
          </button>
          <button className="obtn sm accent" type="button">
            <Icon name="plus" size={11} />Ajouter défaut
          </button>
        </div>
        <table className="defects">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Type</th>
              <th>Position</th>
              <th>L (mm)</th>
              <th>l (mm)</th>
              <th>Profond.</th>
              <th>Ø (mm)</th>
              <th>Côté</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {defauts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: 24, color: "var(--ink-3)" }}>
                  Aucun défaut enregistré pour cette maquette.
                </td>
              </tr>
            ) : (
              defauts.map((d, idx) => (
                <tr
                  key={d.id}
                  className={hoverId === d.id ? "on" : ""}
                  onMouseEnter={() => setHoverId(d.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <td className="mono" style={{ color: "var(--ink-3)" }}>D{idx + 1}</td>
                  <td>
                    <span
                      className="defect-pill"
                      style={{ ["--def-color" as string]: defautColor(d.couleur ?? d.typeDefaut) } as React.CSSProperties}
                    >
                      {d.typeDefaut}
                    </span>
                  </td>
                  <td className="mono xs">{d.position ?? "—"}</td>
                  <td>{d.longueur ?? "—"}</td>
                  <td>{d.largeur ?? "—"}</td>
                  <td>{d.profondeur ?? "—"}</td>
                  <td>{d.diametre ?? "—"}</td>
                  <td className="xs">{d.cote ?? "—"}</td>
                  <td>
                    {d.certifie ? (
                      <span className="tag" style={{ background: "var(--emerald-soft)", color: "var(--emerald)" }}>
                        Certifié
                      </span>
                    ) : (
                      <span className="tag" style={{ background: "var(--amber-soft)", color: "oklch(0.50 0.17 60)" }}>
                        À vérifier
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// ─── PIECES JOINTES TAB ──────────────────────────────────────────
function fileExt(name?: string | null) {
  if (!name) return "DOC";
  const ext = name.split(".").pop()?.toUpperCase() ?? "DOC";
  return ext.length <= 4 ? ext : "DOC";
}
function fmtSize(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function PiecesJointesTab({ m }: { m: Maquette }) {
  const { data: docs, isLoading } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "MAQUETTE", m.id, "DOCUMENT"],
    queryFn: () =>
      api.get(`/fichiers/entity/MAQUETTE/${m.id}`, { typeFichier: "DOCUMENT" }),
  });
  const procedures = (m.procedures ?? "")
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const handleDownload = async (f: Fichier) => {
    const blob = await api.fetchBlob(`/fichiers/${f.id}/download`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.nomOriginal ?? f.blobKey;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="vstack" style={{ gap: 12 }}>
      <PropCard title="Procédures associées" icon="flask">
        {procedures.length === 0 ? (
          <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 12.5 }}>
            Aucune procédure renseignée.
          </p>
        ) : (
          <div className="hstack" style={{ gap: 6, flexWrap: "wrap" }}>
            {procedures.map((p) => (
              <span key={p} className="tag mono">{p}</span>
            ))}
          </div>
        )}
      </PropCard>

      <PropCard title="Documents" icon="dl">
        {isLoading ? (
          <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 12.5 }}>
            Chargement…
          </p>
        ) : docs && docs.length > 0 ? (
          <div className="vstack" style={{ gap: 8 }}>
            {docs.map((f) => (
              <div key={f.id} className="doc">
                <div className="doc-icon pdf">{fileExt(f.nomOriginal)}</div>
                <div className="doc-info">
                  <div className="doc-name">{f.nomOriginal ?? f.blobKey}</div>
                  <div className="doc-meta">
                    {fmtSize(f.tailleOctets)} ·{" "}
                    {new Date(f.uploadedAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => handleDownload(f)}
                  aria-label="Télécharger"
                  type="button"
                >
                  <Icon name="dl" size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="dropzone">
            <Icon name="dl" size={20} />
            <div style={{ marginTop: 6 }}>
              Glissez des fichiers ici ou{" "}
              <span className="a">parcourir</span>
            </div>
          </div>
        )}
      </PropCard>
    </div>
  );
}

// ─── PHOTOS TAB ──────────────────────────────────────────────────
function PhotosTab({ m }: { m: Maquette }) {
  const { data: photos, isLoading } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "MAQUETTE", m.id, "PHOTO"],
    queryFn: () =>
      api.get(`/fichiers/entity/MAQUETTE/${m.id}`, { typeFichier: "PHOTO" }),
  });
  return (
    <div className="vstack" style={{ gap: 12 }}>
      <PropCard title="Photos" icon="photo">
        {isLoading ? (
          <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 12.5 }}>
            Chargement…
          </p>
        ) : photos && photos.length > 0 ? (
          <div className="hstack" style={{ gap: 8, flexWrap: "wrap" }}>
            {photos.map((p) => (
              <PhotoThumb key={p.id} fichier={p} />
            ))}
          </div>
        ) : (
          <div className="dropzone dropzone-mini">
            Aucune photo · Glissez pour ajouter
          </div>
        )}
      </PropCard>
    </div>
  );
}

function PhotoThumb({ fichier }: { fichier: Fichier }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let revoke: string | null = null;
    api
      .fetchBlob(`/fichiers/${fichier.id}/download`)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        revoke = url;
        setSrc(url);
      })
      .catch(() => {});
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [fichier.id]);
  return (
    <div
      style={{
        width: 110,
        height: 110,
        borderRadius: 8,
        background: "var(--bg-sunken)",
        border: "1px solid var(--line)",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={fichier.nomOriginal ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Icon name="photo" size={20} />
      )}
    </div>
  );
}

// ─── HISTORIQUE TAB ──────────────────────────────────────────────
const EVENT_TITLES: Record<string, string> = {
  CREATED: "Création de la maquette",
  UPDATED: "Modification",
  DELETED: "Suppression",
  EMPRUNT: "Emprunt",
  RETOUR: "Retour",
  FILE_ADDED: "Fichier ajouté",
  PHOTO_ADDED: "Photo ajoutée",
};

function HistoriqueTab({ m }: { m: Maquette }) {
  const { data, isLoading } = useQuery<Evenement[]>({
    queryKey: ["evenements", "MAQUETTE", m.id],
    queryFn: async () => {
      try {
        return await api.get<Evenement[]>(`/evenements/entity/MAQUETTE/${m.id}`);
      } catch {
        return [] as Evenement[];
      }
    },
  });
  if (isLoading) {
    return (
      <PropCard title="Historique" icon="history">
        <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 12.5 }}>
          Chargement…
        </p>
      </PropCard>
    );
  }
  const events = data ?? [];
  if (events.length === 0) {
    return (
      <PropCard title="Historique" icon="history">
        <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 12.5 }}>
          Aucun évènement enregistré pour cette maquette.
        </p>
      </PropCard>
    );
  }
  return (
    <PropCard title="Historique" icon="history" count={events.length}>
      <div className="vtimeline">
        {events.map((evt, i) => {
          const acteur = evt.acteur;
          return (
            <div key={evt.id} className={`vstep ${i === 0 ? "current" : "done"}`}>
              <div className="vdot">{i === 0 ? <Icon name="check" size={8} /> : null}</div>
              <div className="vbody">
                <div className="vtitle">{EVENT_TITLES[evt.eventType] ?? evt.eventType}</div>
                <div className="vmeta">
                  {new Date(evt.occurredAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {acteur ? ` · ${acteur.prenom} ${acteur.nom}` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PropCard>
  );
}

// ─── COLISAGE TAB ────────────────────────────────────────────────
function ColisageTab({ m }: { m: Maquette }) {
  const colisL = m.colisageLongueur ?? null;
  const colisl = m.colisageLargeur ?? null;
  const colisH = m.colisageHauteur ?? null;
  const colisP = m.colisagePoids ?? null;
  const colisD = m.colisageDescription ?? null;
  const hasAny = colisL != null || colisl != null || colisH != null || colisP != null || colisD;

  return (
    <PropCard title="Caractéristiques de colisage" icon="box">
      {!hasAny ? (
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-3)" }}>
          Aucune information de colisage renseignée.
        </p>
      ) : (
        <div className="drawer-grid two">
          <Field label="Longueur colis">{colisL != null ? `${colisL} mm` : "—"}</Field>
          <Field label="Largeur colis">{colisl != null ? `${colisl} mm` : "—"}</Field>
          <Field label="Hauteur colis">{colisH != null ? `${colisH} mm` : "—"}</Field>
          <Field label="Poids colis">{colisP != null ? `${colisP} kg` : "—"}</Field>
          <Field label="Quantité">{m.quantite ?? "—"}</Field>
          <Field label="Pièces">
            <span style={{ whiteSpace: "pre-wrap" }}>{m.pieces ?? "—"}</span>
          </Field>
          {colisD && (
            <div className="field full">
              <span className="field-label">Description colisage</span>
              <span className="field-value" style={{ whiteSpace: "pre-wrap" }}>{colisD}</span>
            </div>
          )}
        </div>
      )}
    </PropCard>
  );
}

// ─── QR TAB ──────────────────────────────────────────────────────
function QrTab({ m }: { m: Maquette }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const apiPath = `/qrcode/maquette/${m.id}`;
  useEffect(() => {
    let revoke: string | null = null;
    api
      .fetchBlob(apiPath)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        revoke = url;
        setSrc(url);
      })
      .catch(() => setError(true));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [apiPath]);
  const handleDownload = async () => {
    const blob = await api.fetchBlob(apiPath);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-${m.reference}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <PropCard title="QR / fiche" icon="qr">
      <div
        className="vstack"
        style={{ alignItems: "center", gap: 12, padding: "12px 0" }}
      >
        {error ? (
          <div style={{ width: 200, height: 200, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink-3)", fontSize: 12 }}>
            QR indisponible
          </div>
        ) : src ? (
          <img
            src={src}
            alt={`QR ${m.reference}`}
            style={{ width: 200, height: 200, border: "1px solid var(--line)", borderRadius: 12, background: "white", padding: 8 }}
          />
        ) : (
          <div style={{ width: 200, height: 200, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 12, background: "white" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}
        <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{m.reference}</div>
        <div className="muted xs">{m.libelle}</div>
        <div className="hstack" style={{ gap: 8 }}>
          <button className="obtn" onClick={handleDownload} disabled={!src} type="button">
            <Icon name="dl" size={13} />
            Télécharger le QR
          </button>
          <button className="obtn accent" disabled={!src} type="button">
            <Icon name="dl" size={13} />
            Étiquette QR
          </button>
        </div>
      </div>
    </PropCard>
  );
}

// Re-exports for the list page
export { mqTypeClass, MQ_ETAT_PILL, defautColor };
