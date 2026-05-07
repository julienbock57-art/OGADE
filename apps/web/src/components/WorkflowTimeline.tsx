/**
 * WorkflowTimeline — Affiche la chronologie de la demande d'envoi sous
 * forme de timeline verticale (à l'image de la maquette OGADE) :
 *  - étapes "done" (puce verte ✓ + ligne pleine)
 *  - étape "current" (puce pleine couleur accent)
 *  - étapes "future" (puce vide + ligne grise)
 *
 * Les étapes sont calculées dynamiquement en fonction du statut courant,
 * des dates métier (dateSoumission, dateValidation, dateExpedition,
 * dateReception, dateRetour, dateCloture) et du typeEnvoi (cycle aller +
 * retour pour étalonnage / prêt, simple aller pour titulaire/interne).
 */
import { useQuery } from "@tanstack/react-query";
import type { Fichier } from "@ogade/shared";
import { api } from "@/lib/api";
import { downloadFichier, openFichier } from "@/lib/fichiers";

type StepState = "done" | "current" | "future";

interface AgentLite {
  id: number;
  nom: string;
  prenom: string;
}

interface DemandeForTimeline {
  id: number;
  statut: string;
  typeEnvoi?: string | null;
  createdAt: string | Date;
  dateSoumission?: string | Date | null;
  dateValidation?: string | Date | null;
  dateExpedition?: string | Date | null;
  dateReception?: string | Date | null;
  dateRetour?: string | Date | null;
  dateCloture?: string | Date | null;
  demandeur?: AgentLite | null;
  magasinierEnvoi?: AgentLite | null;
  magasinierReception?: AgentLite | null;
  magasinierRetour?: AgentLite | null;
  commentaireExpedition?: string | null;
  commentaireReception?: string | null;
  commentaireRetour?: string | null;
  motifAnnulation?: string | null;
  destinataire?: string;
  siteDestinataire?: string | null;
  lignes?: { id: number; statut: string; validateur?: AgentLite | null; valideeLe?: string | Date | null; motifRefus?: string | null }[];
}

function fmtName(a?: AgentLite | null): string {
  if (!a) return "—";
  return `${(a.nom ?? "").toUpperCase()} ${a.prenom ?? ""}`.trim();
}

function fmtDate(value?: string | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Index linéaire utilisé pour décider quels steps sont "done"
const STATUT_ORDER: Record<string, number> = {
  BROUILLON: 0,
  SOUMISE: 1,
  VALIDEE_PARTIELLEMENT: 2,
  VALIDEE: 3,
  REFUSEE: 99, // terminal négatif
  PRETE_A_EXPEDIER: 4,
  EN_TRANSIT: 5,
  RECUE: 6,
  LIVREE_TITULAIRE: 6,
  EN_COURS: 6,
  EN_RETOUR: 7,
  RECUE_RETOUR: 8,
  CLOTUREE: 9,
  ANNULEE: 99,
};

interface Step {
  key: string;
  label: string;
  state: StepState;
  actor?: string;
  date?: string;
  comment?: string | null;
  detail?: string | null;
  tags?: { label: string; icon?: string; onClick?: () => void }[];
  isError?: boolean; // refus / annulation
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8.5l2.8 2.8 6.2-6.6" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepMarker({ state, isError }: { state: StepState; isError?: boolean }) {
  if (state === "done") {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isError ? "var(--rose, #ef4444)" : "var(--emerald, #10b981)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        {isError ? (
          <span style={{ color: "white", fontWeight: 700, fontSize: 12, lineHeight: 1 }}>×</span>
        ) : (
          <CheckIcon />
        )}
      </div>
    );
  }
  if (state === "current") {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "color-mix(in oklch, var(--accent, #6366f1) 18%, transparent)",
          border: "2px solid var(--accent, #6366f1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent, #6366f1)",
          }}
        />
      </div>
    );
  }
  // future
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "var(--bg-panel)",
        border: "2px solid var(--line, #e5e7eb)",
        flexShrink: 0,
        zIndex: 1,
      }}
    />
  );
}

interface Props {
  demande: DemandeForTimeline;
}

