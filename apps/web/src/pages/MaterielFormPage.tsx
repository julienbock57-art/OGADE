import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createMaterielSchema,
  updateMaterielSchema,
  type CreateMaterielInput,
  type UpdateMaterielInput,
  type Materiel,
  type Fichier,
} from "@ogade/shared";
import { api } from "@/lib/api";
import {
  useReferentiel,
  useSites,
  useEntreprises,
} from "@/hooks/use-referentiels";

type Agent = { id: number; nom: string; prenom: string; email: string };
type PendingFile = { file: File; typeFichier: "DOCUMENT" | "PHOTO"; context?: string; preview?: string };

/* ─── Icon component ────────────────────────────────────────────── */
function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const paths: Record<string, string> = {
    x: "M5 5l10 10M15 5L5 15",
    check: "M4 10l4 4 8-8",
    chevR: "M7 5l5 5-5 5",
    chevL: "M13 5l-5 5 5 5",
    alert: "M10 3l7 14H3L10 3z M10 9v4 M10 15v.5",
    photo: "M4 15l4-4 3 3 3-4 4 5H4z M15 7a2 2 0 1 0-4 0 2 2 0 0 0 4 0z M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z",
    upload: "M10 14V6 M6 10l4-4 4 4 M4 16h12",
    clip: "M7 9l5-5 3 3-7 7-3-3a2 2 0 0 1 0-3",
    dl: "M10 3v10m0 0l-4-4m4 4l4-4M4 16h12",
    trash: "M5 6h10 M8 6V4h4v2 M6 6v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6",
  };
  const d = paths[name] ?? "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i === 0 ? p : "M" + p} />
      ))}
    </svg>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────── */
const STEPS = ["Identité", "Localisation", "Étalonnage", "État & PJ", "Revue"];

// Maps etat code → pill color class
const etatColor: Record<string, string> = {
  CORRECT: "c-emerald",
  LEGER_DEFAUT: "c-amber",
  HS: "c-rose",
  PERDU: "c-neutral",
};

// Maps completude code → pill color class
const completudeColor: Record<string, string> = {
  COMPLET: "c-emerald",
  INCOMPLET: "c-amber",
};

function computeEcheance(dateEtalonnage: string | undefined, validite: number | undefined): string {
  if (!dateEtalonnage || !validite || isNaN(validite)) return "—";
  const d = new Date(dateEtalonnage);
  if (isNaN(d.getTime())) return "—";
  d.setMonth(d.getMonth() + validite);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function computeEcheanceISO(dateEtalonnage: string | undefined, validite: number | undefined): string | undefined {
  if (!dateEtalonnage || !validite || isNaN(validite)) return undefined;
  const d = new Date(dateEtalonnage);
  if (isNaN(d.getTime())) return undefined;
  d.setMonth(d.getMonth() + validite);
  return d.toISOString();
}

/* ─── Searchable select (combobox) ──────────────────────────────── */
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { code: string; label: string }[];
  placeholder?: string;
  hasError?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.code === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text"
        className={`oinput ${hasError ? "has-error" : ""}`}
        placeholder={placeholder ?? "Rechercher..."}
        value={open ? query : selected?.label ?? ""}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 10,
            background: "var(--bg-panel)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,.10)",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--ink-3)" }}>
              Aucun résultat
            </div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.code}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.code);
                  setOpen(false);
                  setQuery("");
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  cursor: "default",
                  background: value === o.code ? "var(--accent-soft)" : "transparent",
                }}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Photo thumbnail for edit mode ────────────────────────────── */
