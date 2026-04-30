import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMaquetteSchema,
  updateMaquetteSchema,
  type CreateMaquetteInput,
  type UpdateMaquetteInput,
  type Maquette,
} from "@ogade/shared";
import { api } from "@/lib/api";
import { useReferentiel, useSites, useEntreprises } from "@/hooks/use-referentiels";

type Agent = { id: number; nom: string; prenom: string; email: string };

function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const paths: Record<string, string> = {
    x:     "M5 5l10 10M15 5L5 15",
    check: "M4 10l4 4 8-8",
    plus:  "M10 4v12M4 10h12",
  };
  const d = paths[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const STEPS = ["Identité", "Géométrie", "Localisation", "Vie & patrimoine", "Revue"];

const REQUIRED_PER_STEP: Record<number, string[]> = {
  0: ["reference", "libelle"],
  1: [],
  2: [],
  3: [],
  4: [],
};

export default function MaquetteFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [triedAdvance, setTriedAdvance] = useState<Set<number>>(new Set());
  const [mutationError, setMutationError] = useState<Error | null>(null);

  const { data: typesMq } = useReferentiel("TYPE_MAQUETTE");
  const { data: categories } = useReferentiel("CATEGORIE");
  const { data: composants } = useReferentiel("COMPOSANT");
  const { data: formes } = useReferentiel("FORME");
  const { data: matieres } = useReferentiel("MATIERE");
  const { data: typesAssemblage } = useReferentiel("TYPE_ASSEMBLAGE");
  const { data: typesControle } = useReferentiel("TYPE_CONTROLE");
  const { data: procedures } = useReferentiel("PROCEDURE");
  const { data: poles } = useReferentiel("POLE_ENTITE");
  const { data: pays } = useReferentiel("PAYS");
  const { data: sites } = useSites();
  const { data: entreprises } = useEntreprises();
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["agents", "all"],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: Agent[] }>("/agents", { pageSize: 100 });
        return res.data ?? [];
      } catch {
        return [] as Agent[];
      }
    },
  });

  const { data: existing, isLoading: loadingExisting } = useQuery<Maquette>({
    queryKey: ["maquettes", id],
    queryFn: () => api.get(`/maquettes/${id}`),
    enabled: isEdit,
  });

  const schema = isEdit ? updateMaquetteSchema : createMaquetteSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      reference: "",
      libelle: "",
      referenceASN: false,
      horsPatrimoine: false,
      informationsCertifiees: false,
      enTransit: false,
      produitsChimiques: false,
      adressePays: "FR",
    },
  });
  void errors;

  useEffect(() => {
    if (!isEdit || !existing) return;
    reset({
      reference: existing.reference,
      libelle: existing.libelle,
      typeMaquette: existing.typeMaquette ?? "",
      categorie: existing.categorie ?? "",
      composant: existing.composant ?? "",
      forme: existing.forme ?? "",
      matiere: existing.matiere ?? "",
      typeAssemblage: existing.typeAssemblage ?? "",
      typeControle: existing.typeControle ?? "",
      procedures: existing.procedures ?? "",
      numeroFIEC: existing.numeroFIEC ?? "",
      referenceUnique: existing.referenceUnique ?? undefined,
      description: existing.description ?? "",
      vieMaquette: existing.vieMaquette ?? "",
      historiqueTexte: existing.historiqueTexte ?? "",
      descriptionDefauts: existing.descriptionDefauts ?? "",
      complementsLocalisation: existing.complementsLocalisation ?? "",
      lienECM: existing.lienECM ?? "",
      lienECMRFF: existing.lienECMRFF ?? "",
      lienPhotos: existing.lienPhotos ?? "",
      pieces: existing.pieces ?? "",
      commentaires: existing.commentaires ?? "",
      amortissement: existing.amortissement ?? "",
      site: existing.site ?? "",
      localisation: existing.localisation ?? "",
      localisationSalle: existing.localisationSalle ?? "",
      localisationRayonnage: existing.localisationRayonnage ?? "",
      adresseNumVoie: existing.adresseNumVoie ?? "",
      adresseNomVoie: existing.adresseNomVoie ?? "",
      adresseCodePostal: existing.adresseCodePostal ?? "",
      adresseVille: existing.adresseVille ?? "",
      adressePays: existing.adressePays ?? "FR",
      adresseSite: existing.adresseSite ?? "",
      poleEntite: existing.poleEntite ?? "",
      entreprise: existing.entreprise ?? "",
      emprunteurEntreprise: existing.emprunteurEntreprise ?? "",
      referentId: existing.referentId ?? undefined,
      longueur: existing.longueur ?? undefined,
      largeur: existing.largeur ?? undefined,
      hauteur: existing.hauteur ?? undefined,
      dn: existing.dn ?? undefined,
      epaisseurParoi: existing.epaisseurParoi ?? undefined,
      poids: existing.poids ?? undefined,
      quantite: existing.quantite ?? undefined,
      colisageLongueur: existing.colisageLongueur ?? undefined,
      colisageLargeur: existing.colisageLargeur ?? undefined,
      colisageHauteur: existing.colisageHauteur ?? undefined,
      colisagePoids: existing.colisagePoids ?? undefined,
      colisageDescription: existing.colisageDescription ?? "",
      valeurFinanciere: existing.valeurFinanciere ?? undefined,
      dureeVie: existing.dureeVie ?? undefined,
      referenceASN: !!existing.referenceASN,
      horsPatrimoine: !!existing.horsPatrimoine,
      informationsCertifiees: !!existing.informationsCertifiees,
      enTransit: !!existing.enTransit,
      produitsChimiques: !!existing.produitsChimiques,
    });
  }, [existing, isEdit, reset]);

  const stepHasErrors = (s: number): boolean => {
    const required = REQUIRED_PER_STEP[s] ?? [];
    return required.some((k) => !watch(k as any));
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateMaquetteInput) =>
      api.post<Maquette>("/maquettes", payload),
    onSuccess: (m) => {
      queryClient.invalidateQueries({ queryKey: ["maquettes"] });
      queryClient.invalidateQueries({ queryKey: ["maquettes-stats"] });
      navigate(`/maquettes/${m.id}`);
    },
    onError: (e: Error) => setMutationError(e),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateMaquetteInput) =>
      api.patch<Maquette>(`/maquettes/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maquettes"] });
      queryClient.invalidateQueries({ queryKey: ["maquettes", id] });
      navigate(`/maquettes/${id}`);
    },
    onError: (e: Error) => setMutationError(e),
  });

  const onSubmit = (data: any) => {
    setMutationError(null);
    const numericKeys = [
      "longueur", "largeur", "hauteur", "dn", "epaisseurParoi", "poids",
      "quantite", "valeurFinanciere", "dureeVie", "referenceUnique",
      "colisageLongueur", "colisageLargeur", "colisageHauteur", "colisagePoids",
      "referentId",
    ];
    numericKeys.forEach((k) => {
      const v = data[k];
      data[k] = v === "" || v === null || v === undefined || Number.isNaN(Number(v))
        ? undefined
        : Number(v);
    });
    // Drop empty strings (Zod treats them as values for optional strings — fine — but cleaner)
    Object.keys(data).forEach((k) => {
      if (data[k] === "") data[k] = undefined;
    });
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const tryAdvance = () => {
    if (stepHasErrors(step)) {
      setTriedAdvance((s) => new Set(s).add(step));
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="modal-backdrop">
        <div className="modal" style={{ maxWidth: 480 }}>
          <div className="modal-body" style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Field helpers ──
  const isErr = (name: string, required?: boolean) =>
    triedAdvance.has(step) && required && !watch(name);

  const RefSelect = ({ name, options, label, required }: {
    name: string;
    options: Array<{ code: string; label: string }> | undefined;
    label: string;
    required?: boolean;
  }) => (
    <div className="field">
      <label className={`field-label ${isErr(name, required) ? "has-error" : ""}`}>{label}{required ? " *" : ""}</label>
      <select className={`oselect ${isErr(name, required) ? "has-error" : ""}`} {...register(name)}>
        <option value="">— Sélectionner —</option>
        {(options ?? []).map((o) => (
          <option key={o.code} value={o.code}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const NumField = ({ name, label, suffix }: { name: string; label: string; suffix?: string }) => (
    <div className="field">
      <label className="field-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          step="any"
          className="oinput"
          {...register(name, { valueAsNumber: true })}
          style={suffix ? { paddingRight: 40 } : undefined}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, color: "var(--ink-3)", fontFamily: "'JetBrains Mono', monospace" }}>{suffix}</span>
        )}
      </div>
    </div>
  );

  const TextField = ({ name, label, mono, required }: { name: string; label: string; mono?: boolean; required?: boolean }) => (
    <div className="field">
      <label className={`field-label ${isErr(name, required) ? "has-error" : ""}`}>{label}{required ? " *" : ""}</label>
      <input
        type="text"
        className={`oinput ${mono ? "mono" : ""} ${isErr(name, required) ? "has-error" : ""}`}
        {...register(name)}
      />
      {isErr(name, required) && <p className="field-error">Champ requis</p>}
    </div>
  );

  const TextArea = ({ name, label, rows = 3, full }: { name: string; label: string; rows?: number; full?: boolean }) => (
    <div className={`field ${full ? "full" : ""}`}>
      <label className="field-label">{label}</label>
      <textarea className="otextarea" rows={rows} {...register(name)} />
    </div>
  );

  const Check = ({ name, label }: { name: string; label: string }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>
      <input type="checkbox" {...register(name)} style={{ width: 16, height: 16 }} />
      {label}
    </label>
  );

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) navigate(-1); }}
    >
      <div className="modal" style={{ maxWidth: 880 }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="modal-head">
            <div style={{ flex: 1 }}>
              <h2 className="modal-title">{isEdit ? "Modifier la maquette" : "Nouvelle maquette"}</h2>
              <div className="modal-sub">
                {isEdit ? <>Édition de <span className="mono">{existing?.reference}</span></> : "Saisie d'une nouvelle maquette dans l'inventaire"}
              </div>
            </div>
            <button className="icon-btn" type="button" onClick={() => navigate(-1)} aria-label="Fermer">
              <Icon name="x" size={14} />
            </button>
          </div>

          <div style={{ padding: "14px 22px", background: "var(--bg-panel)", borderBottom: "1px solid var(--line)" }}>
            <div className="wizard-steps">
              {STEPS.map((s, i) => {
                const hasErr = triedAdvance.has(i) && stepHasErrors(i);
                const cls = hasErr ? "has-error" : i < step ? "done" : i === step ? "current" : "";
                return (
                  <div key={i} className={`wizard-step ${cls}`} onClick={() => setStep(i)}>
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

          <div className="modal-body">
            {mutationError && (
              <div style={{ padding: "10px 14px", background: "var(--rose-soft)", border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)", color: "var(--rose)", borderRadius: 8, fontSize: 13 }}>
                {mutationError.message}
              </div>
            )}

            {/* STEP 0 — Identité */}
            {step === 0 && (
              <div className="form-grid">
                <TextField name="reference" label="Référence" mono required />
                <TextField name="libelle" label="Libellé" required />
                <TextField name="numeroFIEC" label="N° de FIEC" mono />
                <NumField name="referenceUnique" label="Référence unique" />
                <RefSelect name="typeMaquette" label="Type de maquette" options={typesMq} />
                <RefSelect name="categorie" label="Catégorie" options={categories} />
                <RefSelect name="composant" label="Composant" options={composants} />
                <TextArea name="description" label="Description" rows={3} full />
              </div>
            )}

            {/* STEP 1 — Géométrie / dimensions */}
            {step === 1 && (
              <div className="form-grid">
                <RefSelect name="forme" label="Forme" options={formes} />
                <RefSelect name="matiere" label="Matière" options={matieres} />
                <RefSelect name="typeAssemblage" label="Type d'assemblage" options={typesAssemblage} />
                <NumField name="longueur" label="Longueur maquette" suffix="mm" />
                <NumField name="largeur" label="Largeur maquette" suffix="mm" />
                <NumField name="hauteur" label="Hauteur maquette" suffix="mm" />
                <NumField name="dn" label="DN maquette" />
                <NumField name="epaisseurParoi" label="Épaisseur paroi" suffix="mm" />
                <NumField name="poids" label="Poids" suffix="kg" />
                <NumField name="quantite" label="Quantité" />
                <TextArea name="pieces" label="Pièces" rows={2} full />
              </div>
            )}

            {/* STEP 2 — Localisation */}
            {step === 2 && (
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Site</label>
                  <select className="oselect" {...register("site")}>
                    <option value="">— Sélectionner —</option>
                    {(sites ?? []).map((s) => (
                      <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <RefSelect name="poleEntite" label="Pôle / Entité" options={poles} />
                <div className="field">
                  <label className="field-label">Entreprise</label>
                  <select className="oselect" {...register("entreprise")}>
                    <option value="">— Sélectionner —</option>
                    {(entreprises ?? []).map((e) => (
                      <option key={e.code} value={e.code}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <TextField name="localisation" label="Localisation" />
                <TextArea name="localisationSalle" label="Salle" rows={2} />
                <TextArea name="localisationRayonnage" label="Rayonnage" rows={2} />
                <TextArea name="complementsLocalisation" label="Compléments localisation" rows={2} full />
                <div className="field full">
                  <label className="field-label" style={{ fontWeight: 600, color: "var(--ink-2)", marginTop: 8 }}>Adresse</label>
                </div>
                <TextField name="adresseNumVoie" label="N° de voie" />
                <TextField name="adresseNomVoie" label="Nom de la voie" />
                <TextField name="adresseCodePostal" label="Code postal" />
                <TextField name="adresseVille" label="Ville" />
                <RefSelect name="adressePays" label="Pays" options={pays} />
                <TextField name="adresseSite" label="Site (libellé)" />
              </div>
            )}

            {/* STEP 3 — Vie & patrimoine */}
            {step === 3 && (
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Référent maquette</label>
                  <select className="oselect" {...register("referentId", { valueAsNumber: true })}>
                    <option value="">— Sélectionner —</option>
                    {(agents ?? []).map((a) => (
                      <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Emprunteur (entreprise)</label>
                  <select className="oselect" {...register("emprunteurEntreprise")}>
                    <option value="">—</option>
                    {(entreprises ?? []).map((e) => (
                      <option key={e.code} value={e.code}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <NumField name="valeurFinanciere" label="Valeur financière" suffix="€" />
                <NumField name="dureeVie" label="Durée de vie" suffix="ans" />
                <RefSelect name="typeControle" label="Type de contrôle" options={typesControle} />
                <RefSelect name="procedures" label="Procédures" options={procedures} />
                <TextField name="lienECM" label="Lien ECM" />
                <TextField name="lienECMRFF" label="Lien ECM RFF" />
                <TextArea name="lienPhotos" label="Liens photos (texte libre)" rows={2} full />
                <TextArea name="vieMaquette" label="Vie de la maquette" rows={3} full />
                <TextArea name="historiqueTexte" label="Historique" rows={3} full />
                <TextArea name="descriptionDefauts" label="Description des défauts" rows={3} full />
                <TextArea name="amortissement" label="Amortissement" rows={2} full />
                <TextArea name="commentaires" label="Commentaires" rows={3} full />
                <div className="field full">
                  <label className="field-label" style={{ fontWeight: 600, color: "var(--ink-2)", marginTop: 8 }}>Colisage</label>
                </div>
                <NumField name="colisageLongueur" label="Longueur colis" suffix="mm" />
                <NumField name="colisageLargeur" label="Largeur colis" suffix="mm" />
                <NumField name="colisageHauteur" label="Hauteur colis" suffix="mm" />
                <NumField name="colisagePoids" label="Poids colis" suffix="kg" />
                <TextArea name="colisageDescription" label="Description du colisage" rows={2} full />
                <div className="field full" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 6 }}>
                  <Check name="referenceASN" label="Référencée ASN" />
                  <Check name="informationsCertifiees" label="Informations certifiées" />
                  <Check name="horsPatrimoine" label="Hors patrimoine" />
                  <Check name="enTransit" label="En transit" />
                  <Check name="produitsChimiques" label="Produits chimiques" />
                </div>
              </div>
            )}

            {/* STEP 4 — Revue */}
            {step === 4 && (
              <ReviewStep
                values={watch()}
                refs={{ typesMq, categories, composants, formes, matieres, typesAssemblage, typesControle, procedures, poles, pays, sites, entreprises, agents }}
              />
            )}
          </div>

          <div className="modal-foot">
            <div>
              {step > 0 && (
                <button type="button" className="obtn" onClick={() => setStep(step - 1)}>
                  ← Précédent
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="obtn ghost" onClick={() => navigate(-1)}>Annuler</button>
              {step < STEPS.length - 1 ? (
                <button type="button" className="obtn accent" onClick={tryAdvance}>Suivant →</button>
              ) : (
                <button type="submit" className="obtn accent" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Icon name="check" size={13} stroke={2.5} />
                  {isEdit ? "Enregistrer" : "Créer la maquette"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Review step ─────────────────────────────────────────────────
function ReviewStep({ values, refs }: { values: any; refs: any }) {
  const refLabel = (
    list: Array<{ code: string; label: string }> | undefined,
    code: string | null | undefined,
  ) => (code ? list?.find((x) => x.code === code)?.label ?? code : "—");
  const agentLabel = (id: number | undefined) => {
    if (!id) return "—";
    const a = (refs.agents as Agent[] | undefined)?.find((x) => x.id === id);
    return a ? `${a.prenom} ${a.nom}` : `#${id}`;
  };
  const yn = (b: boolean | undefined) => (b ? "Oui" : "Non");

  const Section = ({ title, rows }: { title: string; rows: Array<[string, React.ReactNode]> }) => (
    <div className="prop-card" style={{ marginBottom: 12 }}>
      <div className="h">{title}</div>
      <div className="drawer-grid two">
        {rows.map(([k, v], i) => (
          <div key={i} className="field">
            <span className="field-label">{k}</span>
            <span className="field-value">{(v as any) ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const v = values;
  return (
    <div>
      <Section title="Identification" rows={[
        ["Référence", v.reference],
        ["Libellé", v.libelle],
        ["N° FIEC", v.numeroFIEC || "—"],
        ["Référence unique", v.referenceUnique ?? "—"],
        ["Type", refLabel(refs.typesMq, v.typeMaquette)],
        ["Catégorie", refLabel(refs.categories, v.categorie)],
        ["Composant", refLabel(refs.composants, v.composant)],
        ["Description", v.description || "—"],
      ]} />
      <Section title="Géométrie" rows={[
        ["Forme", refLabel(refs.formes, v.forme)],
        ["Matière", refLabel(refs.matieres, v.matiere)],
        ["Type assemblage", refLabel(refs.typesAssemblage, v.typeAssemblage)],
        ["Longueur", v.longueur ? `${v.longueur} mm` : "—"],
        ["Largeur", v.largeur ? `${v.largeur} mm` : "—"],
        ["Hauteur", v.hauteur ? `${v.hauteur} mm` : "—"],
        ["DN", v.dn ?? "—"],
        ["Épaisseur paroi", v.epaisseurParoi ? `${v.epaisseurParoi} mm` : "—"],
        ["Poids", v.poids ? `${v.poids} kg` : "—"],
        ["Quantité", v.quantite ?? "—"],
      ]} />
      <Section title="Localisation" rows={[
        ["Site", refLabel(refs.sites, v.site)],
        ["Localisation", v.localisation || "—"],
        ["Salle", v.localisationSalle || "—"],
        ["Rayonnage", v.localisationRayonnage || "—"],
        ["Pôle/Entité", refLabel(refs.poles, v.poleEntite)],
        ["Entreprise", refLabel(refs.entreprises, v.entreprise)],
        ["Adresse", [v.adresseNumVoie, v.adresseNomVoie].filter(Boolean).join(" ") || "—"],
        ["Ville", [v.adresseCodePostal, v.adresseVille].filter(Boolean).join(" ") || "—"],
        ["Pays", refLabel(refs.pays, v.adressePays)],
      ]} />
      <Section title="Vie & patrimoine" rows={[
        ["Référent", agentLabel(v.referentId)],
        ["Emprunteur entreprise", refLabel(refs.entreprises, v.emprunteurEntreprise)],
        ["Type de contrôle", refLabel(refs.typesControle, v.typeControle)],
        ["Procédures", refLabel(refs.procedures, v.procedures)],
        ["Valeur financière", v.valeurFinanciere ? `${v.valeurFinanciere} €` : "—"],
        ["Durée de vie", v.dureeVie ? `${v.dureeVie} ans` : "—"],
        ["Référencée ASN", yn(v.referenceASN)],
        ["Informations certifiées", yn(v.informationsCertifiees)],
        ["Hors patrimoine", yn(v.horsPatrimoine)],
        ["En transit", yn(v.enTransit)],
        ["Produits chimiques", yn(v.produitsChimiques)],
      ]} />
      <Section title="Colisage" rows={[
        ["Longueur colis", v.colisageLongueur ? `${v.colisageLongueur} mm` : "—"],
        ["Largeur colis", v.colisageLargeur ? `${v.colisageLargeur} mm` : "—"],
        ["Hauteur colis", v.colisageHauteur ? `${v.colisageHauteur} mm` : "—"],
        ["Poids colis", v.colisagePoids ? `${v.colisagePoids} kg` : "—"],
        ["Description", v.colisageDescription || "—"],
      ]} />
    </div>
  );
}
