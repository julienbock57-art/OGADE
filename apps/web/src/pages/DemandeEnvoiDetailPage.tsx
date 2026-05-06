import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DemandeEnvoi } from "@ogade/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import MagasinierActionModal, {
  type ExpedierPayload,
  type ReceptionPayload,
  type ModalLigne,
} from "@/components/MagasinierActionModal";
import PhotoUploader from "@/components/PhotoUploader";
import DocumentsSection from "@/components/DocumentsSection";

const statutPill: Record<string, { cls: string; label: string }> = {
  BROUILLON:               { cls: "pill c-neutral", label: "Brouillon" },
  SOUMISE:                 { cls: "pill c-sky",     label: "Soumise" },
  VALIDEE_PARTIELLEMENT:   { cls: "pill c-amber",   label: "Validée partiellement" },
  VALIDEE:                 { cls: "pill c-emerald", label: "Validée" },
  REFUSEE:                 { cls: "pill c-rose",    label: "Refusée" },
  PRETE_A_EXPEDIER:        { cls: "pill c-sky",     label: "Prête à expédier" },
  EN_TRANSIT:              { cls: "pill c-amber",   label: "En transit" },
  RECUE:                   { cls: "pill c-emerald", label: "Reçue" },
  LIVREE_TITULAIRE:        { cls: "pill c-emerald", label: "Livrée" },
  EN_COURS:                { cls: "pill c-sky",     label: "En cours" },
  EN_RETOUR:               { cls: "pill c-amber",   label: "En retour" },
  RECUE_RETOUR:            { cls: "pill c-emerald", label: "Reçue retour" },
  CLOTUREE:                { cls: "pill c-violet",  label: "Clôturée" },
  ANNULEE:                 { cls: "pill c-rose",    label: "Annulée" },
};

