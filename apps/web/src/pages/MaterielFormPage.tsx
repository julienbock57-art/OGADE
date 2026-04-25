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

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors";
const selectClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
const errorClass = "text-xs text-red-600 mt-1";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-gray-200 pb-2 mb-4">
      <h2 className="text-base font-semibold text-edf-blue">{title}</h2>
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
      <label className={labelClass}>{label}</label>
      <select {...registration} className={selectClass}>
        <option value="">{placeholder ?? `Sélectionner ${label.toLowerCase()}...`}</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className={errorClass}>{error}</p>}
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
  const { data: sites } = useSites();
  const { data: fournisseurs } = useEntreprises("FOURNISSEUR");
  const { data: entreprises } = useEntreprises("ENTREPRISE");

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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edf-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? "Modifier le matériel" : "Nouveau matériel END"}
        </h1>
      </div>

      {mutationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {mutationError.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Identification" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Référence *</label>
              <input type="text" {...register("reference")} className={inputClass} placeholder="Ex: MAT-2026-001" />
              {errors.reference && <p className={errorClass}>{errors.reference.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Libellé *</label>
              <input type="text" {...register("libelle")} className={inputClass} placeholder="Nom du matériel" />
              {errors.libelle && <p className={errorClass}>{errors.libelle.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Numéro de série</label>
              <input type="text" {...register("numeroSerie")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Modèle</label>
              <input type="text" {...register("modele")} className={inputClass} />
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
        </div>

        {/* Classification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Classification" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <RefSelect
              label="Type END"
              registration={register("typeEND")}
              options={typesEnd ?? []}
            />
            <RefSelect
              label="Type de matériel"
              registration={register("typeMateriel")}
              options={typesMat ?? []}
            />
            <RefSelect
              label="Type de traducteur"
              registration={register("typeTraducteur")}
              options={typesTraducteur ?? []}
            />
            <RefSelect
              label="Groupe"
              registration={register("groupe")}
              options={groupes ?? []}
            />
            <RefSelect
              label="Fournisseur"
              registration={register("fournisseur")}
              options={fournisseurOptions}
            />
            <RefSelect
              label="Entreprise"
              registration={register("entreprise")}
              options={entrepriseOptions}
            />
          </div>
        </div>

        {/* Localisation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Localisation" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <RefSelect
              label="Site"
              registration={register("site")}
              options={siteOptions}
            />
            <div>
              <label className={labelClass}>Localisation</label>
              <input type="text" {...register("localisation")} className={inputClass} placeholder="Bâtiment, salle, rayonnage..." />
            </div>
          </div>
        </div>

        {/* Étalonnage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Étalonnage" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Date dernier étalonnage</label>
              <input type="date" {...register("dateEtalonnage")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date prochain étalonnage</label>
              <input type="date" {...register("dateProchainEtalonnage")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Validité (mois)</label>
              <input type="number" {...register("validiteEtalonnage", { valueAsNumber: true })} className={inputClass} placeholder="12" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" {...register("soumisVerification")} id="soumisVerification" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="soumisVerification" className="text-sm text-gray-700">Soumis à vérification périodique</label>
            </div>
          </div>
        </div>

        {/* Prêt */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Prêt" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("enPret")} id="enPret" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="enPret" className="text-sm text-gray-700">Matériel actuellement en prêt</label>
            </div>
            <RefSelect
              label="Motif du prêt"
              registration={register("motifPret")}
              options={motifsPret ?? []}
            />
            <div>
              <label className={labelClass}>Date de retour prêt</label>
              <input type="date" {...register("dateRetourPret")} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Complétude et vérification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Complétude et vérification" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <RefSelect
              label="Complétude"
              registration={register("completude")}
              options={completudes ?? []}
            />
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" {...register("informationVerifiee")} id="informationVerifiee" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="informationVerifiee" className="text-sm text-gray-700">Information vérifiée</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("produitsChimiques")} id="produitsChimiques" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="produitsChimiques" className="text-sm text-gray-700">Contient des produits chimiques</label>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Description" />
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Description</label>
              <textarea rows={3} {...register("description")} className={inputClass} placeholder="Description détaillée du matériel..." />
            </div>
            <div>
              <label className={labelClass}>Commentaires</label>
              <textarea rows={2} {...register("commentaires")} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-edf-blue text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le matériel"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white text-gray-700 border border-gray-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
