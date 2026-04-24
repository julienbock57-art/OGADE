import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createMaquetteSchema,
  updateMaquetteSchema,
  type CreateMaquetteInput,
  type UpdateMaquetteInput,
  type Maquette,
  EtatMaquette,
} from "@ogade/shared";
import { api } from "@/lib/api";

const etatOptions = [
  { value: EtatMaquette.STOCK, label: "En stock" },
  { value: EtatMaquette.EMPRUNTEE, label: "Empruntée" },
  { value: EtatMaquette.EN_CONTROLE, label: "En contrôle" },
  { value: EtatMaquette.REBUT, label: "Rebut" },
  { value: EtatMaquette.EN_REPARATION, label: "En réparation" },
  { value: EtatMaquette.ENVOYEE, label: "Envoyée" },
];

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
const errorClass = "text-xs text-red-600 mt-1";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-gray-200 pb-2 mb-4">
      <h2 className="text-base font-semibold text-edf-blue">{title}</h2>
    </div>
  );
}

export default function MaquetteFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading: loadingExisting } = useQuery<Maquette>({
    queryKey: ["maquettes", id],
    queryFn: () => api.get(`/maquettes/${id}`),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaquetteInput & { etat?: string }>({
    resolver: zodResolver(isEdit ? updateMaquetteSchema : createMaquetteSchema),
  });

  useEffect(() => {
    if (existing) {
      reset({
        reference: existing.reference,
        libelle: existing.libelle,
        typeMaquette: existing.typeMaquette ?? undefined,
        localisation: existing.localisation ?? undefined,
        site: existing.site ?? undefined,
        description: existing.description ?? undefined,
        maquetteMereId: existing.maquetteMereId ?? undefined,
        etat: existing.etat,
        composant: existing.composant ?? undefined,
        categorie: existing.categorie ?? undefined,
        forme: existing.forme ?? undefined,
        typeAssemblage: existing.typeAssemblage ?? undefined,
        matiere: existing.matiere ?? undefined,
        procedures: existing.procedures ?? undefined,
        typeControle: existing.typeControle ?? undefined,
        referenceASN: existing.referenceASN ?? false,
        horsPatrimoine: existing.horsPatrimoine ?? false,
        informationsCertifiees: existing.informationsCertifiees ?? false,
        enTransit: existing.enTransit ?? false,
        longueur: existing.longueur ?? undefined,
        largeur: existing.largeur ?? undefined,
        hauteur: existing.hauteur ?? undefined,
        dn: existing.dn ?? undefined,
        epaisseurParoi: existing.epaisseurParoi ?? undefined,
        poids: existing.poids ?? undefined,
        quantite: existing.quantite ?? undefined,
        commentaires: existing.commentaires ?? undefined,
        poleEntite: existing.poleEntite ?? undefined,
        entreprise: existing.entreprise ?? undefined,
        valeurFinanciere: existing.valeurFinanciere ?? undefined,
      });
    }
  }, [existing, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateMaquetteInput) =>
      api.post<Maquette>("/maquettes", data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["maquettes"] });
      navigate(`/maquettes/${result.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMaquetteInput) =>
      api.patch<Maquette>(`/maquettes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maquettes"] });
      navigate(`/maquettes/${id}`);
    },
  });

  const onSubmit = (data: CreateMaquetteInput & { etat?: string }) => {
    if (isEdit) {
      updateMutation.mutate(data as UpdateMaquetteInput);
    } else {
      createMutation.mutate(data);
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
          {isEdit ? "Modifier la maquette" : "Nouvelle maquette"}
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
        {/* ─── Identification ────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Identification" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Référence *</label>
              <input type="text" {...register("reference")} className={inputClass} placeholder="Ex: MQ-001" />
              {errors.reference && <p className={errorClass}>{errors.reference.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Libellé *</label>
              <input type="text" {...register("libelle")} className={inputClass} placeholder="Nom de la maquette" />
              {errors.libelle && <p className={errorClass}>{errors.libelle.message}</p>}
            </div>
            <div>
              <label className={labelClass}>ID maquette mère</label>
              <input type="number" {...register("maquetteMereId", { valueAsNumber: true })} className={inputClass} placeholder="Laisser vide si racine" />
            </div>
            <div>
              <label className={labelClass}>Quantité</label>
              <input type="number" {...register("quantite", { valueAsNumber: true })} className={inputClass} min={1} />
            </div>
            {isEdit && (
              <div>
                <label className={labelClass}>État</label>
                <select {...register("etat")} className={inputClass}>
                  {etatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ─── Classification ────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Classification" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Type de maquette</label>
              <input type="text" {...register("typeMaquette")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Composant</label>
              <input type="text" {...register("composant")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Catégorie</label>
              <input type="text" {...register("categorie")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Forme de la maquette</label>
              <input type="text" {...register("forme")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Type d'assemblage</label>
              <input type="text" {...register("typeAssemblage")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Matière</label>
              <input type="text" {...register("matiere")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Procédures</label>
              <input type="text" {...register("procedures")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Type de contrôle</label>
              <input type="text" {...register("typeControle")} className={inputClass} placeholder="UT, RT, ET, PT, MT..." />
            </div>
          </div>
        </div>

        {/* ─── Localisation ──────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Localisation" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Site</label>
              <input type="text" {...register("site")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Localisation</label>
              <input type="text" {...register("localisation")} className={inputClass} placeholder="Bâtiment, salle, rayonnage..." />
            </div>
            <div>
              <label className={labelClass}>Entreprise</label>
              <input type="text" {...register("entreprise")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Pôle / Entité</label>
              <input type="text" {...register("poleEntite")} className={inputClass} />
            </div>
          </div>
        </div>

        {/* ─── Dimensions ────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Dimensions" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Longueur (mm)</label>
              <input type="number" step="0.1" {...register("longueur", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Largeur (mm)</label>
              <input type="number" step="0.1" {...register("largeur", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hauteur (mm)</label>
              <input type="number" step="0.1" {...register("hauteur", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>DN</label>
              <input type="number" step="0.1" {...register("dn", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Épaisseur paroi (mm)</label>
              <input type="number" step="0.1" {...register("epaisseurParoi", { valueAsNumber: true })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Poids (kg)</label>
              <input type="number" step="0.01" {...register("poids", { valueAsNumber: true })} className={inputClass} />
            </div>
          </div>
        </div>

        {/* ─── Flags ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Indicateurs" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("referenceASN")} id="referenceASN" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="referenceASN" className="text-sm text-gray-700">Référencée ASN</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("horsPatrimoine")} id="horsPatrimoine" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="horsPatrimoine" className="text-sm text-gray-700">Hors patrimoine</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("informationsCertifiees")} id="informationsCertifiees" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="informationsCertifiees" className="text-sm text-gray-700">Informations certifiées</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("enTransit")} id="enTransit" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="enTransit" className="text-sm text-gray-700">En transit</label>
            </div>
          </div>
        </div>

        {/* ─── Financier ─────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Informations financières" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Valeur financière (€)</label>
              <input type="number" step="0.01" {...register("valeurFinanciere", { valueAsNumber: true })} className={inputClass} />
            </div>
          </div>
        </div>

        {/* ─── Description ───────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Description" />
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Description</label>
              <textarea rows={3} {...register("description")} className={inputClass} placeholder="Description détaillée de la maquette..." />
            </div>
            <div>
              <label className={labelClass}>Commentaires</label>
              <textarea rows={2} {...register("commentaires")} className={inputClass} />
            </div>
          </div>
        </div>

        {/* ─── Actions ───────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-edf-blue text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer la maquette"}
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
