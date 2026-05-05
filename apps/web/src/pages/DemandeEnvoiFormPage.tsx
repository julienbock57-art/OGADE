import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createDemandeEnvoiSchema,
  TypeEnvoi,
  TypeDemande,
  type CreateDemandeEnvoiInput,
  type DemandeEnvoi,
} from "@ogade/shared";
import { api } from "@/lib/api";
import { usePanier } from "@/lib/panier";
import PanierDrawer from "@/components/PanierDrawer";
import { useEntreprises, useSites } from "@/hooks/use-referentiels";

const ICONS: Record<string, string> = {
  x:     "M5 5l10 10M15 5L5 15",
  check: "M4 10l4 4 8-8",
  cart:  "M3 4h2l2 9h10l2-7H7 M8 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M16 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  plus:  "M10 4v12M4 10h12",
  send:  "M3 10l14-7-7 14-2-7-5-0z",
  alert: "M10 7v4m0 2v.01 M2 16L10 3l8 13H2z",
};
function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const d = ICONS[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const STEPS = ["Items", "Type d'envoi", "Destination", "Détails", "Revue"];

const TYPE_ENVOI_OPTIONS = [
  { code: TypeEnvoi.INTERNE,           label: "Transfert interne (CNPE → CNPE)",         sub: "Réception saisie côté site destinataire" },
  { code: TypeEnvoi.ETALONNAGE,        label: "Envoi en étalonnage",                     sub: "Vers prestataire d'étalonnage métrologique" },
  { code: TypeEnvoi.PRET_INTERNE,      label: "Prêt interne",                             sub: "Entre groupes / pôles EDF" },
  { code: TypeEnvoi.PRET_EXTERNE,      label: "Prêt externe",                             sub: "Vers société tierce — convention requise" },
  { code: TypeEnvoi.EXTERNE_TITULAIRE, label: "Envoi vers société titulaire",             sub: "Pas de réception remote, clôture au retour" },
];

export default function DemandeEnvoiFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const panier = usePanier();
  const [step, setStep] = useState(0);
  const [showPanierDrawer, setShowPanierDrawer] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [triedAdvance, setTriedAdvance] = useState<Set<number>>(new Set());

  const { data: sites } = useSites();
  const { data: entreprises } = useEntreprises();

  // Type de demande dérivé du panier
  const matCount = panier.items.filter((it) => it.kind === "materiel").length;
  const maqCount = panier.items.filter((it) => it.kind === "maquette").length;
  const typeDemande =
    matCount > 0 && maqCount > 0
      ? TypeDemande.MUTUALISEE
      : matCount > 0
        ? TypeDemande.MATERIEL
        : maqCount > 0
          ? TypeDemande.MAQUETTE
          : TypeDemande.MATERIEL;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateDemandeEnvoiInput>({
    resolver: zodResolver(createDemandeEnvoiSchema),
    defaultValues: {
      type: typeDemande,
      typeEnvoi: TypeEnvoi.INTERNE,
      destinataire: "",
      siteDestinataire: "",
      siteOrigine: "",
      motif: "",
      urgence: "Normal",
      lignes: [],
    },
  });
  void errors;

  const wTypeEnvoi = watch("typeEnvoi");
  const wDestinataire = watch("destinataire");
  const wSiteDestinataire = watch("siteDestinataire");

  const stepHasErrors = (s: number): boolean => {
    if (s === 0) return panier.count === 0;
    if (s === 1) return !wTypeEnvoi;
    if (s === 2) {
      if (wTypeEnvoi === TypeEnvoi.INTERNE) return !wSiteDestinataire;
      return !wDestinataire;
    }
    return false;
  };

  const tryAdvance = () => {
    if (stepHasErrors(step)) {
      setTriedAdvance((s) => new Set(s).add(step));
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateDemandeEnvoiInput) =>
      api.post<DemandeEnvoi>("/demandes-envoi", payload),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["demandes-envoi"] });
      panier.clear();
      navigate(`/demandes-envoi/${created.id}`);
    },
    onError: (e: Error) => setSubmitError(e.message ?? "Erreur lors de la création"),
  });

  const onSubmit = (data: CreateDemandeEnvoiInput) => {
    if (panier.count === 0) {
      setSubmitError("Le panier est vide — ajoutez au moins un matériel ou une maquette.");
      setStep(0);
      return;
    }
    setSubmitError(null);
    const payload: CreateDemandeEnvoiInput = {
      ...data,
      type: typeDemande,
      lignes: panier.items.map((it) =>
        it.kind === "materiel"
          ? { materielId: it.id, quantite: 1 }
          : { maquetteId: it.id, quantite: 1 },
      ),
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="detail-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, padding: "16px 0 0" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
            Nouvelle demande d'envoi
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "2px 0 0" }}>
            Préparez votre envoi à partir du panier — multi-sélection matériels + maquettes
          </p>
        </div>
        <button className="obtn ghost" type="button" onClick={() => navigate(-1)}>
          <Icon name="x" size={13} />
          Annuler
        </button>
      </div>

      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Wizard steps */}
          <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--line)" }}>
            <div className="wizard-steps">
              {STEPS.map((s, i) => {
                const hasErr = triedAdvance.has(i) && stepHasErrors(i);
                const cls = hasErr ? "has-error" : i < step ? "done" : i === step ? "current" : "";
                return (
                  <div key={i} className={`wizard-step ${cls}`} onClick={() => i < step && setStep(i)}>
                    <div className="bar" />
                    <div className="wlabel">
                      <span className="num">
                        {hasErr ? "!" : i < step ? <Icon name="check" size={10} stroke={3} /> : i + 1}
                      </span>
                      {s}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            {submitError && (
              <div role="alert" style={{ padding: "10px 14px", background: "var(--rose-soft)", border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)", color: "var(--rose)", borderRadius: 8, fontSize: 13, display: "flex", gap: 8 }}>
                <Icon name="alert" size={15} />
                <div>{submitError}</div>
              </div>
            )}

            {/* STEP 0 — Items (panier) */}
            {step === 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Items à envoyer</h3>
                  <span className="tag" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)", fontWeight: 600 }}>
                    {panier.count} item{panier.count > 1 ? "s" : ""}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button className="obtn accent sm" type="button" onClick={() => setShowPanierDrawer(true)}>
                    <Icon name="plus" size={11} />
                    Ajouter / modifier
                  </button>
                </div>

                {panier.count === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", border: "1.5px dashed var(--line)", borderRadius: 10 }}>
                    <Icon name="cart" size={28} />
                    <p style={{ marginTop: 8, fontSize: 13 }}>Le panier est vide</p>
                    <p style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 0 }}>
                      Cliquez sur « Ajouter / modifier » pour rechercher des matériels et maquettes.
                    </p>
                    {triedAdvance.has(0) && (
                      <p className="field-error" style={{ marginTop: 12 }}>Au moins un item est requis</p>
                    )}
                  </div>
                ) : (
                  <div className="vstack" style={{ gap: 8 }}>
                    {panier.items.map((it) => (
                      <div key={`${it.kind}-${it.id}`} className="mchip">
                        <span className="mchip-id">{it.reference}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="mchip-lbl">
                            {it.kind === "materiel" ? (it.typeMateriel ?? "Matériel") : (it.typeMaquette ?? "Maquette")}
                            {it.libelle ? ` · ${it.libelle}` : ""}
                          </div>
                          <div className="mchip-meta">
                            <span className={`tag ${it.kind === "materiel" ? "c-accent" : ""}`} style={{ fontSize: 10 }}>
                              {it.kind === "materiel" ? "MATÉRIEL" : "MAQUETTE"}
                            </span>
                            {it.site ? ` · ${it.site}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Retirer du panier"
                          onClick={() => panier.remove(it.kind, it.id)}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 1 — Type d'envoi */}
            {step === 1 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>Type d'envoi</h3>
                <div className="vstack" style={{ gap: 8 }}>
                  {TYPE_ENVOI_OPTIONS.map((opt) => (
                    <label key={opt.code} className="mchip" style={{ cursor: "pointer", borderColor: wTypeEnvoi === opt.code ? "var(--accent)" : undefined, background: wTypeEnvoi === opt.code ? "var(--accent-soft)" : undefined }}>
                      <input type="radio" value={opt.code} {...register("typeEnvoi")} style={{ width: 18, height: 18 }} />
                      <div style={{ flex: 1 }}>
                        <div className="mchip-lbl">{opt.label}</div>
                        <div className="mchip-meta">{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — Destination */}
            {step === 2 && (
              <div className="detail-grid-2">
                <div className="field">
                  <label className="field-label">Site origine</label>
                  <select className="oselect" {...register("siteOrigine")}>
                    <option value="">— Sélectionner —</option>
                    {(sites ?? []).map((s) => (
                      <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {wTypeEnvoi === TypeEnvoi.INTERNE || wTypeEnvoi === TypeEnvoi.PRET_INTERNE ? (
                  <div className="field">
                    <label className={`field-label ${triedAdvance.has(2) && !wSiteDestinataire ? "has-error" : ""}`}>
                      Site destinataire <span style={{ color: "var(--rose)" }}>*</span>
                    </label>
                    <select className="oselect" {...register("siteDestinataire")}>
                      <option value="">— Sélectionner —</option>
                      {(sites ?? []).map((s) => (
                        <option key={s.code} value={s.code}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="field">
                    <label className={`field-label ${triedAdvance.has(2) && !wDestinataire ? "has-error" : ""}`}>
                      Destinataire (entreprise) <span style={{ color: "var(--rose)" }}>*</span>
                    </label>
                    <select className="oselect" {...register("destinataire")}>
                      <option value="">— Sélectionner —</option>
                      {(entreprises ?? []).map((e) => (
                        <option key={e.code} value={e.label}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field">
                  <label className="field-label">Adresse destination</label>
                  <input type="text" className="oinput" {...register("adresseDestination")} />
                </div>
                <div className="field">
                  <label className="field-label">Contact (nom)</label>
                  <input type="text" className="oinput" {...register("contact")} />
                </div>
                <div className="field">
                  <label className="field-label">Téléphone</label>
                  <input type="tel" className="oinput" {...register("contactTelephone")} />
                </div>
                <div className="field">
                  <label className="field-label">Date souhaitée</label>
                  <input type="date" className="oinput" {...register("dateSouhaitee")} />
                </div>
                <div className="field">
                  <label className="field-label">Date retour estimée</label>
                  <input type="date" className="oinput" {...register("dateRetourEstimee")} />
                </div>
              </div>
            )}

            {/* STEP 3 — Détails */}
            {step === 3 && (
              <div className="vstack" style={{ gap: 12 }}>
                <div className="field">
                  <label className="field-label">Motif</label>
                  <textarea className="otextarea" rows={3} {...register("motif")} />
                </div>
                <div className="detail-grid-2">
                  <div className="field">
                    <label className="field-label">Urgence</label>
                    <select className="oselect" {...register("urgence")}>
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Tres urgent">Très urgent</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Justification urgence</label>
                    <input type="text" className="oinput" {...register("justificationUrgence")} />
                  </div>
                </div>
                <div className="detail-grid-3">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input type="checkbox" {...register("convention")} style={{ width: 16, height: 16 }} />
                    Convention signée
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input type="checkbox" {...register("souscriptionAssurance")} style={{ width: 16, height: 16 }} />
                    Souscription assurance
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input type="checkbox" {...register("produitsChimiques")} style={{ width: 16, height: 16 }} />
                    Produits chimiques
                  </label>
                </div>
                <div className="field">
                  <label className="field-label">Commentaire</label>
                  <textarea className="otextarea" rows={3} {...register("commentaire")} />
                </div>
              </div>
            )}

            {/* STEP 4 — Revue */}
            {step === 4 && (
              <ReviewStep
                values={watch()}
                items={panier.items}
                typeDemande={typeDemande}
                sites={sites}
                entreprises={entreprises}
              />
            )}
          </div>

          {/* Footer wizard */}
          <div style={{ padding: "14px 22px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div>
              {step > 0 && (
                <button type="button" className="obtn" onClick={() => setStep(step - 1)}>
                  ← Précédent
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {step < STEPS.length - 1 ? (
                <button type="button" className="obtn accent" onClick={tryAdvance}>
                  Suivant →
                </button>
              ) : (
                <button
                  type="submit"
                  className="obtn accent"
                  disabled={createMutation.isPending}
                >
                  <Icon name="send" size={13} />
                  {createMutation.isPending ? "Envoi…" : "Soumettre la demande"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {showPanierDrawer && <PanierDrawer onClose={() => setShowPanierDrawer(false)} />}
    </div>
  );
}

function ReviewStep({
  values, items, typeDemande, sites, entreprises,
}: {
  values: any;
  items: ReturnType<typeof usePanier>["items"];
  typeDemande: string;
  sites?: Array<{ code: string; label: string }>;
  entreprises?: Array<{ code: string; label: string }>;
}) {
  const lookupSite = (code?: string) =>
    code ? sites?.find((s) => s.code === code)?.label ?? code : "—";
  void entreprises;

  const Section = ({ title, rows }: { title: string; rows: Array<[string, React.ReactNode]> }) => (
    <div className="prop-card" style={{ marginBottom: 12 }}>
      <div className="h">{title}</div>
      <div className="detail-grid-2">
        {rows.map(([k, v], i) => (
          <div key={i} className="field">
            <span className="field-label">{k}</span>
            <span className="field-value">{(v as any) ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Section title="Récapitulatif demande" rows={[
        ["Type demande", typeDemande],
        ["Type d'envoi", values.typeEnvoi ?? "—"],
        ["Site origine", lookupSite(values.siteOrigine)],
        ["Site destinataire", lookupSite(values.siteDestinataire)],
        ["Destinataire", values.destinataire || "—"],
        ["Date souhaitée", values.dateSouhaitee || "—"],
        ["Date retour estimée", values.dateRetourEstimee || "—"],
        ["Urgence", values.urgence ?? "—"],
        ["Motif", values.motif || "—"],
      ]} />

      <div className="prop-card">
        <div className="h">{items.length} item{items.length > 1 ? "s" : ""} dans le panier</div>
        <div className="vstack" style={{ gap: 6 }}>
          {items.map((it) => (
            <div key={`${it.kind}-${it.id}`} className="mchip">
              <span className="mchip-id">{it.reference}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mchip-lbl">
                  {it.kind === "materiel" ? (it.typeMateriel ?? "Matériel") : (it.typeMaquette ?? "Maquette")}
                  {it.libelle ? ` · ${it.libelle}` : ""}
                </div>
                <div className="mchip-meta">
                  <span className={`tag ${it.kind === "materiel" ? "c-accent" : ""}`} style={{ fontSize: 10 }}>
                    {it.kind === "materiel" ? "MATÉRIEL" : "MAQUETTE"}
                  </span>
                  {it.site ? ` · ${it.site}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// (Inutile en v1 — le useEffect ajouté plus tard si besoin)
void useEffect;
void useMemo;
