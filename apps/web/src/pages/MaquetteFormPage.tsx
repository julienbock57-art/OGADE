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
    return <p className="text-sm text-gray-500">Chargement...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? "Modifier la maquette" : "Nouvelle maquette"}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de maquette
            </label>
            <input
              type="text"
              {...register("typeMaquette")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID maquette mère
            </label>
            <input
              type="number"
              {...register("maquetteMereId", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

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
