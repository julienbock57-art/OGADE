import { useEffect } from "react";
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
} from "@ogade/shared";
import { api } from "@/lib/api";
import {
  useReferentiel,
  useSites,
  useEntreprises,
} from "@/hooks/use-referentiels";

type Agent = { id: number; nom: string; prenom: string; email: string };

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500,
  color: "var(--ink-2)", marginBottom: 5,
};
const errorStyle: React.CSSProperties = { fontSize: 11, color: "var(--rose)", marginTop: 4 };

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px" }}>
      <h2 style={{
        fontSize: 11, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "var(--ink-3)",
        margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--line-2)",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function RefSelect({
  label,
  registration,
  options,
  placeholder,
  error,
}: {
  label: string;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
  options: { code: string; label: string }[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select {...registration} className="oselect">
        <option value="">{placeholder ?? `Sélectionner ${label.toLowerCase()}...`}</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

export default function MaterielFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading: loadingExisting } = useQuery<Materiel>({
    queryKey: ["materiels", id],
    queryFn: () => api.get(`/materiels/${id}`),
    enabled: isEdit,
  });

  const { data: etats } = useReferentiel("ETAT_MATERIEL");
  const { data: typesEnd } = useReferentiel("TYPE_END");
  const { data: typesMat } = useReferentiel("TYPE_MATERIEL");
  const { data: typesTraducteur } = useReferentiel("TYPE_TRADUCTEUR");
  const { data: groupes } = useReferentiel("GROUPE");
  const { data: completudes } = useReferentiel("COMPLETUDE");
  const { data: motifsPret } = useReferentiel("MOTIF_PRET");
  const { data: lotsChaines } = useReferentiel("LOT_CHAINE");
  const { data: sites } = useSites();
  const { data: fournisseurs } = useEntreprises("FOURNISSEUR");
  const { data: entreprises } = useEntreprises("ENTREPRISE");

  const { data: agentsData } = useQuery<{ data: Agent[] }>({
    queryKey: ["agents", { page: 1, pageSize: 500 }],
    queryFn: () => api.get("/agents", { page: 1, pageSize: 500 }),
  });
  const agentOptions = (agentsData?.data ?? []).map((a) => ({
    code: String(a.id),
    label: `${a.prenom} ${a.nom}`,
  }));

  const siteOptions = (sites ?? []).map((s) => ({ code: s.code, label: `${s.label}${s.ville ? ` — ${s.ville}` : ""}` }));
  const fournisseurOptions = (fournisseurs ?? []).map((e) => ({ code: e.code, label: e.label }));
  const entrepriseOptions = (entreprises ?? []).map((e) => ({ code: e.code, label: e.label }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaterielInput & { etat?: string }>({
    resolver: zodResolver(isEdit ? updateMaterielSchema : createMaterielSchema),
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
          ? new Date(existing.dateEtalonnage)
          : undefined,
        dateProchainEtalonnage: existing.dateProchainEtalonnage
          ? new Date(existing.dateProchainEtalonnage)
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
          ? new Date(existing.dateRetourPret)
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

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterielInput) =>
      api.post<Materiel>("/materiels", data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["materiels"] });
      navigate(`/materiels/${result.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMaterielInput) =>
      api.patch<Materiel>(`/materiels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiels"] });
      navigate(`/materiels/${id}`);
    },
  });

  const onSubmit = (data: CreateMaterielInput & { etat?: string }) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    );
    if (isEdit) {
      updateMutation.mutate(cleaned as UpdateMaterielInput);
    } else {
      createMutation.mutate(cleaned as CreateMaterielInput);
    }
  };

  const mutationError = createMutation.error || updateMutation.error;

  if (isEdit && loadingExisting) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: "2.5px solid var(--accent-soft)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.7s linear infinite",
        }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ color: "var(--ink-3)", background: "none", border: 0, padding: 4, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            {isEdit ? "Modifier le matériel" : "Nouveau matériel END"}
          </h1>
        </div>
      </div>

      {mutationError && (
        <div style={{
          marginBottom: 20, padding: "12px 16px",
          background: "var(--rose-soft)",
          border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)",
          color: "var(--rose)", borderRadius: 10, fontSize: 13,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <svg width="16" height="16" style={{ flexShrink: 0, marginTop: 1 }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {mutationError.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Identification */}
        <SectionCard title="Identification">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <div>
              <label style={labelStyle}>Référence *</label>
              <input type="text" {...register("reference")} className="oinput" placeholder="Ex: MAT-2026-001" />
              {errors.reference && <p style={errorStyle}>{errors.reference.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Libellé *</label>
              <input type="text" {...register("libelle")} className="oinput" placeholder="Nom du matériel" />
              {errors.libelle && <p style={errorStyle}>{errors.libelle.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Numéro de série</label>
              <input type="text" {...register("numeroSerie")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Modèle</label>
              <input type="text" {...register("modele")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>N° FIEC</label>
              <input type="text" {...register("numeroFIEC")} className="oinput" placeholder="Numéro FIEC" />
            </div>
            <div>
              <label style={labelStyle}>Propriétaire</label>
              <input type="text" {...register("proprietaire")} className="oinput" placeholder="Nom du propriétaire" />
            </div>
            {isEdit && (
              <RefSelect
                label="État"
                registration={register("etat")}
                options={etats ?? []}
                placeholder="Sélectionner l'état..."
              />
            )}
          </div>
        </SectionCard>

        {/* Classification */}
        <SectionCard title="Classification">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 24px" }}>
            <RefSelect label="Type END" registration={register("typeEND")} options={typesEnd ?? []} />
            <RefSelect label="Type de matériel" registration={register("typeMateriel")} options={typesMat ?? []} />
            <RefSelect label="Type de traducteur" registration={register("typeTraducteur")} options={typesTraducteur ?? []} />
            <RefSelect label="Groupe" registration={register("groupe")} options={groupes ?? []} />
            <RefSelect label="Fournisseur" registration={register("fournisseur")} options={fournisseurOptions} />
            <RefSelect label="Entreprise" registration={register("entreprise")} options={entrepriseOptions} />
            <RefSelect label="Lot / Chaîne" registration={register("lotChaine")} options={lotsChaines ?? []} />
            <div>
              <label style={labelStyle}>Responsable</label>
              <select
                {...register("responsableId", { setValueAs: (v: string) => v ? Number(v) : undefined })}
                className="oselect"
              >
                <option value="">Sélectionner un responsable...</option>
                {agentOptions.map((o) => (
                  <option key={o.code} value={o.code}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Localisation */}
        <SectionCard title="Localisation">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <RefSelect label="Site" registration={register("site")} options={siteOptions} />
            <div>
              <label style={labelStyle}>Localisation</label>
              <input type="text" {...register("localisation")} className="oinput" placeholder="Bâtiment, salle, rayonnage..." />
            </div>
            <div>
              <label style={labelStyle}>Compléments localisation</label>
              <input type="text" {...register("complementsLocalisation")} className="oinput" placeholder="Détails supplémentaires" />
            </div>
            <div>
              <label style={labelStyle}>En transit</label>
              <select {...register("enTransit")} className="oselect">
                <option value="NON">Non</option>
                <option value="OUI">Oui</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Étalonnage */}
        <SectionCard title="Étalonnage">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 24px" }}>
            <div>
              <label style={labelStyle}>Date dernier étalonnage</label>
              <input type="date" {...register("dateEtalonnage")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Date prochain étalonnage</label>
              <input type="date" {...register("dateProchainEtalonnage")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Validité (mois)</label>
              <input type="number" {...register("validiteEtalonnage", { valueAsNumber: true })} className="oinput" placeholder="12" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" {...register("soumisVerification")} id="soumisVerification"
                style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
              <label htmlFor="soumisVerification" style={{ fontSize: 13, color: "var(--ink)" }}>Soumis à vérification périodique</label>
            </div>
          </div>
        </SectionCard>

        {/* Prêt */}
        <SectionCard title="Prêt">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" {...register("enPret")} id="enPret"
                style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
              <label htmlFor="enPret" style={{ fontSize: 13, color: "var(--ink)" }}>Matériel actuellement en prêt</label>
            </div>
            <RefSelect label="Motif du prêt" registration={register("motifPret")} options={motifsPret ?? []} />
            <div>
              <label style={labelStyle}>Date de retour prêt</label>
              <input type="date" {...register("dateRetourPret")} className="oinput" />
            </div>
          </div>
        </SectionCard>

        {/* Complétude et vérification */}
        <SectionCard title="Complétude et vérification">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <RefSelect label="Complétude" registration={register("completude")} options={completudes ?? []} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" {...register("informationVerifiee")} id="informationVerifiee"
                style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
              <label htmlFor="informationVerifiee" style={{ fontSize: 13, color: "var(--ink)" }}>Information vérifiée</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" {...register("produitsChimiques")} id="produitsChimiques"
                style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
              <label htmlFor="produitsChimiques" style={{ fontSize: 13, color: "var(--ink)" }}>Contient des produits chimiques</label>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Commentaire complétude</label>
              <textarea rows={2} {...register("commentairesCompletude")} className="otextarea" placeholder="Détails sur la complétude..." />
            </div>
          </div>
        </SectionCard>

        {/* Description & commentaires */}
        <SectionCard title="Description & commentaires">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea rows={3} {...register("description")} className="otextarea" placeholder="Description détaillée du matériel..." />
            </div>
            <div>
              <label style={labelStyle}>Commentaire état</label>
              <textarea rows={2} {...register("commentaireEtat")} className="otextarea" placeholder="Remarques sur l'état du matériel..." />
            </div>
            <div>
              <label style={labelStyle}>Commentaires généraux</label>
              <textarea rows={2} {...register("commentaires")} className="otextarea" />
            </div>
          </div>
        </SectionCard>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button type="submit" disabled={isSubmitting} className="obtn accent">
            {isSubmitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le matériel"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="obtn">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
