/**
 * MagasinierInboxPage — Vue magasinier : demandes actionnables sur les
 * sites pour lesquels l'utilisateur est référencé dans magasinier_sites.
 * Affiche le statut courant, la prochaine action attendue, et toutes les
 * infos utiles pour préparer / expédier (adresse, type, colisage, BL…).
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DemandeEnvoi, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSites } from "@/hooks/use-referentiels";

const statutPill: Record<string, { cls: string; label: string; nextAction: string }> = {
  VALIDEE:           { cls: "pill c-emerald", label: "Validée",           nextAction: "À prendre en charge" },
  PRETE_A_EXPEDIER:  { cls: "pill c-sky",     label: "Prête à expédier",  nextAction: "À expédier" },
  EN_TRANSIT:        { cls: "pill c-amber",   label: "En transit",        nextAction: "À réceptionner" },
  RECUE:             { cls: "pill c-emerald", label: "Reçue",             nextAction: "À clôturer" },
  LIVREE_TITULAIRE:  { cls: "pill c-emerald", label: "Livrée",            nextAction: "À clôturer / retour" },
  EN_COURS:          { cls: "pill c-sky",     label: "En cours",          nextAction: "Suivi (étalonnage / prêt)" },
  EN_RETOUR:         { cls: "pill c-amber",   label: "En retour",         nextAction: "Réceptionner le retour" },
  RECUE_RETOUR:      { cls: "pill c-emerald", label: "Reçue retour",      nextAction: "À clôturer" },
};

const typeDemandeLabel: Record<string, string> = {
  MATERIEL: "Matériel",
  MAQUETTE: "Maquette",
  MUTUALISEE: "Mutualisée",
};

const typeEnvoiLabel: Record<string, string> = {
  INTERNE: "Transfert interne",
  EXTERNE_TITULAIRE: "Société titulaire",
  ETALONNAGE: "Étalonnage",
  PRET_INTERNE: "Prêt interne",
  PRET_EXTERNE: "Prêt externe",
};

const urgenceCls: Record<string, string> = {
  Urgent: "pill c-amber",
  "Tres urgent": "pill c-rose",
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
  const { user, refreshUser } = useAuth();
  const { data: sites } = useSites();

  const [filterStatut, setFilterStatut] = useState<string>("");
  const [filterTypeEnvoi, setFilterTypeEnvoi] = useState<string>("");
  const [filterSite, setFilterSite] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const isMagasinier =
    !!user &&
    (user.roles.includes("ADMIN") ||
      user.roles.includes("GESTIONNAIRE_MAGASIN") ||
      user.roles.includes("REFERENT_LOGISTIQUE"));

  const { data, isLoading, isError, refetch } = useQuery<PaginatedResult<InboxDemande>>({
    queryKey: [
      "demandes-envoi",
      "magasinier-inbox",
      { filterStatut, filterTypeEnvoi, filterSite, search },
    ],
    queryFn: () =>
      api.get(`/demandes-envoi/magasinier/inbox`, {
        page: 1,
        pageSize: 100,
        statut: filterStatut || undefined,
        typeEnvoi: filterTypeEnvoi || undefined,
        site: filterSite || undefined,
        search: search.trim() || undefined,
      }),
    enabled: isMagasinier,
  });

  if (!isMagasinier) {
    return (
      <div className="detail-page">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: "0 0 8px" }}>
          Magasin
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
          Cette vue est réservée aux gestionnaires de magasin et référents
          logistique (rôles requis : ADMIN, GESTIONNAIRE_MAGASIN ou
          REFERENT_LOGISTIQUE).
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

  const demandes = data?.data ?? [];

  // Group by next action
  const groups: Record<string, InboxDemande[]> = {};
  for (const d of demandes) {
    const key = statutPill[d.statut]?.nextAction ?? d.statut;
    (groups[key] ??= []).push(d);
  }

  const hasFilters =
    !!filterStatut || !!filterTypeEnvoi || !!filterSite || !!search.trim();

  return (
    <div className="detail-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>
            Magasin — actions à mener
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
            {demandes.length} demande{demandes.length > 1 ? "s" : ""}
            {hasFilters ? " (filtrées)" : " en attente sur vos sites"}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
          gap: 8,
          alignItems: "end",
        }}
      >
        <div className="field">
          <label className="field-label" style={{ fontSize: 11 }}>Recherche (n°, destinataire, motif, BL…)</label>
          <div className="search-bar">
            <svg width={14} height={14} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
            </svg>
            <input
              type="text"
              placeholder="Tapez pour filtrer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label className="field-label" style={{ fontSize: 11 }}>Statut</label>
          <select className="oselect" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(statutPill).map(([code, { label }]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" style={{ fontSize: 11 }}>Type d'envoi</label>
          <select className="oselect" value={filterTypeEnvoi} onChange={(e) => setFilterTypeEnvoi(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(typeEnvoiLabel).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" style={{ fontSize: 11 }}>Site (origine ou destination)</label>
          <select className="oselect" value={filterSite} onChange={(e) => setFilterSite(e.target.value)}>
            <option value="">Tous</option>
            {(sites ?? []).map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="obtn ghost"
          disabled={!hasFilters}
          onClick={() => {
            setFilterStatut("");
            setFilterTypeEnvoi("");
            setFilterSite("");
            setSearch("");
          }}
        >
          Réinitialiser
        </button>
      </div>

      {isLoading && <p style={{ color: "var(--ink-3)", fontSize: 13 }}>Chargement…</p>}
      {isError && (
        <p style={{ color: "var(--rose)", fontSize: 13 }}>
          Erreur lors du chargement.{" "}
          <button type="button" className="obtn ghost sm" onClick={() => refetch()}>Réessayer</button>
        </p>
      )}
      {!isLoading && !isError && demandes.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <p style={{ fontSize: 14 }}>
            {hasFilters
              ? "Aucune demande ne correspond aux filtres."
              : "Aucune demande en cours sur vos sites. Tout est à jour."}
          </p>
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
              const colisage =
                d.poidsColisage || d.longueurColisage || d.largeurColisage || d.hauteurColisage
                  ? `${d.poidsColisage ?? "—"} kg · ${d.longueurColisage ?? "—"}×${d.largeurColisage ?? "—"}×${d.hauteurColisage ?? "—"} mm`
                  : null;
              const upill = d.urgence && urgenceCls[d.urgence];
              return (
                <Link
                  key={d.id}
                  to={`/demandes-envoi/${d.id}`}
                  style={{
                    display: "block",
                    background: "var(--bg-panel)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {/* Bandeau supérieur */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600 }}>
                      {d.numero}
                    </span>
                    <span className={pill.cls}><span className="dot" />{pill.label}</span>
                    <span className="tag" style={{ fontSize: 10 }}>
                      {typeDemandeLabel[d.type] ?? d.type}
                    </span>
                    {d.typeEnvoi && (
                      <span className="tag c-accent" style={{ fontSize: 10 }}>
                        {typeEnvoiLabel[d.typeEnvoi] ?? d.typeEnvoi}
                      </span>
                    )}
                    {upill && d.urgence && (
                      <span className={upill}><span className="dot" />{d.urgence}</span>
                    )}
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {d._count?.lignes ?? 0} ligne{(d._count?.lignes ?? 0) > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Bloc infos en grille */}
                  <div className="detail-grid-2" style={{ gap: "8px 28px", fontSize: 12.5 }}>
                    <div>
                      <span style={{ color: "var(--ink-3)" }}>Trajet : </span>
                      <strong>{d.siteOrigine ?? "—"} → {d.siteDestinataire ?? d.destinataire}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--ink-3)" }}>Adresse destination : </span>
                      {d.adresseDestination ?? "—"}
                    </div>
                    <div>
                      <span style={{ color: "var(--ink-3)" }}>Demandeur : </span>
                      {d.demandeur ? `${d.demandeur.prenom} ${d.demandeur.nom}` : "—"}
                    </div>
                    <div>
                      <span style={{ color: "var(--ink-3)" }}>Contact : </span>
                      {d.contact ?? "—"}
                      {d.contactTelephone ? ` · ${d.contactTelephone}` : ""}
                    </div>
                    <div>
                      <span style={{ color: "var(--ink-3)" }}>Souhaité : </span>
                      {formatDate(d.dateSouhaitee)}
                    </div>
                    <div>
                      <span style={{ color: "var(--ink-3)" }}>Retour estimé : </span>
                      {formatDate(d.dateRetourEstimee)}
                    </div>
                    {colisage && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ color: "var(--ink-3)" }}>Colisage : </span>
                        {colisage}
                      </div>
                    )}
                    {d.numeroBonTransport && (
                      <div>
                        <span style={{ color: "var(--ink-3)" }}>BL : </span>
                        <code style={{ fontFamily: "var(--font-mono)" }}>{d.numeroBonTransport}</code>
                        {d.transporteur ? ` · ${d.transporteur}` : ""}
                      </div>
                    )}
                    {d.motif && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ color: "var(--ink-3)" }}>Motif : </span>
                        {d.motif}
                      </div>
                    )}
                    {(d.convention || d.souscriptionAssurance || d.produitsChimiques) && (
                      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {d.convention && <span className="tag" style={{ fontSize: 10 }}>Convention</span>}
                        {d.souscriptionAssurance && <span className="tag" style={{ fontSize: 10 }}>Assurance</span>}
                        {d.produitsChimiques && <span className="tag c-amber" style={{ fontSize: 10 }}>Produits chimiques</span>}
                      </div>
                    )}
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
