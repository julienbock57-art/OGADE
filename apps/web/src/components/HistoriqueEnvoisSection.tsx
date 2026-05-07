/**
 * HistoriqueEnvoisSection — Liste des demandes d'envoi auxquelles ce
 * matériel/maquette a été lié, triées du plus récent au plus ancien.
 * Chaque ligne est cliquable et navigue vers la fiche de la demande.
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const statutPill: Record<string, { cls: string; label: string }> = {
  BROUILLON:               { cls: "pill c-neutral", label: "Brouillon" },
  SOUMISE:                 { cls: "pill c-sky",     label: "Soumise" },
  VALIDEE_PARTIELLEMENT:   { cls: "pill c-amber",   label: "Val. partielle" },
  VALIDEE:                 { cls: "pill c-emerald", label: "Validée" },
  REFUSEE:                 { cls: "pill c-rose",    label: "Refusée" },
  PRETE_A_EXPEDIER:        { cls: "pill c-amber",   label: "Prête à expédier" },
  EN_TRANSIT:              { cls: "pill c-amber",   label: "En transit" },
  RECUE:                   { cls: "pill c-emerald", label: "Reçue" },
  LIVREE_TITULAIRE:        { cls: "pill c-emerald", label: "Livrée" },
  EN_COURS:                { cls: "pill c-sky",     label: "En cours" },
  EN_RETOUR:               { cls: "pill c-amber",   label: "Retour en transit" },
  RECUE_RETOUR:            { cls: "pill c-emerald", label: "Reçue retour" },
  CLOTUREE:                { cls: "pill c-violet",  label: "Clôturée" },
  ANNULEE:                 { cls: "pill c-rose",    label: "Annulée" },
};

const typeEnvoiLabel: Record<string, string> = {
  INTERNE: "Transfert site",
  EXTERNE_TITULAIRE: "Envoi titulaire",
  ETALONNAGE: "Étalonnage",
  PRET_INTERNE: "Prêt interne",
  PRET_EXTERNE: "Prêt externe",
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

interface HistoriqueLigne {
  id: number;
  statut: string;
  etatDepart?: string | null;
  etatReception?: string | null;
  motifRefus?: string | null;
  demande: {
    id: number;
    numero: string;
    type: string;
    typeEnvoi?: string | null;
    statut: string;
    destinataire: string;
    siteOrigine?: string | null;
    siteDestinataire?: string | null;
    dateSouhaitee?: string | Date | null;
    dateEnvoi?: string | Date | null;
    dateReception?: string | Date | null;
    dateRetour?: string | Date | null;
    dateCloture?: string | Date | null;
    createdAt: string | Date;
    demandeur?: { nom: string; prenom: string } | null;
  };
}

interface Props {
  /** "materiel" → endpoint /materiels/:id/historique-envois, idem maquette. */
  kind: "materiel" | "maquette";
  id: number;
}

export default function HistoriqueEnvoisSection({ kind, id }: Props) {
  const path =
    kind === "materiel"
      ? `/materiels/${id}/historique-envois`
      : `/maquettes/${id}/historique-envois`;

  const { data: lignes = [], isLoading, isError } = useQuery<HistoriqueLigne[]>({
    queryKey: [kind, id, "historique-envois"],
    queryFn: () => api.get(path),
    enabled: !!id,
  });

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "20px 24px",
        marginTop: 16,
      }}
    >
      <h2
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ink-3)",
          margin: "0 0 14px",
          paddingBottom: 10,
          borderBottom: "1px solid var(--line-2)",
        }}
      >
        Historique des envois ({lignes.length})
      </h2>

      {isLoading && <p style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Chargement…</p>}
      {isError && <p style={{ fontSize: 12.5, color: "var(--rose)" }}>Erreur lors du chargement.</p>}
      {!isLoading && !isError && lignes.length === 0 && (
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0 }}>
          Aucun envoi pour cet item.
        </p>
      )}

      {lignes.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                {["N°", "Type", "Trajet", "Statut demande", "Demandeur", "Souhaité", "Envoi", "Réception", "Cloturé"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      borderBottom: "1px solid var(--line-2)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const d = l.demande;
                const pill = statutPill[d.statut] ?? { cls: "pill c-neutral", label: d.statut };
                return (
                  <tr
                    key={l.id}
                    style={{ borderBottom: "1px solid var(--line-2)", transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sunken, #f9fafb)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "8px 10px" }}>
                      <Link
                        to={`/demandes-envoi/${d.id}`}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                      >
                        {d.numero}
                      </Link>
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-2)" }}>
                      {d.typeEnvoi ? (typeEnvoiLabel[d.typeEnvoi] ?? d.typeEnvoi) : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-2)", whiteSpace: "nowrap" }}>
                      {d.siteOrigine ?? "—"} → {d.siteDestinataire ?? d.destinataire}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <span className={pill.cls}>
                        <span className="dot" />
                        {pill.label}
                      </span>
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-2)" }}>
                      {d.demandeur ? `${d.demandeur.prenom} ${d.demandeur.nom}` : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-2)" }}>{formatDate(d.dateSouhaitee)}</td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-2)" }}>{formatDate(d.dateEnvoi)}</td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-2)" }}>{formatDate(d.dateReception)}</td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-2)" }}>{formatDate(d.dateCloture)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