function FormPhotoThumb({ fichier, onDelete }: { fichier: Fichier; onDelete: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let revoke: string | null = null;
    api.fetchBlob(`/fichiers/${fichier.id}/download`).then((blob) => {
      const url = URL.createObjectURL(blob);
      revoke = url;
      setSrc(url);
    }).catch(() => { setError(true); });
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [fichier.id]);

  const ctxLabel = fichier.context ?? "Générale";

  return (
    <div style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", background: "var(--bg-sunken)" }}>
      {src ? (
        <img src={src} alt={fichier.nomOriginal ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : error ? (
        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--ink-4)", fontSize: 10 }}>
          <div style={{ textAlign: "center" }}>
            <Icon name="photo" size={18} stroke={1.2} />
            <div style={{ marginTop: 2 }}>Indisponible</div>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
        </div>
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "3px 6px", background: "linear-gradient(transparent, rgba(0,0,0,0.6))", fontSize: 10, color: "white" }}>
        {ctxLabel}
      </div>
      <button type="button" className="icon-btn" style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 4, padding: 2, width: 20, height: 20 }} onClick={onDelete}>
        <Icon name="x" size={10} />
      </button>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
export default function MaterielFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [triedAdvance, setTriedAdvance] = useState<Set<number>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [photoContext, setPhotoContext] = useState("GENERAL");
  const docInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  /* ── Data fetching ─────────────────────────────────────────────── */
  const { data: existing, isLoading: loadingExisting } = useQuery<Materiel>({
    queryKey: ["materiels", id],
    queryFn: () => api.get(`/materiels/${id}`),
    enabled: isEdit,
  });

  const { data: etats } = useReferentiel("ETAT_MATERIEL");
  const { data: typesEnd } = useReferentiel("TYPE_END");
  const { data: typesMat } = useReferentiel("TYPE_MATERIEL");
  const { data: typesTraducteur } = useReferentiel("TYPE_TRADUCTEUR");
  const { data: lotsChaines } = useReferentiel("LOT_CHAINE");
  const { data: groupes } = useReferentiel("GROUPE");
  const { data: completudes } = useReferentiel("COMPLETUDE");
  const { data: motifsPret } = useReferentiel("MOTIF_PRET");
  const { data: sites } = useSites();
  const { data: fournisseurs } = useEntreprises("FOURNISSEUR");
  const { data: entreprises } = useEntreprises("ENTREPRISE");

  const { data: agentsData } = useQuery<{ data: Agent[] }>({
    queryKey: ["agents", { page: 1, pageSize: 100 }],
    queryFn: () => api.get("/agents", { page: 1, pageSize: 100 }),
  });
  const agentOptions = (agentsData?.data ?? []).map((a) => ({
    code: String(a.id),
    label: `${a.prenom} ${a.nom}`,
  }));

  const { data: existingDocs, refetch: refetchDocs } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "MATERIEL", id, "DOCUMENT"],
    queryFn: () => api.get(`/fichiers/entity/MATERIEL/${id}`, { typeFichier: "DOCUMENT" }),
    enabled: isEdit,
  });
  const { data: existingPhotos, refetch: refetchPhotos } = useQuery<Fichier[]>({
    queryKey: ["fichiers", "MATERIEL", id, "PHOTO"],
    queryFn: () => api.get(`/fichiers/entity/MATERIEL/${id}`, { typeFichier: "PHOTO" }),
    enabled: isEdit,
  });

  const siteOptions = (sites ?? []).map((s) => ({
    code: s.code,
    label: `${s.label}${s.ville ? ` — ${s.ville}` : ""}`,
  }));
  const fournisseurOptions = (fournisseurs ?? []).map((e) => ({ code: e.code, label: e.label }));
  const entrepriseOptions = (entreprises ?? []).map((e) => ({ code: e.code, label: e.label }));

  /* ── Form ──────────────────────────────────────────────────────── */
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaterielInput & { etat?: string }>({
    resolver: zodResolver(isEdit ? updateMaterielSchema : createMaterielSchema),
    defaultValues: {
      soumisVerification: true,
      enPret: false,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        reference: existing.reference,
        libelle: existing.libelle,
        typeMateriel: existing.typeMateriel ?? "",
        numeroSerie: existing.numeroSerie ?? undefined,
        localisation: existing.localisation ?? undefined,
        site: existing.site ?? "",
        description: existing.description ?? undefined,
        dateEtalonnage: existing.dateEtalonnage
          ? (typeof existing.dateEtalonnage === "string"
            ? existing.dateEtalonnage.slice(0, 10)
            : new Date(existing.dateEtalonnage).toISOString().slice(0, 10)) as unknown as Date
          : undefined,
        dateProchainEtalonnage: existing.dateProchainEtalonnage
          ? (typeof existing.dateProchainEtalonnage === "string"
            ? existing.dateProchainEtalonnage.slice(0, 10)
            : new Date(existing.dateProchainEtalonnage).toISOString().slice(0, 10)) as unknown as Date
          : undefined,
        etat: existing.etat,
        modele: existing.modele ?? undefined,
        typeTraducteur: existing.typeTraducteur ?? "",
        typeEND: existing.typeEND ?? "",
        groupe: existing.groupe ?? "",
        fournisseur: existing.fournisseur ?? "",
        validiteEtalonnage: existing.validiteEtalonnage ?? undefined,
        soumisVerification: existing.soumisVerification ?? false,
        enPret: existing.enPret ?? false,
        motifPret: existing.motifPret ?? "",
        dateRetourPret: existing.dateRetourPret
          ? (typeof existing.dateRetourPret === "string"
            ? existing.dateRetourPret.slice(0, 10)
            : new Date(existing.dateRetourPret).toISOString().slice(0, 10)) as unknown as Date
          : undefined,
        completude: existing.completude ?? "",
        informationVerifiee: existing.informationVerifiee ?? false,
        produitsChimiques: existing.produitsChimiques ?? false,
        commentaires: existing.commentaires ?? undefined,
        entreprise: existing.entreprise ?? "",
        responsableId: existing.responsableId ?? undefined,
        commentaireEtat: existing.commentaireEtat ?? undefined,
        commentairesCompletude: existing.commentairesCompletude ?? undefined,
        numeroFIEC: existing.numeroFIEC ?? undefined,
        enTransit: existing.enTransit ?? "NON",
        lotChaine: existing.lotChaine ?? "",
        complementsLocalisation: existing.complementsLocalisation ?? undefined,
        proprietaire: existing.proprietaire ?? undefined,
      });
    }
  }, [existing, reset]);

  /* ── Mutations ─────────────────────────────────────────────────── */
  const createMutation = useMutation({
    mutationFn: (data: CreateMaterielInput) => api.post<Materiel>("/materiels", data),
    onSuccess: async (result) => {
      if (pendingFiles.length > 0) {
        await uploadFilesToMateriel(result.id);
        setPendingFiles([]);
      }
      queryClient.invalidateQueries({ queryKey: ["materiels"] });
      navigate(`/materiels/${result.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMaterielInput) => api.patch<Materiel>(`/materiels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiels"] });
      navigate(`/materiels/${id}`);
    },
  });

  const onSubmit = (data: CreateMaterielInput & { etat?: string }) => {
    const computedLibelle =
      data.libelle ||
      `${data.typeMateriel ?? ""} ${data.modele ?? ""}`.trim() ||
      data.reference;
    const echeanceISO = computeEcheanceISO(
      data.dateEtalonnage as unknown as string | undefined,
      data.validiteEtalonnage,
    );
    const cleaned = Object.fromEntries(
      Object.entries({
        ...data,
        libelle: computedLibelle,
        dateProchainEtalonnage: echeanceISO,
      }).filter(
        ([, v]) => v !== "" && v !== undefined,
      ),
    );
    if (isEdit) {
      updateMutation.mutate(cleaned as UpdateMaterielInput);
    } else {
      createMutation.mutate(cleaned as CreateMaterielInput);
    }
  };

  const mutationError = createMutation.error || updateMutation.error;

  /* ── File helpers ─────────────────────────────────────────────── */
  const uploadFilesToMateriel = async (materielId: number) => {
    for (const pf of pendingFiles) {
      const fd = new FormData();
      fd.append("file", pf.file);
      fd.append("entityType", "MATERIEL");
      fd.append("entityId", String(materielId));
      fd.append("typeFichier", pf.typeFichier);
      if (pf.context) fd.append("context", pf.context);
      await api.upload("/fichiers/upload", fd);
    }
  };

  const handleAddPendingFiles = (files: FileList, typeFichier: "DOCUMENT" | "PHOTO", context?: string) => {
    const newPending: PendingFile[] = Array.from(files).map((file) => {
      const pf: PendingFile = { file, typeFichier, context };
      if (typeFichier === "PHOTO" && file.type.startsWith("image/")) {
        pf.preview = URL.createObjectURL(file);
      }
      return pf;
    });
    setPendingFiles((prev) => [...prev, ...newPending]);
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => {
      const pf = prev[idx];
      if (pf.preview) URL.revokeObjectURL(pf.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDirectUpload = async (files: FileList, typeFichier: "DOCUMENT" | "PHOTO", context?: string) => {
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", "MATERIEL");
      fd.append("entityId", String(id));
      fd.append("typeFichier", typeFichier);
      if (context) fd.append("context", context);
      await api.upload("/fichiers/upload", fd);
    }
    if (typeFichier === "DOCUMENT") refetchDocs();
    else refetchPhotos();
  };

  const handleDeleteFile = async (fichierIdToDelete: number, typeFichier: string) => {
    await api.delete(`/fichiers/${fichierIdToDelete}`);
    if (typeFichier === "DOCUMENT") refetchDocs();
    else refetchPhotos();
  };

  /* ── Watched values ─────────────────────────────────────────────── */
  const watchedValues = watch();
  const wRef = watchedValues.reference ?? "";
  const wFiec = watchedValues.numeroFIEC ?? "";
  const wTypeMat = watchedValues.typeMateriel ?? "";
  const wModele = watchedValues.modele ?? "";
  const wTypeEND = watchedValues.typeEND ?? "";
  const wTypeTraducteur = watchedValues.typeTraducteur ?? "";
  const wFournisseur = watchedValues.fournisseur ?? "";
  const wProprietaire = watchedValues.proprietaire ?? "";
  const wLotChaine = watchedValues.lotChaine ?? "";
  const wGroupe = watchedValues.groupe ?? "";
  const wSite = watchedValues.site ?? "";
  const wEntreprise = watchedValues.entreprise ?? "";
  const wResponsableId = watchedValues.responsableId;
  const wSoumis = watchedValues.soumisVerification ?? true;
  const wEnPret = watchedValues.enPret ?? false;
  const wMotifPret = watchedValues.motifPret ?? "";
  const wValidite = watchedValues.validiteEtalonnage;
  const wDateEtalonnage = watchedValues.dateEtalonnage as unknown as string | undefined;
  const wEtat = watchedValues.etat ?? "";
  const wCompletude = watchedValues.completude ?? "";

  const echeanceDisplay = computeEcheance(wDateEtalonnage, wValidite);

  /* ── Validation ─────────────────────────────────────────────────── */
  const stepRequired: Record<number, string[]> = {
    0: ["reference", "typeMateriel", "typeEND"],
    1: ["groupe", "site", "entreprise", "responsableId"],
    3: ["etat", "completude"],
  };

  const stepHasErrors = (s: number): boolean => {
    const required = stepRequired[s] ?? [];
    return required.some((field) => {
      const v = (watchedValues as Record<string, unknown>)[field];
      return v === undefined || v === null || v === "";
    });
  };

  const handleNext = () => {
    if (stepHasErrors(step)) {
      setTriedAdvance((prev) => new Set(prev).add(step));
      return;
    }
    setStep(step + 1);
  };

  const handleFinalSubmit = () => {
    const stepsWithErrors = [0, 1, 3].filter((s) => stepHasErrors(s));
    if (stepsWithErrors.length > 0) {
      setTriedAdvance((prev) => {
        const next = new Set(prev);
        stepsWithErrors.forEach((s) => next.add(s));
        return next;
      });
      setStep(stepsWithErrors[0]);
      return;
    }
    // Bypass zodResolver (we did our own validation) and submit directly
    // with the computed libelle handled by onSubmit.
    onSubmit(watchedValues as CreateMaterielInput & { etat?: string });
  };

  const responsableLabel =
    wResponsableId
      ? agentOptions.find((a) => a.code === String(wResponsableId))?.label ?? String(wResponsableId)
      : "—";

  const etatLabel = (etats?.find((e) => e.code === wEtat)?.label ?? wEtat) || "—";
  const completudeLabel = (completudes?.find((c) => c.code === wCompletude)?.label ?? wCompletude) || "—";
  const motifPretLabel = (motifsPret?.find((m) => m.code === wMotifPret)?.label ?? wMotifPret) || "—";

  /* ── Loading state ─────────────────────────────────────────────── */
  if (isEdit && loadingExisting) {
    return (
      <div className="modal-backdrop">
        <div className="modal" style={{ alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2.5px solid var(--accent-soft)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.7s linear infinite",
            }}
          />
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) navigate(-1);
      }}
    >
      <div className="modal">
        {/* HEAD */}
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <h2 className="modal-title">
              {isEdit ? "Modifier le matériel" : "Ajouter un matériel"}
            </h2>
            <div className="modal-sub">
              {isEdit ? (
                <>
                  Édition de <span className="mono">{existing?.reference}</span>
                </>
              ) : (
                "Saisie d'un nouvel équipement END dans l'inventaire"
              )}
            </div>
          </div>
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Fermer">
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* WIZARD STEPS BAR */}
        <div
          style={{
            padding: "14px 22px",
            background: "var(--bg-panel)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div className="wizard-steps">
            {STEPS.map((s, i) => {
              const hasErr = triedAdvance.has(i) && stepHasErrors(i);
              const cls = hasErr
                ? "has-error"
                : i < step
                  ? "done"
                  : i === step
                    ? "current"
                    : "";
              return (
                <div
                  key={i}
                  className={`wizard-step ${cls}`}
                  onClick={() => setStep(i)}
                >
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

        {/* BODY */}
        <div className="modal-body">
          {/* Error alert */}
          {mutationError && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--rose-soft)",
                border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)",
                color: "var(--rose)",
                borderRadius: 8,
                fontSize: 13,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <svg
                width="15"
                height="15"
                style={{ flexShrink: 0, marginTop: 1 }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {mutationError.message}
            </div>
          )}

          {/* ── STEP 0: Identité ───────────────────────────────────── */}
          {step === 0 && (
            <div className="form-grid">
              {/* ID matériel */}
              <div className="field">
                <label
                  className={`field-label ${triedAdvance.has(0) && !wRef ? "has-error" : ""}`}
                >
                  ID matériel *
                </label>
                <input
                  type="text"
                  {...register("reference")}
                  className={`oinput mono ${triedAdvance.has(0) && !wRef ? "has-error" : ""}`}
                  placeholder="ex. 11740RT"
                />
                {triedAdvance.has(0) && !wRef && (
                  <p className="field-error">Champ requis</p>
                )}
                {errors.reference && (
                  <span style={{ fontSize: 11, color: "var(--rose)", marginTop: 2 }}>
                    {errors.reference.message}
                  </span>
                )}
              </div>

              {/* N° de FIEC */}
              <div className="field">
                <label className="field-label">N° de FIEC</label>
                <input
                  type="text"
                  {...register("numeroFIEC")}
                  className="oinput mono"
                  placeholder="FIEC-12345"
                />
              </div>

              {/* Type de matériel */}
              <div className="field">
                <label
                  className={`field-label ${triedAdvance.has(0) && !wTypeMat ? "has-error" : ""}`}
                >
                  Type de matériel *
                </label>
                <select
                  {...register("typeMateriel")}
                  className={`oselect ${triedAdvance.has(0) && !wTypeMat ? "has-error" : ""}`}
                >
                  <option value="">Sélectionner...</option>
                  {(typesMat ?? []).map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {triedAdvance.has(0) && !wTypeMat && (
                  <p className="field-error">Champ requis</p>
                )}
              </div>

              {/* Modèle */}
              <div className="field">
                <label className="field-label">Modèle</label>
                <input
                  type="text"
                  {...register("modele")}
                  className="oinput"
                  placeholder="ex. DENSITO 301 TX"
                />
              </div>

              {/* Fournisseur */}
              <div className="field">
                <label className="field-label">Fournisseur</label>
                <select {...register("fournisseur")} className="oselect">
                  <option value="">Sélectionner...</option>
                  {fournisseurOptions.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Propriétaire */}
              <div className="field">
                <label className="field-label">Propriétaire</label>
                <input
                  type="text"
                  {...register("proprietaire")}
                  className="oinput"
                  placeholder="Nom du propriétaire"
                />
              </div>

              {/* Type d'END */}
              <div className="field full">
                <label
                  className={`field-label ${triedAdvance.has(0) && !wTypeEND ? "has-error" : ""}`}
                >
                  Type d'END *
                </label>
                <div
                  className={triedAdvance.has(0) && !wTypeEND ? "required-group-error" : ""}
                  style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}
                >
                  {(typesEnd ?? []).map((t) => (
                    <button
                      key={t.code}
                      type="button"
                      className={`tag-btn${wTypeEND === t.code ? " on" : ""}`}
                      onClick={() => setValue("typeEND", wTypeEND === t.code ? "" : t.code)}
                    >
                      {t.code}
                    </button>
                  ))}
                </div>
                {triedAdvance.has(0) && !wTypeEND && (
                  <p className="field-error">Champ requis</p>
                )}
              </div>

              {/* Type traducteur */}
              <div className="field">
                <label className="field-label">Type traducteur</label>
                <select {...register("typeTraducteur")} className="oselect">
                  <option value="">Sélectionner...</option>
                  {(typesTraducteur ?? []).map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lot / chaîne */}
              <div className="field">
                <label className="field-label">Lot / chaîne</label>
                <select {...register("lotChaine")} className="oselect">
                  <option value="">Sélectionner...</option>
                  {(lotsChaines ?? []).map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── STEP 1: Localisation ──────────────────────────────── */}
          {step === 1 && (
            <div className="form-grid">
              {/* Groupe */}
              <div className="field">
                <label
                  className={`field-label ${triedAdvance.has(1) && !wGroupe ? "has-error" : ""}`}
                >
                  Groupe *
                </label>
                <select
                  {...register("groupe")}
                  className={`oselect ${triedAdvance.has(1) && !wGroupe ? "has-error" : ""}`}
                >
                  <option value="">Sélectionner...</option>
                  {(groupes ?? []).map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {triedAdvance.has(1) && !wGroupe && (
                  <p className="field-error">Champ requis</p>
                )}
              </div>

              {/* Site */}
              <div className="field">
                <label
                  className={`field-label ${triedAdvance.has(1) && !wSite ? "has-error" : ""}`}
                >
                  Site *
                </label>
                <select
                  {...register("site")}
                  className={`oselect ${triedAdvance.has(1) && !wSite ? "has-error" : ""}`}
                >
                  <option value="">Sélectionner...</option>
                  {siteOptions.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {triedAdvance.has(1) && !wSite && (
                  <p className="field-error">Champ requis</p>
                )}
              </div>

              {/* Entreprise */}
              <div className="field">
                <label
                  className={`field-label ${triedAdvance.has(1) && !wEntreprise ? "has-error" : ""}`}
                >
                  Entreprise *
                </label>
                <select
                  {...register("entreprise")}
                  className={`oselect ${triedAdvance.has(1) && !wEntreprise ? "has-error" : ""}`}
                >
                  <option value="">Sélectionner...</option>
                  {entrepriseOptions.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {triedAdvance.has(1) && !wEntreprise && (
                  <p className="field-error">Champ requis</p>
                )}
              </div>

              {/* Responsable */}
              <div className="field">
                <label
                  className={`field-label ${triedAdvance.has(1) && !wResponsableId ? "has-error" : ""}`}
                >
                  Responsable matériel (référent) *
                </label>
                <SearchableSelect
                  value={wResponsableId ? String(wResponsableId) : ""}
                  onChange={(v) => setValue("responsableId", v ? Number(v) : undefined)}
                  options={agentOptions}
                  placeholder="Rechercher un agent..."
                  hasError={triedAdvance.has(1) && !wResponsableId}
                />
                <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                  Cet agent recevra les demandes de prêt/envoi pour validation
                </p>
                {triedAdvance.has(1) && !wResponsableId && (
                  <p className="field-error">Champ requis</p>
                )}
              </div>

              {/* Compléments de localisation */}
              <div className="field span2">
                <label className="field-label">Compléments de localisation</label>
                <textarea
                  {...register("complementsLocalisation")}
                  className="otextarea"
                  rows={2}
                  placeholder="ex. armoire B12, étagère 3"
                />
              </div>

              {/* Checkbox: en prêt */}
              <label
                className="hstack full"
                style={{ gap: 10, alignItems: "center", cursor: "default" }}
              >
                <span
                  className={`cbx${wEnPret ? " on" : ""}`}
                  onClick={() => setValue("enPret", !wEnPret)}
                >
                  {wEnPret && <Icon name="check" size={10} stroke={2.8} />}
                </span>
                <span style={{ fontSize: 13 }}>
                  Le matériel est <strong>en prêt</strong>
                </span>
              </label>

              {/* Motif du prêt (conditional) */}
              {wEnPret && (
                <div className="field">
                  <label className="field-label">Motif du prêt</label>
                  <select {...register("motifPret")} className="oselect">
                    <option value="">Sélectionner...</option>
                    {(motifsPret ?? []).map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Étalonnage ────────────────────────────────── */}
          {step === 2 && (
            <div className="form-grid">
              {/* Checkbox: soumis à vérification */}
              <label
                className="hstack full"
                style={{ gap: 10, alignItems: "center", cursor: "default" }}
              >
                <span
                  className={`cbx${wSoumis ? " on" : ""}`}
                  onClick={() => setValue("soumisVerification", !wSoumis)}
                >
                  {wSoumis && <Icon name="check" size={10} stroke={2.8} />}
                </span>
                <span style={{ fontSize: 13 }}>
                  Soumis à <strong>vérification périodique</strong>
                </span>
              </label>

              {wSoumis && (
                <>
                  {/* Date dernier étalonnage */}
                  <div className="field">
                    <label className="field-label">Date dernier étalonnage</label>
                    <input
                      type="date"
                      {...register("dateEtalonnage")}
                      className="oinput"
                    />
                  </div>

                  {/* Validité (mois) */}
                  <div className="field">
                    <label className="field-label">Validité (mois)</label>
                    <input
                      type="number"
                      {...register("validiteEtalonnage", { valueAsNumber: true })}
                      className="oinput"
                      placeholder="12"
                      min={1}
                    />
                  </div>

                  {/* Date d'échéance (calculée) */}
                  <div className="field">
                    <label className="field-label">Date d'échéance (calculée)</label>
                    <input
                      type="text"
                      className="oinput muted"
                      disabled
                      value={echeanceDisplay}
                      readOnly
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 3: État & PJ ─────────────────────────────────── */}
          {step === 3 && (
            <div className="form-grid">
              {/* État du matériel */}
              <div className="field">
                <label
                  className={`field-label ${triedAdvance.has(3) && !wEtat ? "has-error" : ""}`}
                >
                  État du matériel *
                </label>
                <div
                  className={triedAdvance.has(3) && !wEtat ? "required-group-error" : ""}
                  style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}
                >
                  {(etats ?? []).map((e) => {
                    const colorCls = etatColor[e.code] ?? "c-neutral";
                    const isOn = wEtat === e.code;
                    return (
                      <button
                        key={e.code}
                        type="button"
                        className={`pill-btn${isOn ? " on" : ""}`}
                        onClick={() => setValue("etat", isOn ? "" : e.code)}
                      >
                        <span className={`pill ${colorCls}`} style={{ fontSize: 12 }}>
                          <span className="dot" />
                          {e.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {triedAdvance.has(3) && !wEtat && (
                  <p className="field-error">Champ requis</p>
                )}
              </div>

              {/* Complétude */}
              <div className="field">
                <label
                  className={`field-label ${triedAdvance.has(3) && !wCompletude ? "has-error" : ""}`}
                >
                  Complétude *
                </label>
                <div
                  className={triedAdvance.has(3) && !wCompletude ? "required-group-error" : ""}
                  style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}
                >
                  {(completudes ?? []).map((c) => {
                    const colorCls = completudeColor[c.code] ?? "c-neutral";
                    const isOn = wCompletude === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        className={`pill-btn${isOn ? " on" : ""}`}
                        onClick={() => setValue("completude", isOn ? "" : c.code)}
                      >
                        <span className={`pill ${colorCls}`} style={{ fontSize: 12 }}>
                          <span className="dot" />
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {triedAdvance.has(3) && !wCompletude && (
                  <p className="field-error">Champ requis</p>
                )}
              </div>

              {/* Commentaire état */}
              <div className="field full">
                <label className="field-label">Commentaire état</label>
                <textarea
                  {...register("commentaireEtat")}
                  className="otextarea"
                  rows={2}
                  placeholder="Décrire l'état observé, défauts éventuels…"
                />
              </div>

              {/* Commentaires généraux */}
              <div className="field full">
                <label className="field-label">Commentaires généraux</label>
                <textarea
                  {...register("commentaires")}
                  className="otextarea"
                  rows={2}
                />
              </div>

              {/* ── Pièces jointes ─────────────────────────────── */}
              <div className="field full">
                <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="clip" size={13} />
                  Pièces jointes
                </label>
                <input
                  ref={docInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (!e.target.files?.length) return;
                    if (isEdit) handleDirectUpload(e.target.files, "DOCUMENT");
                    else handleAddPendingFiles(e.target.files, "DOCUMENT");
                    e.target.value = "";
                  }}
                />
                <div
                  className="upload-zone"
                  style={{ marginTop: 4 }}
                  onClick={() => docInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length > 0) {
                      if (isEdit) handleDirectUpload(e.dataTransfer.files, "DOCUMENT");
                      else handleAddPendingFiles(e.dataTransfer.files, "DOCUMENT");
                    }
                  }}
                >
                  <Icon name="clip" size={18} />
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    Glisser-déposer ou <span style={{ color: "var(--accent)", fontWeight: 500 }}>parcourir</span>
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, color: "var(--ink-3)" }}>PDF, DOC, XLS… · 20 Mo max</div>
                </div>

                {/* Existing docs (edit mode) */}
                {isEdit && existingDocs && existingDocs.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {existingDocs.map((f) => (
                      <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg-sunken)", borderRadius: 8, fontSize: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 10, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 6px", borderRadius: 4 }}>
                          {(f.nomOriginal ?? "").split(".").pop()?.toUpperCase() ?? "DOC"}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nomOriginal ?? f.blobKey}</span>
                        <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{f.tailleOctets ? `${(f.tailleOctets / 1024).toFixed(0)} Ko` : ""}</span>
                        <button type="button" className="icon-btn" style={{ padding: 3, color: "var(--rose)" }} onClick={() => { if (confirm("Supprimer ce fichier ?")) handleDeleteFile(f.id, "DOCUMENT"); }}>
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending docs (create mode) */}
                {!isEdit && pendingFiles.filter((p) => p.typeFichier === "DOCUMENT").length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {pendingFiles.map((pf, idx) =>
                      pf.typeFichier === "DOCUMENT" ? (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg-sunken)", borderRadius: 8, fontSize: 12 }}>
                          <span style={{ fontWeight: 600, fontSize: 10, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 6px", borderRadius: 4 }}>
                            {pf.file.name.split(".").pop()?.toUpperCase() ?? "DOC"}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pf.file.name}</span>
                          <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{(pf.file.size / 1024).toFixed(0)} Ko</span>
                          <button type="button" className="icon-btn" style={{ padding: 3, color: "var(--rose)" }} onClick={() => removePendingFile(idx)}>
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </div>

              {/* ── Photos ──────────────────────────────────────── */}
              <div className="field full">
                <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="photo" size={13} />
                  Photos
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2, marginBottom: 8 }}>
                  {[
                    { value: "GENERAL", label: "Générale" },
                    { value: "ENVOI", label: "Envoi" },
                    { value: "RECEPTION", label: "Réception" },
                    { value: "PRET", label: "Prêt" },
                    { value: "ETALONNAGE", label: "Étalonnage" },
                    { value: "DEFAUT", label: "Défaut" },
                  ].map((ctx) => (
                    <button
                      key={ctx.value}
                      type="button"
                      className={`tag-btn${photoContext === ctx.value ? " on" : ""}`}
                      onClick={() => setPhotoContext(ctx.value)}
                    >
                      {ctx.label}
                    </button>
                  ))}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (!e.target.files?.length) return;
                    if (isEdit) handleDirectUpload(e.target.files, "PHOTO", photoContext);
                    else handleAddPendingFiles(e.target.files, "PHOTO", photoContext);
                    e.target.value = "";
                  }}
                />
                <div
                  className="upload-zone"
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length > 0) {
                      if (isEdit) handleDirectUpload(e.dataTransfer.files, "PHOTO", photoContext);
                      else handleAddPendingFiles(e.dataTransfer.files, "PHOTO", photoContext);
                    }
                  }}
                >
                  <Icon name="photo" size={18} />
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    Glisser-déposer ou <span style={{ color: "var(--accent)", fontWeight: 500 }}>parcourir</span>
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, color: "var(--ink-3)" }}>JPG, PNG · 20 Mo max</div>
                </div>

                {/* Existing photos (edit mode) — thumbnails */}
                {isEdit && existingPhotos && existingPhotos.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginTop: 10 }}>
                    {existingPhotos.map((p) => (
                      <FormPhotoThumb key={p.id} fichier={p} onDelete={() => { if (confirm("Supprimer cette photo ?")) handleDeleteFile(p.id, "PHOTO"); }} />
                    ))}
                  </div>
                )}

                {/* Pending photos (create mode) — previews */}
                {!isEdit && pendingFiles.filter((p) => p.typeFichier === "PHOTO").length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginTop: 10 }}>
                    {pendingFiles.map((pf, idx) =>
                      pf.typeFichier === "PHOTO" ? (
                        <div key={idx} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", background: "var(--bg-sunken)" }}>
                          {pf.preview && <img src={pf.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "3px 6px", background: "linear-gradient(transparent, rgba(0,0,0,0.6))", fontSize: 10, color: "white" }}>
                            {pf.context ?? "Générale"}
                          </div>
                          <button type="button" className="icon-btn" style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 4, padding: 2, width: 20, height: 20 }} onClick={() => removePendingFile(idx)}>
                            <Icon name="x" size={10} />
                          </button>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: Revue ─────────────────────────────────────── */}
          {step === 4 && (
            <div className="vstack" style={{ gap: 18 }}>
              <div className="drawer-grid">
                <div className="field">
                  <span className="field-label">ID · FIEC</span>
                  <span className="field-value mono">
                    {wRef || "—"} · {wFiec || "—"}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Type · Modèle</span>
                  <span className="field-value">
                    {wTypeMat || "—"} · {wModele || "—"}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Type END · Traducteur</span>
                  <span className="field-value">
                    {wTypeEND ? (
                      <span className="tag mono" style={{ marginRight: 4 }}>
                        {wTypeEND}
                      </span>
                    ) : (
                      "—"
                    )}{" "}
                    {wTypeTraducteur || ""}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Fournisseur</span>
                  <span className="field-value">{wFournisseur || "—"}</span>
                </div>
                <div className="field">
                  <span className="field-label">Propriétaire</span>
                  <span className="field-value">{wProprietaire || "—"}</span>
                </div>
                <div className="field">
                  <span className="field-label">Lot / chaîne</span>
                  <span className="field-value mono">{wLotChaine || "—"}</span>
                </div>
                <div className="field">
                  <span className="field-label">Localisation</span>
                  <span className="field-value">
                    {wGroupe || "—"} / {wSite || "—"}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Entreprise</span>
                  <span className="field-value">{wEntreprise || "—"}</span>
                </div>
                <div className="field">
                  <span className="field-label">Responsable</span>
                  <span className="field-value">{responsableLabel}</span>
                </div>
                <div className="field">
                  <span className="field-label">Validité · Vérif périodique</span>
                  <span className="field-value">
                    {wSoumis ? `${wValidite ?? "—"} mois` : "Non soumis"}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">État · Complétude</span>
                  <span className="field-value">
                    {etatLabel} · {completudeLabel}
                  </span>
                </div>
                <div className="field">
                  <span className="field-label">Prêt · Motif</span>
                  <span className="field-value">
                    {wEnPret ? `Oui · ${motifPretLabel}` : "Non"}
                  </span>
                </div>
              </div>

              {/* Info banner */}
              <div
                style={{
                  background: "var(--accent-soft)",
                  border: "1px solid var(--accent-line)",
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 12.5,
                  color: "var(--accent-ink)",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <Icon name="alert" size={16} />
                <div>
                  À la validation, un QR code de traçabilité sera généré et la fiche sera
                  ajoutée à l'inventaire {wEntreprise || "…"}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOT */}
        <div className="modal-foot">
          <button type="button" className="obtn ghost" onClick={() => navigate(-1)}>
            Annuler
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {step > 0 && (
              <button
                type="button"
                className="obtn"
                onClick={() => setStep(step - 1)}
              >
                <Icon name="chevL" size={13} />
                Précédent
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="obtn accent"
                onClick={handleNext}
              >
                Suivant
                <Icon name="chevR" size={13} />
              </button>
            ) : (
              <button
                type="button"
                className="obtn accent"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
              >
                <Icon name="check" size={13} stroke={2.5} />
                {isSubmitting
                  ? "Enregistrement..."
                  : isEdit
                  ? "Enregistrer"
                  : "Créer le matériel"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
