/**
 * MagasinierInboxPage — Vue magasinier : demandes actionnables sur les
 * sites pour lesquels l'utilisateur est référencé dans magasinier_sites.
 * Affiche le statut courant et la prochaine action attendue.
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DemandeEnvoi, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const statutPill: Record<string, { cls: string; label: string; nextAction?: string }> = {
  VALIDEE:           { cls: "pill c-emerald", label: "Validée",           nextAction: "À expédier" },
  PRETE_A_EXPEDIER:  { cls: "pill c-sky",     label: "Prête à expédier",  nextAction: "À expédier" },
  EN_TRANSIT:        { cls: "pill c-amber",   label: "En transit",        nextAction: "À réceptionner" },
  RECUE:             { cls: "pill c-emerald", label: "Reçue",             nextAction: "À clôturer" },
  LIVREE_TITULAIRE:  { cls: "pill c-emerald", label: "Livrée",            nextAction: "À clôturer / retour" },
  EN_COURS:          { cls: "pill c-sky",     label: "En cours",          nextAction: "Suivi (étalonnage / prêt)" },
  EN_RETOUR:         { cls: "pill c-amber",   label: "En retour",         nextAction: "Réceptionner le retour" },
  RECUE_RETOUR:      { cls: "pill c-emerald", label: "Reçue retour",      nextAction: "À clôturer" },
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

interface InboxDemande extends DemandeEnvoi {
  demandeur?: { id: number; prenom: string; nom: string; email: string } | null;
  magasinierEnvoi?: { id: number; prenom: string; nom: string } | null;
  _count?: { lignes: number };
}

export default function MagasinierInboxPage() {
  const { user } = useAuth();
  const isMagasinier =
    !!user &&
    (user.roles.includes("ADMIN") ||
      user.roles.includes("GESTIONNAIRE_MAGASIN") ||
      user.roles.includes("REFERENT_LOGISTIQUE"));

  const { data, isLoading, isError } = useQuery<PaginatedResult<InboxDemande>>({
    queryKey: ["demandes-envoi", "magasinier-inbox"],
    queryFn: () => api.get(`/demandes-envoi/magasinier/inbox`, { page: 1, pageSize: 100 }),
    enabled: isMagasinier,
  });

  if (!isMagasinier) {
    return (
      <div className="detail-page">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: "0 0 8px" }}>
          Magasin
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
          Cette vue est réservée aux gestionnaires de magasin et référents logistique.
        </p>
      </div>
    );
  }

  const demandes = data?.data ?? [];

  // Group by next action
  const groups: Record<string, InboxDemande[]> = {};
  for (const d of demandes) {
    const key = statutPill[d.statut]?.nextAction ?? d.statut;
    (groups[key] ??= []).push(d);
  }

  return (
    <div className="detail-page">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>
          Magasin — actions à mener
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
          {demandes.length} demande{demandes.length > 1 ? "s" : ""} en attente sur vos sites
        </p>
      </div>

      {isLoading && <p style={{ color: "var(--ink-3)", fontSize: 13 }}>Chargement…</p>}
      {isError && <p style={{ color: "var(--rose)", fontSize: 13 }}>Erreur lors du chargement.</p>}
      {!isLoading && !isError && demandes.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <p style={{ fontSize: 14 }}>Aucune demande en cours sur vos sites. Tout est à jour.</p>
        </div>
      )}

      {Object.entries(groups).map(([action, items]) => (
        <section key={action} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 12px" }}>
            {action} ({items.length})
          </h2>
          <div className="vstack" style={{ gap: 10 }}>
            {items.map((d) => {
              const pill = statutPill[d.statut] ?? { cls: "pill c-neutral", label: d.statut };
              return (
                <Link
                  key={d.id}
                  to={`/demandes-envoi/${d.id}`}
                  style={{
                    display: "block",
                    background: "var(--bg-panel)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
                      {d.numero}
                    </span>
                    <span className={pill.cls}><span className="dot" />{pill.label}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {typeLabel[d.type] ?? d.type}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {d._count?.lignes ?? 0} ligne{(d._count?.lignes ?? 0) > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
                    <span>{d.siteOrigine ?? "—"} → {d.siteDestinataire ?? d.destinataire}</span>
                    {d.demandeur && (
                      <span>Demandeur : {d.demandeur.prenom} {d.demandeur.nom}</span>
                    )}
                    <span>Souhaité : {formatDate(d.dateSouhaitee)}</span>
                    {d.numeroBonTransport && <span>BL : {d.numeroBonTransport}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
