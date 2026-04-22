import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createDemandeEnvoiSchema,
  type CreateDemandeEnvoiInput,
  TypeDemande,
} from "@ogade/shared";
import { api } from "@/lib/api";

const typeOptions = [
  { value: TypeDemande.MATERIEL, label: "Matériel" },
  { value: TypeDemande.MAQUETTE, label: "Maquette" },
  { value: TypeDemande.MUTUALISEE, label: "Mutualisée" },
];

export default function DemandeEnvoiFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateDemandeEnvoiInput>({
    resolver: zodResolver(createDemandeEnvoiSchema),
    defaultValues: {
      type: "MUTUALISEE",
      lignes: [{ quantite: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lignes",
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDemandeEnvoiInput) =>
      api.post<{ id: number }>("/demandes-envoi", data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["demandes-envoi"] });
      navigate(`/demandes-envoi/${result.id}`);
    },
  });

  const onSubmit = (data: CreateDemandeEnvoiInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Nouvelle demande d'envoi
      </h1>

      {createMutation.error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {createMutation.error.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              {...register("type")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-xs text-red-600 mt-1">
                {errors.type.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destinataire *
            </label>
            <input
              type="text"
              {...register("destinataire")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
            {errors.destinataire && (
              <p className="text-xs text-red-600 mt-1">
                {errors.destinataire.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site destinataire
            </label>
            <input
              type="text"
              {...register("siteDestinataire")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date souhaitée
            </label>
            <input
              type="date"
              {...register("dateSouhaitee")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motif
          </label>
          <input
            type="text"
            {...register("motif")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commentaire
          </label>
          <textarea
            rows={2}
            {...register("commentaire")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Lignes</h2>
            <button
              type="button"
              onClick={() => append({ quantite: 1 })}
              className="text-sm text-edf-blue hover:underline font-medium"
            >
              + Ajouter une ligne
            </button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex gap-3 items-end mb-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ID Matériel
                </label>
                <input
                  type="number"
                  {...register(`lignes.${index}.materielId`, {
                    valueAsNumber: true,
                  })}
                  placeholder="Laisser vide si maquette"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ID Maquette
                </label>
                <input
                  type="number"
                  {...register(`lignes.${index}.maquetteId`, {
                    valueAsNumber: true,
                  })}
                  placeholder="Laisser vide si matériel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Quantité
                </label>
                <input
                  type="number"
                  {...register(`lignes.${index}.quantite`, {
                    valueAsNumber: true,
                  })}
                  defaultValue={1}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-edf-blue/50"
                />
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700 text-sm pb-2"
                >
                  Suppr.
                </button>
              )}
            </div>
          ))}
          {errors.lignes && (
            <p className="text-xs text-red-600 mt-1">
              {typeof errors.lignes === "object" && "message" in errors.lignes
                ? (errors.lignes as { message?: string }).message
                : "Vérifiez les lignes"}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-edf-blue text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50"
          >
            Créer la demande
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