export default function WorkflowTimeline({ demande }: Props) {
  // On charge les fichiers pour construire les tags "Photo colis" et
  // "Bon transport" sur les étapes adéquates.
  const { data: fichiers = [] } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "DEMANDE_ENVOI", demande.id, "all-tl"],
    queryFn: () =>
      api.get<Fichier[]>(`/fichiers/entity/DEMANDE_ENVOI/${demande.id}`),
  });
  const photosColis = fichiers.filter(
    (f) => f.typeFichier === "PHOTO" && f.context?.startsWith("expedition-ligne-"),
  );
  const photosReception = fichiers.filter(
    (f) => f.typeFichier === "PHOTO" && f.context?.startsWith("reception-ligne-"),
  );
  const photosRetour = fichiers.filter(
    (f) => f.typeFichier === "PHOTO" && f.context?.startsWith("retour-ligne-"),
  );
  const bonTransport = fichiers.find(
    (f) => f.typeFichier === "DOCUMENT" && f.context === "bon-transport",
  );

  const isLoan =
    demande.typeEnvoi === "ETALONNAGE" ||
    demande.typeEnvoi === "PRET_INTERNE" ||
    demande.typeEnvoi === "PRET_EXTERNE";
  const isInterne = demande.typeEnvoi === "INTERNE";

  const cur = STATUT_ORDER[demande.statut] ?? 0;
  const isRefused = demande.statut === "REFUSEE" || demande.statut === "ANNULEE";

  function stateFor(idx: number): StepState {
    if (isRefused && idx > 1) return "future";
    if (idx < cur) return "done";
    if (idx === cur) return "current";
    return "future";
  }

  // Agent qui a validé en dernier (parmi les lignes)
  const lastValidator = (demande.lignes ?? [])
    .filter((l) => l.validateur && l.valideeLe)
    .sort(
      (a, b) =>
        new Date(b.valideeLe!).getTime() - new Date(a.valideeLe!).getTime(),
    )[0]?.validateur;
  const firstRefus = (demande.lignes ?? []).find((l) => l.motifRefus);

  const steps: Step[] = [];

  // 1. Brouillon créé (toujours présent)
  steps.push({
    key: "created",
    label: "Brouillon créé",
    state: stateFor(0),
    actor: fmtName(demande.demandeur),
    date: fmtDate(demande.createdAt),
  });

  // 2. Soumise
  steps.push({
    key: "submitted",
    label: "Soumise pour validation",
    state: stateFor(1),
    actor: fmtName(demande.demandeur),
    date: fmtDate(demande.dateSoumission),
  });

  // 3. Validée / Refusée
  if (isRefused && demande.statut === "REFUSEE") {
    steps.push({
      key: "refused",
      label: "Refusée",
      state: "done",
      isError: true,
      actor: fmtName(lastValidator),
      date: fmtDate(demande.dateValidation),
      comment: firstRefus?.motifRefus ?? null,
    });
  } else if (isRefused && demande.statut === "ANNULEE") {
    steps.push({
      key: "annulee",
      label: "Annulée",
      state: "done",
      isError: true,
      date: fmtDate(demande.dateValidation),
      comment: demande.motifAnnulation ?? null,
    });
  } else {
    steps.push({
      key: "validated",
      label: "Validée",
      state: stateFor(3),
      actor: fmtName(lastValidator),
      date: fmtDate(demande.dateValidation),
    });
  }

  if (isRefused) {
    return (
      <Section steps={steps} />
    );
  }

  // 4. Prête à expédier
  steps.push({
    key: "ready",
    label: "Préparée à expédier",
    state: stateFor(4),
    actor: fmtName(demande.magasinierEnvoi),
    date: "",
    tags:
      stateFor(4) === "done"
        ? [
            ...(photosColis.length > 0
              ? [{ label: `Photo colis (${photosColis.length})`, onClick: () => photosColis[0] && openFichier(photosColis[0].id) }]
              : []),
            ...(bonTransport
              ? [{ label: "Bon transport", onClick: () => downloadFichier(bonTransport.id, bonTransport.nomOriginal ?? "bon-transport") }]
              : []),
          ]
        : undefined,
  });

  // 5. En transit
  steps.push({
    key: "transit",
    label: "En transit",
    state: stateFor(5),
    actor: fmtName(demande.magasinierEnvoi),
    date: fmtDate(demande.dateExpedition),
    detail:
      stateFor(5) === "current"
        ? `En attente réception chez ${demande.siteDestinataire ?? demande.destinataire ?? "destinataire"}`
        : null,
    comment: stateFor(5) !== "future" ? demande.commentaireExpedition : null,
  });

  // 6. Reçue / Livrée / En cours
  const recLabel = isInterne
    ? "Réceptionnée"
    : isLoan
      ? "Livrée chez prestataire"
      : "Livrée chez titulaire";
  steps.push({
    key: "received",
    label: recLabel,
    state: stateFor(6),
    actor: fmtName(demande.magasinierReception),
    date: fmtDate(demande.dateReception),
    tags:
      stateFor(6) === "done" && photosReception.length > 0
        ? [{ label: `Photo réception (${photosReception.length})`, onClick: () => photosReception[0] && openFichier(photosReception[0].id) }]
        : undefined,
    comment: stateFor(6) !== "future" ? demande.commentaireReception : null,
  });

  // Cycle retour (seulement si étalonnage / prêts)
  if (isLoan) {
    // 7. En retour
    steps.push({
      key: "return-transit",
      label: "Retour en transit",
      state: stateFor(7),
      actor: fmtName(demande.magasinierRetour),
      date: "",
    });
    // 8. Reçue retour
    steps.push({
      key: "return-received",
      label: "Reçue au retour",
      state: stateFor(8),
      actor: fmtName(demande.magasinierRetour),
      date: fmtDate(demande.dateRetour),
      tags:
        stateFor(8) === "done" && photosRetour.length > 0
          ? [{ label: `Photo retour (${photosRetour.length})`, onClick: () => photosRetour[0] && openFichier(photosRetour[0].id) }]
          : undefined,
      comment: stateFor(8) !== "future" ? demande.commentaireRetour : null,
    });
  }

  // 9. Clôturée
  steps.push({
    key: "closed",
    label: "Clôturée",
    state: stateFor(9),
    date: fmtDate(demande.dateCloture),
  });

  return <Section steps={steps} />;
}

