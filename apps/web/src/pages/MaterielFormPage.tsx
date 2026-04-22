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
  EtatMateriel,
} from "@ogade/shared";
import { api } from "@/lib/api";

const etatOptions = [
  { value: EtatMateriel.DISPONIBLE, label: "Disponible" },
  { value: EtatMateriel.EN_SERVICE, label: "En service" },
  { value: EtatMateriel.EN_REPARATION, label: "En réparation" },
  { value: EtatMateriel.REBUT, label: "Rebut" },
  { value: EtatMateriel.PRETE, label: "Prêtée" },
  { value: EtatMateriel.ENVOYEE, label: "Envoyée" },
];

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
        typeMateriel: existing.typeMateriel ?? undefined,
        numeroSerie: existing.numeroSerie ?? undefined,
        localisation: existing.localisation ?? undefined,
        site: existing.site ?? undefined,
        description: existing.description ?? undefined,
        dateEtalonnage: existing.dateEtalonnage
          ? new Date(existing.dateEtalonnage)
          : undefined,
        dateProchainEtalonnage: existing.dateProchainEtalonnage
          ? new Date(existing.dateProchainEtalonnage)
          : undefined,
        etat: existing.etat,
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
    if (isEdit) {
      updateMutation.mutate(data as UpdateMaterielInput);
    } else {
      createMutation.mutate(data);
    }
  };

  const mutationError = createMutation.error || updateMutation.error;

  if (isEdit && loadingExisting) {
    return <p className="text-sm text-gray-500">Chargement...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? "Modifier le matériel" : "Nouveau matériel"}
      </h1>

      {mutationError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {mutationError.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence *
            </label>
            <input
              type="text"
              {...register("reference")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
            {errors.reference && (
              <p className="text-xs text-red-600 mt-1">
                {errors.reference.message}
              </p>
            )}
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Libellé *
            </label>
            <input
              type="text"
              {...register("libelle")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
            {errors.libelle && (
              <p className="text-xs text-red-600 mt-1">
                {errors.libelle.message}
              </p>
            )}
          </div>

          {/* Type matériel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de matériel
            </label>
            <input
              type="text"
              {...register("typeMateriel")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

          {/* Numéro de série */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de série
            </label>
            <input
              type="text"
              {...register("numeroSerie")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

          {/* Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site
            </label>
            <input
              type="text"
              {...register("site")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

          {/* Localisation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localisation
            </label>
            <input
              type="text"
              {...register("localisation")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

          {/* Date étalonnage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date étalonnage
            </label>
            <input
              type="date"
              {...register("dateEtalonnage")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

          {/* Date prochain étalonnage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date prochain étalonnage
            </label>
            <input
              type="date"
              {...register("dateProchainEtalonnage")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

          {/* État (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                État
              </label>
              <select
                {...register("etat")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
              >
                {etatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            {...register("description")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-edf-blue text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50"
          >
            {isEdit ? "Enregistrer" : "Créer"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white text-gray-700 border border-gray-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
