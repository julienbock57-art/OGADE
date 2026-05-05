/**
 * InboxValidationsPage — Vue référent : liste des lignes en attente
 * de validation pour les items dont l'utilisateur courant est responsable
 * (matériel) ou référent (maquette). Permet validation/refus rapides.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type AgentLite = { id: number; nom: string; prenom: string; email: string };

interface InboxLigne {
  id: number;
  statut: string;
  quantite: number;
  materiel?: {
    id: number;
    reference: string;
    libelle: string;
    site?: string | null;
    typeMateriel?: string | null;
  } | null;
  maquette?: {
    id: number;
    reference: string;
    libelle: string;
    site?: string | null;
    typeMaquette?: string | null;
  } | null;
  demande: {
    id: number;
    numero: string;
    type: string;
    typeEnvoi?: string | null;
    destinataire: string;
    motif?: string | null;
    urgence?: string | null;
    dateSouhaitee?: string | Date | null;
    demandeur?: AgentLite | null;
  };
}

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

const urgencePill: Record<string, string> = {
  NORMALE: "pill c-neutral",
  URGENTE: "pill c-amber",
  TRES_URGENTE: "pill c-rose",
};

export default function InboxValidationsPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [refuseFor, setRefuseFor] = useState<number | null>(null);
  const [refuseMotif, setRefuseMotif] = useState("");

  const { data, isLoading, isError } = useQuery<PaginatedResult<InboxLigne>>({
    queryKey: ["demandes-envoi", "inbox"],
    queryFn: () => api.get(`/demandes-envoi/inbox`, { page: 1, pageSize: 100 }),
  });

  const validateMut = useMutation({
    mutationFn: ({ demandeId, ligneId }: { demandeId: number; ligneId: number }) =>
      api.post(`/demandes-envoi/${demandeId}/lignes/${ligneId}/validate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandes-envoi", "inbox"] });
    },
  });

  const refuseMut = useMutation({
    mutationFn: ({
      demandeId,
      ligneId,
      motif,
    }: {
      demandeId: number;
      ligneId: number;
      motif: string;
    }) => api.post(`/demandes-envoi/${demandeId}/lignes/${ligneId}/refuse`, { motif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandes-envoi", "inbox"] });
      setRefuseFor(null);
      setRefuseMotif("");
    },
  });

  const isReferent =
    !!user &&
    (user.roles.includes("ADMIN") ||
      user.roles.includes("REFERENT_MATERIEL") ||
      user.roles.includes("REFERENT_MAQUETTE"));

  if (!isReferent) {
    return (
      <div className="detail-page">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: "0 0 8px" }}>
          Validations
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
          Cette vue est réservée aux référents matériels et maquettes (rôles
          requis : ADMIN, REFERENT_MATERIEL ou REFERENT_MAQUETTE).
        </p>
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 8 }}>
          Connecté(e) en tant que <strong>{user?.email ?? "—"}</strong> · rôles
          détectés : {user?.roles?.length ? user.roles.join(", ") : <em>aucun</em>}
        </p>
        <button
          type="button"
          className="obtn"
          style={{ marginTop: 12 }}
          onClick={() => void refreshUser()}
        >
          Recharger les rôles
        </button>
      </div>
    );
  }

  const lignes = data?.data ?? [];

  return (
    <div className="detail-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>
            Validations en attente
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
            {lignes.length} item{lignes.length > 1 ? "s" : ""} à valider · vous êtes le référent désigné
          </p>
        </div>
      </div>

      {isLoading && (
        <p style={{ color: "var(--ink-3)", fontSize: 13 }}>Chargement…</p>
      )}
      {isError && (
        <p style={{ color: "var(--rose)", fontSize: 13 }}>Erreur lors du chargement.</p>
      )}
      {!isLoading && !isError && lignes.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <p style={{ fontSize: 14 }}>Aucune validation en attente. Tout est à jour.</p>
        </div>
      )}

      <div className="vstack" style={{ gap: 10 }}>
        {lignes.map((ligne) => {
          const item = ligne.materiel ?? ligne.maquette;
          const isMat = !!ligne.materiel;
          const upill = ligne.demande.urgence ? urgencePill[ligne.demande.urgence] ?? "pill c-neutral" : null;
          return (
            <div
              key={ligne.id}
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <span className={`tag ${isMat ? "c-accent" : ""}`} style={{ fontSize: 10 }}>
                  {isMat ? "MATÉRIEL" : "MAQUETTE"}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>
                  {item?.reference ?? "—"}
                </span>
                <span style={{ fontSize: 13, color: "var(--ink-2)", flex: 1, minWidth: 0 }}>
                  {item?.libelle ?? "—"}
                </span>
                {upill && ligne.demande.urgence && (
                  <span className={upill}>
                    <span className="dot" />
                    {ligne.demande.urgence}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap", marginBottom: 10 }}>
                <span>
                  Demande :{" "}
                  <Link
                    to={`/demandes-envoi/${ligne.demande.id}`}
                    style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}
                  >
                    {ligne.demande.numero}
                  </Link>
                </span>
                <span>Destinataire : {ligne.demande.destinataire}</span>
                {ligne.demande.demandeur && (
                  <span>
                    Demandeur : {ligne.demande.demandeur.prenom} {ligne.demande.demandeur.nom}
                  </span>
                )}
                <span>Souhaité : {formatDate(ligne.demande.dateSouhaitee)}</span>
                <span>Qté : {ligne.quantite}</span>
              </div>

              {ligne.demande.motif && (
                <div style={{ marginBottom: 10, fontSize: 12.5, color: "var(--ink-2)" }}>
                  <strong>Motif : </strong>
                  {ligne.demande.motif}
                </div>
              )}

              {refuseFor !== ligne.id && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="obtn accent sm"
                    type="button"
                    disabled={validateMut.isPending}
                    onClick={() =>
                      validateMut.mutate({ demandeId: ligne.demande.id, ligneId: ligne.id })
                    }
                  >
                    Valider
                  </button>
                  <button
                    className="obtn ghost sm"
                    type="button"
                    onClick={() => {
                      setRefuseFor(ligne.id);
                      setRefuseMotif("");
                    }}
                  >
                    Refuser
                  </button>
                </div>
              )}

              {refuseFor === ligne.id && (
                <div style={{ marginTop: 4, padding: 10, background: "var(--bg)", borderRadius: 8, border: "1px solid var(--line-2)" }}>
                  <label style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>
                    Motif du refus (obligatoire)
                  </label>
                  <textarea
                    value={refuseMotif}
                    onChange={(e) => setRefuseMotif(e.target.value)}
                    rows={2}
                    style={{ width: "100%", fontSize: 13, padding: 8, borderRadius: 6, border: "1px solid var(--line-2)", background: "var(--bg-panel)", color: "var(--ink)" }}
                    placeholder="Pourquoi refusez-vous cet item ?"
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                    <button
                      className="obtn ghost sm"
                      type="button"
                      onClick={() => {
                        setRefuseFor(null);
                        setRefuseMotif("");
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      className="obtn accent sm"
                      type="button"
                      disabled={refuseMotif.trim().length < 3 || refuseMut.isPending}
                      onClick={() =>
                        refuseMut.mutate({
                          demandeId: ligne.demande.id,
                          ligneId: ligne.id,
                          motif: refuseMotif.trim(),
                        })
                      }
                    >
                      {refuseMut.isPending ? "Refus…" : "Confirmer le refus"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(validateMut.isError || refuseMut.isError) && (
        <div style={{ marginTop: 10, color: "var(--rose)", fontSize: 12.5 }}>
          {((validateMut.error ?? refuseMut.error) as Error)?.message}
        </div>
      )}
    </div>
  );
}
