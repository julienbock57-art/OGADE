/**
 * MagasinierActionModal — Modal générique pour les actions magasinier
 * (expédition / réception / réception retour). Liste les lignes éligibles
 * et permet de saisir l'état physique de chacune + champs spécifiques.
 */
import { useEffect, useState } from "react";

type Etat = "CORRECT" | "LEGER_DEFAUT" | "HS";
const ETATS: { value: Etat; label: string }[] = [
  { value: "CORRECT", label: "Correct" },
  { value: "LEGER_DEFAUT", label: "Léger défaut" },
  { value: "HS", label: "HS" },
];

export type ModalLigne = {
  id: number;
  reference: string;
  libelle: string;
  kind: "materiel" | "maquette";
};

export type ExpedierPayload = {
  numeroBonTransport: string;
  transporteur: string;
  commentaire?: string;
  lignesEtat: { ligneId: number; etat: Etat }[];
};

export type ReceptionPayload = {
  commentaire?: string;
  lignesEtat: { ligneId: number; etat: Etat }[];
};

interface BaseProps {
  title: string;
  lignes: ModalLigne[];
  onClose: () => void;
  submitting?: boolean;
  error?: string | null;
}

interface ExpedierProps extends BaseProps {
  mode: "expedier";
  onSubmit: (payload: ExpedierPayload) => void;
}

interface ReceptionProps extends BaseProps {
  mode: "receptionner" | "receptionner-retour";
  onSubmit: (payload: ReceptionPayload) => void;
}

type Props = ExpedierProps | ReceptionProps;

export default function MagasinierActionModal(props: Props) {
  const { title, lignes, onClose, submitting, error, mode } = props;
  const [numeroBonTransport, setNumeroBonTransport] = useState("");
  const [transporteur, setTransporteur] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [etats, setEtats] = useState<Record<number, Etat>>(() =>
    Object.fromEntries(lignes.map((l) => [l.id, "CORRECT" as Etat])),
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submitDisabled =
    submitting ||
    (mode === "expedier" && (!numeroBonTransport.trim() || !transporteur.trim()));

  function handleSubmit() {
    const lignesEtat = Object.entries(etats).map(([id, etat]) => ({
      ligneId: Number(id),
      etat,
    }));
    if (mode === "expedier") {
      props.onSubmit({
        numeroBonTransport: numeroBonTransport.trim(),
        transporteur: transporteur.trim(),
        commentaire: commentaire.trim() || undefined,
        lignesEtat,
      });
    } else {
      props.onSubmit({
        commentaire: commentaire.trim() || undefined,
        lignesEtat,
      });
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ width: "min(640px, 96vw)" }}>
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="drawer-title" style={{ margin: 0 }}>{title}</h2>
            <div className="drawer-sub">
              {lignes.length} ligne{lignes.length > 1 ? "s" : ""} concernée{lignes.length > 1 ? "s" : ""}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <div className="drawer-body" style={{ padding: 16 }}>
          {mode === "expedier" && (
            <div className="vstack" style={{ gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>
                  Numéro de bon de transport *
                </label>
                <input
                  type="text"
                  value={numeroBonTransport}
                  onChange={(e) => setNumeroBonTransport(e.target.value)}
                  placeholder="BL-2026-0001"
                  style={{ width: "100%", fontSize: 13, padding: 8, borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>
                  Transporteur *
                </label>
                <input
                  type="text"
                  value={transporteur}
                  onChange={(e) => setTransporteur(e.target.value)}
                  placeholder="DHL, Chronopost, Coursier interne…"
                  style={{ width: "100%", fontSize: 13, padding: 8, borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink)" }}
                />
              </div>
            </div>
          )}

          <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "8px 0 12px" }}>
            État physique par ligne
          </h3>
          <div className="vstack" style={{ gap: 8 }}>
            {lignes.map((l) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8 }}>
                <span className={`tag ${l.kind === "materiel" ? "c-accent" : ""}`} style={{ fontSize: 10 }}>
                  {l.kind === "materiel" ? "MAT" : "MAQ"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600 }}>{l.reference}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{l.libelle}</div>
                </div>
                <select
                  value={etats[l.id] ?? "CORRECT"}
                  onChange={(e) => setEtats((s) => ({ ...s, [l.id]: e.target.value as Etat }))}
                  style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink)" }}
                >
                  {ETATS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>
              Commentaire
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Notes optionnelles (état général du colis, conditions de transport…)"
              style={{ width: "100%", fontSize: 13, padding: 8, borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink)" }}
            />
          </div>

          {error && (
            <div style={{ marginTop: 12, color: "var(--rose)", fontSize: 12.5 }}>
              {error}
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <div className="left">
            <button className="obtn ghost" onClick={onClose} type="button">Annuler</button>
          </div>
          <div className="right">
            <button
              className="obtn accent"
              type="button"
              disabled={submitDisabled}
              onClick={handleSubmit}
            >
              {submitting ? "Envoi…" : "Confirmer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
