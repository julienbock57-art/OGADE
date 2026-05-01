import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DemandeEnvoi } from "@ogade/shared";
import { api } from "@/lib/api";

const statutPill: Record<string, { cls: string; label: string }> = {
  BROUILLON:  { cls: "pill c-neutral", label: "Brouillon" },
  ENVOYEE:    { cls: "pill c-sky",     label: "Envoyée" },
  EN_TRANSIT: { cls: "pill c-amber",   label: "En transit" },
  RECUE:      { cls: "pill c-emerald", label: "Reçue" },
  CLOTUREE:   { cls: "pill c-violet",  label: "Clôturée" },
  ANNULEE:    { cls: "pill c-rose",    label: "Annulée" },
};

const typeLabel: Record<string, string> = {
  MATERIEL: "Matériel",
  MAQUETTE: "Maquette",
  MUTUALISEE: "Mutualisée",
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

interface DemandeEnvoiWithLignes extends DemandeEnvoi {
  lignes?: {
    id: number;
    materielId?: number | null;
    maquetteId?: number | null;
    quantite: number;
    recue: boolean;
    dateReception?: string | Date | null;
    materiel?: { reference: string; libelle: string } | null;
    maquette?: { reference: string; libelle: string } | null;
  }[];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </dt>
      <dd style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{children || "—"}</dd>
    </div>
  );
}

export default function DemandeEnvoiDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: demande,
    isLoading,
    isError,
  } = useQuery<DemandeEnvoiWithLignes>({
    queryKey: ["demandes-envoi", id],
    queryFn: () => api.get(`/demandes-envoi/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "32px 0", color: "var(--ink-3)", fontSize: 13 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
        Chargement...
      </div>
    );
  }
  if (isError || !demande) {
    return <p style={{ fontSize: 13, color: "var(--rose)" }}>Erreur lors du chargement de la demande.</p>;
  }

  const pill = statutPill[demande.statut] ?? { cls: "pill c-neutral", label: demande.statut };

  return (
    <div className="detail-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
              Demande : {demande.numero}
            </h1>
            <span className={pill.cls}><span className="dot" />{pill.label}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
            {typeLabel[demande.type] ?? demande.type}
          </p>
        </div>
        <Link
          to="/demandes-envoi"
          className="obtn"
          style={{ textDecoration: "none" }}
        >
          Retour à la liste
        </Link>
      </div>

      {/* Info card */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--line-2)" }}>
          Informations
        </h2>
        <div className="detail-grid-2" style={{ gap: "16px 32px" }}>
          <Field label="Numéro">{demande.numero}</Field>
          <Field label="Type">{typeLabel[demande.type] ?? demande.type}</Field>
          <Field label="Statut">
            <span className={pill.cls}><span className="dot" />{pill.label}</span>
          </Field>
          <Field label="Destinataire">{demande.destinataire}</Field>
          <Field label="Site destinataire">{demande.siteDestinataire ?? "—"}</Field>
          <Field label="Motif">{demande.motif ?? "—"}</Field>
          <Field label="Date souhaitée">{formatDate(demande.dateSouhaitee)}</Field>
          <Field label="Date d'envoi">{formatDate(demande.dateEnvoi)}</Field>
          <Field label="Date de réception">{formatDate(demande.dateReception)}</Field>
          <Field label="Créé le">{formatDate(demande.createdAt)}</Field>
          {demande.commentaire && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Commentaire">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{demande.commentaire}</p>
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* Lignes */}
      {demande.lignes && demande.lignes.length > 0 && (
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--line-2)" }}>
            Éléments ({demande.lignes.length})
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Élément", "Référence", "Libellé", "Quantité", "Reçue"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "8px 12px",
                    fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.04em", color: "var(--ink-3)",
                    borderBottom: "1px solid var(--line)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demande.lignes.map((ligne) => (
                <tr key={ligne.id} style={{ borderBottom: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--ink-2)" }}>
                    {ligne.materiel ? "Matériel" : "Maquette"}
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                    {ligne.materiel?.reference ?? ligne.maquette?.reference ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--ink-2)" }}>
                    {ligne.materiel?.libelle ?? ligne.maquette?.libelle ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>{ligne.quantite}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    {ligne.recue ? (
                      <span className="pill c-emerald"><span className="dot" />Oui</span>
                    ) : (
                      <span style={{ color: "var(--ink-3)", fontSize: 13 }}>Non</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
