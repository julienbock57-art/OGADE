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

const urgenceOptions = [
  { value: "", label: "— Sélectionner —" },
  { value: "NORMALE", label: "Normale" },
  { value: "HAUTE", label: "Haute" },
  { value: "URGENTE", label: "Urgente" },
];

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-edf-blue/40 focus:border-edf-blue transition-colors";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-gray-200 pb-2 mb-4">
      <h2 className="text-base font-semibold text-edf-blue">{title}</h2>
    </div>
  );
}

export default function DemandeEnvoiFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateDemandeEnvoiInput>({
    resolver: zodResolver(createDemandeEnvoiSchema),
    defaultValues: {
      type: "MUTUALISEE",
      lignes: [{ quantite: 1 }],
      convention: false,
      souscriptionAssurance: false,
      produitsChimiques: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lignes",
  });

  const urgenceValue = watch("urgence");

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
          Nouvelle demande d'envoi
        </h1>
      </div>

      {createMutation.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {createMutation.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ─── Informations générales ────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Informations générales" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Type de demande *</label>
              <select {...register("type")} className={inputClass}>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Date d'envoi souhaitée</label>
              <input type="date" {...register("dateSouhaitee")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Motif de l'envoi</label>
              <input type="text" {...register("motif")} className={inputClass} placeholder="Essai, contrôle, réparation..." />
            </div>
            <div>
              <label className={labelClass}>Urgence</label>
              <select {...register("urgence")} className={inputClass}>
                {urgenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {urgenceValue && urgenceValue !== "NORMALE" && (
              <div className="md:col-span-2">
                <label className={labelClass}>Justification de l'urgence</label>
                <textarea rows={2} {...register("justificationUrgence")} className={inputClass} placeholder="Expliquez la raison de l'urgence..." />
              </div>
            )}
          </div>
        </div>

        {/* ─── Destinataire ──────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Destinataire" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Nom / Entreprise *</label>
              <input type="text" {...register("destinataire")} className={inputClass} placeholder="Nom du destinataire" />
              {errors.destinataire && <p className="text-xs text-red-600 mt-1">{errors.destinataire.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Site destinataire</label>
              <input type="text" {...register("siteDestinataire")} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Adresse de destination</label>
              <textarea rows={2} {...register("adresseDestination")} className={inputClass} placeholder="Adresse complète..." />
            </div>
            <div>
              <label className={labelClass}>Contact</label>
              <input type="text" {...register("contact")} className={inputClass} placeholder="Nom de la personne de contact" />
            </div>
            <div>
              <label className={labelClass}>Téléphone du contact</label>
              <input type="tel" {...register("contactTelephone")} className={inputClass} placeholder="06 XX XX XX XX" />
            </div>
          </div>
        </div>

        {/* ─── Options d'envoi ───────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Options d'envoi" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("convention")} id="convention" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="convention" className="text-sm text-gray-700">Convention existante</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("souscriptionAssurance")} id="souscriptionAssurance" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="souscriptionAssurance" className="text-sm text-gray-700">Souscription d'une assurance</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register("produitsChimiques")} id="produitsChimiques" className="h-4 w-4 rounded border-gray-300 text-edf-blue focus:ring-edf-blue" />
              <label htmlFor="produitsChimiques" className="text-sm text-gray-700">Contient des produits chimiques</label>
            </div>
          </div>
        </div>

        {/* ─── Lignes d'envoi ────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
            <h2 className="text-base font-semibold text-edf-blue">Éléments à envoyer</h2>
            <button
              type="button"
              onClick={() => append({ quantite: 1 })}
              className="inline-flex items-center gap-1 text-sm text-edf-blue hover:text-edf-blue/80 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-3 items-end p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    ID Matériel
                  </label>
                  <input
                    type="number"
                    {...register(`lignes.${index}.materielId`, { valueAsNumber: true })}
                    placeholder="Laisser vide si maquette"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    ID Maquette
                  </label>
                  <input
                    type="number"
                    {...register(`lignes.${index}.maquetteId`, { valueAsNumber: true })}
                    placeholder="Laisser vide si matériel"
                    className={inputClass}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Qté
                  </label>
                  <input
                    type="number"
                    {...register(`lignes.${index}.quantite`, { valueAsNumber: true })}
                    defaultValue={1}
                    min={1}
                    className={inputClass}
                  />
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-400 hover:text-red-600 pb-2.5 transition-colors"
                    title="Supprimer cette ligne"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.lignes && (
            <p className="text-xs text-red-600 mt-2">
              {typeof errors.lignes === "object" && "message" in errors.lignes
                ? (errors.lignes as { message?: string }).message
                : "Vérifiez les lignes : chaque ligne doit contenir un matériel OU une maquette"}
            </p>
          )}
        </div>

        {/* ─── Commentaire ───────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader title="Commentaire" />
          <textarea
            rows={3}
            {...register("commentaire")}
            className={inputClass}
            placeholder="Informations complémentaires..."
          />
        </div>

        {/* ─── Actions ───────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-edf-blue text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Création en cours..." : "Créer la demande d'envoi"}
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