function Section({ steps }: { steps: Step[] }) {
  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <h2
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ink-3)",
          margin: "0 0 18px",
        }}
      >
        Workflow
      </h2>
      <div style={{ position: "relative" }}>
        {steps.map((s, i) => {
          const isLast = i === steps.length - 1;
          const next = steps[i + 1];
          const lineColor =
            s.state === "done" && (!next || next.state !== "future")
              ? "var(--emerald, #10b981)"
              : s.state === "done"
                ? "var(--emerald, #10b981)"
                : "var(--line, #e5e7eb)";
          return (
            <div
              key={s.key}
              style={{
                display: "flex",
                gap: 14,
                paddingBottom: isLast ? 0 : 18,
                position: "relative",
              }}
            >
              {/* Marker + line */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  width: 22,
                }}
              >
                <StepMarker state={s.state} isError={s.isError} />
                {!isLast && (
                  <div
                    style={{
                      flex: 1,
                      width: 2,
                      background: lineColor,
                      marginTop: -1,
                    }}
                  />
                )}
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                    color:
                      s.state === "future"
                        ? "var(--ink-3)"
                        : s.isError
                          ? "var(--rose, #ef4444)"
                          : "var(--ink)",
                  }}
                >
                  {s.label}
                </h4>
                {(s.actor || s.date) && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    {s.actor && s.actor !== "—" ? s.actor : ""}
                    {s.actor && s.date ? " · " : ""}
                    {s.date}
                  </div>
                )}
                {s.detail && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    {s.detail}
                  </div>
                )}
                {s.comment && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "var(--bg-sunken, #f3f4f6)",
                      borderLeft: "3px solid var(--line, #e5e7eb)",
                      borderRadius: 4,
                      fontSize: 12.5,
                      color: "var(--ink-2)",
                      fontStyle: "italic",
                    }}
                  >
                    "{s.comment}"
                  </div>
                )}
                {s.tags && s.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {s.tags.map((t, ti) => (
                      <button
                        key={ti}
                        type="button"
                        onClick={t.onClick}
                        className="obtn ghost sm"
                        style={{ fontSize: 11.5 }}
                      >
                        ◇ {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