const ligneStatutPill: Record<string, { cls: string; label: string }> = {
  EN_ATTENTE:    { cls: "pill c-neutral", label: "En attente" },
  VALIDEE:       { cls: "pill c-emerald", label: "Validée" },
  REFUSEE:       { cls: "pill c-rose",    label: "Refusée" },
  EXPEDIEE:      { cls: "pill c-sky",     label: "Expédiée" },
  LIVREE:        { cls: "pill c-emerald", label: "Livrée" },
  EN_RETOUR:     { cls: "pill c-amber",   label: "En retour" },
  RECUE_RETOUR:  { cls: "pill c-emerald", label: "Reçue retour" },
  CLOTUREE:      { cls: "pill c-violet",  label: "Clôturée" },
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

type AgentLite = { id: number; nom: string; prenom: string; email: string };

interface Ligne {
  id: number;
  materielId?: number | null;
  maquetteId?: number | null;
  quantite: number;
  recue: boolean;
  statut: string;
  motifRefus?: string | null;
  valideeLe?: string | Date | null;
  dateReception?: string | Date | null;
  etatDepart?: string | null;
  etatReception?: string | null;
  etatRetour?: string | null;
  validateur?: AgentLite | null;
  materiel?: {
    id: number;
    reference: string;
    libelle: string;
    responsableId?: number | null;
    responsable?: AgentLite | null;
    site?: string | null;
    typeMateriel?: string | null;
  } | null;
  maquette?: {
    id: number;
    reference: string;
    libelle: string;
    referentId?: number | null;
    referent?: AgentLite | null;
    site?: string | null;
    typeMaquette?: string | null;
  } | null;
}

interface DemandeEnvoiDetail extends DemandeEnvoi {
  demandeur?: AgentLite | null;
  magasinierEnvoi?: AgentLite | null;
  magasinierReception?: AgentLite | null;
  magasinierRetour?: AgentLite | null;
  lignes?: Ligne[];
}

function ligneToModalLigne(ligne: Ligne): ModalLigne {
  const item = ligne.materiel ?? ligne.maquette;
  return {
    id: ligne.id,
    reference: item?.reference ?? "—",
    libelle: item?.libelle ?? "",
    kind: ligne.materiel ? "materiel" : "maquette",
  };
}

const etatLabel: Record<string, string> = {
  CORRECT: "Correct",
  LEGER_DEFAUT: "Léger défaut",
  HS: "HS",
};

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

function ligneReferentEmail(ligne: Ligne): string | null {
  return ligne.materiel?.responsable?.email ?? ligne.maquette?.referent?.email ?? null;
}

function ligneReferentName(ligne: Ligne): string {
  const r = ligne.materiel?.responsable ?? ligne.maquette?.referent ?? null;
  return r ? `${r.prenom} ${r.nom}` : "—";
}

export default function DemandeEnvoiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refuseFor, setRefuseFor] = useState<number | null>(null);
  const [refuseMotif, setRefuseMotif] = useState("");
  const [modalMode, setModalMode] = useState<null | "expedier" | "receptionner" | "receptionner-retour">(null);

  const {
    data: demande,
    isLoading,
    isError,
  } = useQuery<DemandeEnvoiDetail>({
    queryKey: ["demandes-envoi", id],
    queryFn: () => api.get(`/demandes-envoi/${id}`),
    enabled: !!id,
  });

  const submitMut = useMutation({
    mutationFn: () => api.post(`/demandes-envoi/${id}/submit`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["demandes-envoi", id] }),
  });

  const validateMut = useMutation({
    mutationFn: (ligneId: number) =>
      api.post(`/demandes-envoi/${id}/lignes/${ligneId}/validate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandes-envoi", id] });
      queryClient.invalidateQueries({ queryKey: ["demandes-envoi", "inbox"] });
    },
  });

  const refuseMut = useMutation({
    mutationFn: ({ ligneId, motif }: { ligneId: number; motif: string }) =>
      api.post(`/demandes-envoi/${id}/lignes/${ligneId}/refuse`, { motif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandes-envoi", id] });
      queryClient.invalidateQueries({ queryKey: ["demandes-envoi", "inbox"] });
      setRefuseFor(null);
      setRefuseMotif("");
    },
  });

  function invalidateMagasinier() {
    queryClient.invalidateQueries({ queryKey: ["demandes-envoi", id] });
    queryClient.invalidateQueries({ queryKey: ["demandes-envoi", "magasinier-inbox"] });
  }

  const prepareMut = useMutation({
    mutationFn: () => api.post(`/demandes-envoi/${id}/preparer-expedition`, {}),
    onSuccess: invalidateMagasinier,
  });
  const expedierMut = useMutation({
    mutationFn: (payload: ExpedierPayload) =>
      api.post(`/demandes-envoi/${id}/expedier`, payload),
    onSuccess: () => { invalidateMagasinier(); setModalMode(null); },
  });
  const receptionnerMut = useMutation({
    mutationFn: (payload: ReceptionPayload) =>
      api.post(`/demandes-envoi/${id}/receptionner`, payload),
    onSuccess: () => { invalidateMagasinier(); setModalMode(null); },
  });
  const prepareRetourMut = useMutation({
    mutationFn: () => api.post(`/demandes-envoi/${id}/preparer-retour`, {}),
    onSuccess: invalidateMagasinier,
  });
  const receptionnerRetourMut = useMutation({
    mutationFn: (payload: ReceptionPayload) =>
      api.post(`/demandes-envoi/${id}/receptionner-retour`, payload),
    onSuccess: () => { invalidateMagasinier(); setModalMode(null); },
  });
  const cloturerMut = useMutation({
    mutationFn: () => api.post(`/demandes-envoi/${id}/cloturer`, {}),
    onSuccess: invalidateMagasinier,
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

  const isAdmin = user?.roles.includes("ADMIN") ?? false;
  const isReferent =
    isAdmin ||
    (user?.roles ?? []).some((r) => r === "REFERENT_MATERIEL" || r === "REFERENT_MAQUETTE");
  const isMagasinier =
    isAdmin ||
    (user?.roles ?? []).some(
      (r) => r === "GESTIONNAIRE_MAGASIN" || r === "REFERENT_LOGISTIQUE",
    );
  const canSubmit =
    demande.statut === "BROUILLON" &&
    !!user &&
    !!demande.demandeur &&
    demande.demandeur.email === user.email &&
    (demande.lignes?.length ?? 0) > 0;
  const validationOpen =
    demande.statut === "SOUMISE" || demande.statut === "VALIDEE_PARTIELLEMENT";

  const lignesEligibles =
    modalMode === "expedier"
      ? (demande.lignes ?? []).filter((l) => l.statut === "VALIDEE").map(ligneToModalLigne)
      : modalMode === "receptionner"
        ? (demande.lignes ?? []).filter((l) => l.statut === "EXPEDIEE").map(ligneToModalLigne)
        : modalMode === "receptionner-retour"
          ? (demande.lignes ?? []).filter((l) => l.statut === "EN_RETOUR").map(ligneToModalLigne)
          : [];

  const canPrepare = isMagasinier && demande.statut === "VALIDEE";
  const canExpedier = isMagasinier && (demande.statut === "PRETE_A_EXPEDIER" || demande.statut === "VALIDEE");
  const canReceptionner = isMagasinier && demande.statut === "EN_TRANSIT";
  const isLoanOrCalibration =
    demande.typeEnvoi === "ETALONNAGE" ||
    demande.typeEnvoi === "PRET_INTERNE" ||
    demande.typeEnvoi === "PRET_EXTERNE";
  const canPrepareReturn =
    isMagasinier && isLoanOrCalibration &&
    (demande.statut === "EN_COURS" || demande.statut === "LIVREE_TITULAIRE");
  const canReceptionnerRetour = isMagasinier && demande.statut === "EN_RETOUR";
  const canCloturer = isMagasinier &&
    (demande.statut === "RECUE" || demande.statut === "RECUE_RETOUR" || demande.statut === "LIVREE_TITULAIRE");

  const showTransport = !!(
    demande.numeroBonTransport ||
    demande.transporteur ||
    demande.dateExpedition
  );
  const photosVisible = demande.statut !== "BROUILLON" && demande.statut !== "SOUMISE";

  function canActOn(ligne: Ligne): boolean {
    if (!validationOpen || ligne.statut !== "EN_ATTENTE") return false;
    if (isAdmin) return true;
    if (!isReferent || !user) return false;
    return ligneReferentEmail(ligne) === user.email;
  }

  return (
    <div className="detail-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
              Demande : {demande.numero}
            </h1>
            <span className={pill.cls}><span className="dot" />{pill.label}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
            {typeLabel[demande.type] ?? demande.type}
            {demande.demandeur && ` · Demandeur : ${demande.demandeur.prenom} ${demande.demandeur.nom}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {canSubmit && (
            <button
              className="obtn accent"
              type="button"
              disabled={submitMut.isPending}
              onClick={() => {
                if (confirm("Soumettre cette demande aux référents pour validation ?")) {
                  submitMut.mutate();
                }
              }}
            >
              {submitMut.isPending ? "Soumission…" : "Soumettre pour validation"}
            </button>
          )}
          {canPrepare && (
            <button
              className="obtn"
              type="button"
              disabled={prepareMut.isPending}
              onClick={() => prepareMut.mutate()}
            >
              {prepareMut.isPending ? "…" : "Prendre en charge"}
            </button>
          )}
          {canExpedier && (
            <button
              className="obtn accent"
              type="button"
              onClick={() => setModalMode("expedier")}
            >
              Expédier
            </button>
          )}
          {canReceptionner && (
            <button
              className="obtn accent"
              type="button"
              onClick={() => setModalMode("receptionner")}
            >
              Réceptionner
            </button>
          )}
          {canPrepareReturn && (
            <button
              className="obtn"
              type="button"
              disabled={prepareRetourMut.isPending}
              onClick={() => {
                if (confirm("Marquer cette demande comme prête au retour ?")) {
                  prepareRetourMut.mutate();
                }
              }}
            >
              {prepareRetourMut.isPending ? "…" : "Préparer le retour"}
            </button>
          )}
          {canReceptionnerRetour && (
            <button
              className="obtn accent"
              type="button"
              onClick={() => setModalMode("receptionner-retour")}
            >
              Réceptionner le retour
            </button>
          )}
          {canCloturer && (
            <button
              className="obtn"
              type="button"
              disabled={cloturerMut.isPending}
              onClick={() => {
                if (confirm("Clôturer définitivement cette demande ?")) {
                  cloturerMut.mutate();
                }
              }}
            >
              {cloturerMut.isPending ? "…" : "Clôturer"}
            </button>
          )}
          <Link to="/demandes-envoi" className="obtn" style={{ textDecoration: "none" }}>
            Retour à la liste
          </Link>
        </div>
      </div>

      {(submitMut.isError ||
        prepareMut.isError ||
        prepareRetourMut.isError ||
        cloturerMut.isError) && (
        <div className="alert" style={{ marginBottom: 12, color: "var(--rose)", fontSize: 12.5 }}>
          {((submitMut.error ?? prepareMut.error ?? prepareRetourMut.error ?? cloturerMut.error) as Error)?.message}
        </div>
      )}

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
          <Field label="Site origine">{demande.siteOrigine ?? "—"}</Field>
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

      {/* Transport (visible dès qu'expédiée) */}
      {showTransport && (
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--line-2)" }}>
            Transport
          </h2>
          <div className="detail-grid-2" style={{ gap: "16px 32px" }}>
            <Field label="Bon de transport">{demande.numeroBonTransport ?? "—"}</Field>
            <Field label="Transporteur">{demande.transporteur ?? "—"}</Field>
            <Field label="Date d'expédition">{formatDate(demande.dateExpedition)}</Field>
            <Field label="Date de retour">{formatDate(demande.dateRetour)}</Field>
            <Field label="Magasinier expédition">
              {demande.magasinierEnvoi ? `${demande.magasinierEnvoi.prenom} ${demande.magasinierEnvoi.nom}` : "—"}
            </Field>
            <Field label="Magasinier réception">
              {demande.magasinierReception ? `${demande.magasinierReception.prenom} ${demande.magasinierReception.nom}` : "—"}
            </Field>
            {demande.commentaireExpedition && (
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Commentaire expédition">
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{demande.commentaireExpedition}</p>
                </Field>
              </div>
            )}
            {demande.commentaireReception && (
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Commentaire réception">
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{demande.commentaireReception}</p>
                </Field>
              </div>
            )}
            {demande.commentaireRetour && (
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Commentaire retour">
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{demande.commentaireRetour}</p>
                </Field>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Colisage (toujours visible si renseigné) */}
      {(demande.poidsColisage || demande.longueurColisage || demande.largeurColisage || demande.hauteurColisage) && (
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--line-2)" }}>
            Colisage
          </h2>
          <div className="detail-grid-2" style={{ gap: "16px 32px" }}>
            <Field label="Poids (kg)">{demande.poidsColisage ?? "—"}</Field>
            <Field label="Longueur (mm)">{demande.longueurColisage ?? "—"}</Field>
            <Field label="Largeur (mm)">{demande.largeurColisage ?? "—"}</Field>
            <Field label="Hauteur (mm)">{demande.hauteurColisage ?? "—"}</Field>
          </div>
        </div>
      )}

      {/* Documents (convention, etc.) — toujours consultable */}
      {id && (
        <DocumentsSection
          demandeId={Number(id)}
          title="Pièces jointes (convention, documents)"
          readOnly={!isMagasinier && !canSubmit}
        />
      )}

      {/* Photos */}
      {photosVisible && id && (
        <PhotoUploader
          demandeId={Number(id)}
          title="Photos"
          readOnly={!isMagasinier}
        />
      )}

      {/* Lignes */}
      {demande.lignes && demande.lignes.length > 0 && (
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--line-2)" }}>
            Éléments ({demande.lignes.length})
          </h2>

          <div className="vstack" style={{ gap: 10 }}>
            {demande.lignes.map((ligne) => {
              const lpill = ligneStatutPill[ligne.statut] ?? { cls: "pill c-neutral", label: ligne.statut };
              const acting = canActOn(ligne);
              const isMat = !!ligne.materiel;
              const item = ligne.materiel ?? ligne.maquette;
              return (
                <div key={ligne.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", background: "var(--bg)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span className={`tag ${isMat ? "c-accent" : ""}`} style={{ fontSize: 10 }}>
                      {isMat ? "MATÉRIEL" : "MAQUETTE"}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>
                      {item?.reference ?? "—"}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--ink-2)", flex: 1, minWidth: 0 }}>
                      {item?.libelle ?? "—"}
                    </span>
                    <span className={lpill.cls}><span className="dot" />{lpill.label}</span>
                  </div>

                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
                    <span>Qté : {ligne.quantite}</span>
                    <span>Référent : {ligneReferentName(ligne)}</span>
                    {ligne.etatDepart && (
                      <span>État départ : {etatLabel[ligne.etatDepart] ?? ligne.etatDepart}</span>
                    )}
                    {ligne.etatReception && (
                      <span>État réception : {etatLabel[ligne.etatReception] ?? ligne.etatReception}</span>
                    )}
                    {ligne.etatRetour && (
                      <span>État retour : {etatLabel[ligne.etatRetour] ?? ligne.etatRetour}</span>
                    )}
                    {ligne.validateur && (
                      <span>
                        {ligne.statut === "REFUSEE" ? "Refusée" : "Validée"} par{" "}
                        {ligne.validateur.prenom} {ligne.validateur.nom}
                        {ligne.valideeLe ? ` le ${formatDate(ligne.valideeLe)}` : ""}
                      </span>
                    )}
                  </div>

                  {ligne.motifRefus && (
                    <div style={{ marginTop: 8, padding: "8px 10px", background: "var(--rose-soft, #fee2e2)", borderRadius: 6, fontSize: 12.5 }}>
                      <strong>Motif du refus : </strong>
                      {ligne.motifRefus}
                    </div>
                  )}

                  {acting && refuseFor !== ligne.id && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        className="obtn accent sm"
                        type="button"
                        disabled={validateMut.isPending}
                        onClick={() => validateMut.mutate(ligne.id)}
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

                  {acting && refuseFor === ligne.id && (
                    <div style={{ marginTop: 10, padding: 10, background: "var(--bg-panel)", borderRadius: 8, border: "1px solid var(--line)" }}>
                      <label style={{ fontSize: 12, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>
                        Motif du refus (obligatoire)
                      </label>
                      <textarea
                        value={refuseMotif}
                        onChange={(e) => setRefuseMotif(e.target.value)}
                        rows={2}
                        style={{ width: "100%", fontSize: 13, padding: 8, borderRadius: 6, border: "1px solid var(--line-2)", background: "var(--bg)", color: "var(--ink)" }}
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
                          onClick={() => refuseMut.mutate({ ligneId: ligne.id, motif: refuseMotif.trim() })}
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
      )}

      {modalMode === "expedier" && (
        <MagasinierActionModal
          mode="expedier"
          title="Expédier la demande"
          lignes={lignesEligibles}
          onClose={() => setModalMode(null)}
          submitting={expedierMut.isPending}
          error={(expedierMut.error as Error | null)?.message ?? null}
          onSubmit={(payload) => expedierMut.mutate(payload)}
        />
      )}
      {modalMode === "receptionner" && (
        <MagasinierActionModal
          mode="receptionner"
          title="Réceptionner la demande"
          lignes={lignesEligibles}
          onClose={() => setModalMode(null)}
          submitting={receptionnerMut.isPending}
          error={(receptionnerMut.error as Error | null)?.message ?? null}
          onSubmit={(payload) => receptionnerMut.mutate(payload)}
        />
      )}
      {modalMode === "receptionner-retour" && (
        <MagasinierActionModal
          mode="receptionner-retour"
          title="Réceptionner le retour"
          lignes={lignesEligibles}
          onClose={() => setModalMode(null)}
          submitting={receptionnerRetourMut.isPending}
          error={(receptionnerRetourMut.error as Error | null)?.message ?? null}
          onSubmit={(payload) => receptionnerRetourMut.mutate(payload)}
        />
      )}
    </div>
  );
}
