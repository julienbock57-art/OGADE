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

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500,
  color: "var(--ink-2)", marginBottom: 5,
};

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--line-2)",
      }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: 0 }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
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
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          Nouvelle demande d'envoi
        </h1>
      </div>

      {createMutation.error && (
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
          {createMutation.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Informations générales */}
        <SectionCard title="Informations générales">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <div>
              <label style={labelStyle}>Type de demande *</label>
              <select {...register("type")} className="oselect">
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.type && <p style={{ fontSize: 11, color: "var(--rose)", marginTop: 4 }}>{errors.type.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Date d'envoi souhaitée</label>
              <input type="date" {...register("dateSouhaitee")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Motif de l'envoi</label>
              <input type="text" {...register("motif")} className="oinput" placeholder="Essai, contrôle, réparation..." />
            </div>
            <div>
              <label style={labelStyle}>Urgence</label>
              <select {...register("urgence")} className="oselect">
                {urgenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {urgenceValue && urgenceValue !== "NORMALE" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Justification de l'urgence</label>
                <textarea rows={2} {...register("justificationUrgence")} className="otextarea" placeholder="Expliquez la raison de l'urgence..." />
              </div>
            )}
          </div>
        </SectionCard>

        {/* Destinataire */}
        <SectionCard title="Destinataire">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <div>
              <label style={labelStyle}>Nom / Entreprise *</label>
              <input type="text" {...register("destinataire")} className="oinput" placeholder="Nom du destinataire" />
              {errors.destinataire && <p style={{ fontSize: 11, color: "var(--rose)", marginTop: 4 }}>{errors.destinataire.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Site destinataire</label>
              <input type="text" {...register("siteDestinataire")} className="oinput" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Adresse de destination</label>
              <textarea rows={2} {...register("adresseDestination")} className="otextarea" placeholder="Adresse complète..." />
            </div>
            <div>
              <label style={labelStyle}>Contact</label>
              <input type="text" {...register("contact")} className="oinput" placeholder="Nom de la personne de contact" />
            </div>
            <div>
              <label style={labelStyle}>Téléphone du contact</label>
              <input type="tel" {...register("contactTelephone")} className="oinput" placeholder="06 XX XX XX XX" />
            </div>
          </div>
        </SectionCard>

        {/* Options d'envoi */}
        <SectionCard title="Options d'envoi">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {[
              { id: "convention", name: "convention" as const, label: "Convention existante" },
              { id: "souscriptionAssurance", name: "souscriptionAssurance" as const, label: "Souscription d'une assurance" },
              { id: "produitsChimiques", name: "produitsChimiques" as const, label: "Contient des produits chimiques" },
            ].map(({ id, name, label }) => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" {...register(name)} id={id}
                  style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
                <label htmlFor={id} style={{ fontSize: 13, color: "var(--ink)" }}>{label}</label>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Éléments à envoyer */}
        <SectionCard
          title="Éléments à envoyer"
          action={
            <button
              type="button"
              onClick={() => append({ quantite: 1 })}
              className="obtn"
              style={{ fontSize: 12, padding: "4px 10px" }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une ligne
            </button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fields.map((field, index) => (
              <div
                key={field.id}
                style={{
                  display: "flex", gap: 12, alignItems: "flex-end",
                  padding: "14px 16px",
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>ID Matériel</label>
                  <input
                    type="number"
                    {...register(`lignes.${index}.materielId`, { valueAsNumber: true })}
                    placeholder="Laisser vide si maquette"
                    className="oinput"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>ID Maquette</label>
                  <input
                    type="number"
                    {...register(`lignes.${index}.maquetteId`, { valueAsNumber: true })}
                    placeholder="Laisser vide si matériel"
                    className="oinput"
                  />
                </div>
                <div style={{ width: 90 }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Qté</label>
                  <input
                    type="number"
                    {...register(`lignes.${index}.quantite`, { valueAsNumber: true })}
                    defaultValue={1}
                    min={1}
                    className="oinput"
                  />
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    style={{
                      background: "none", border: 0, padding: "6px",
                      color: "var(--rose)", cursor: "pointer",
                      borderRadius: 6, display: "flex", alignItems: "center",
                      marginBottom: 2,
                    }}
                    title="Supprimer cette ligne"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.lignes && (
            <p style={{ fontSize: 11, color: "var(--rose)", marginTop: 8 }}>
              {typeof errors.lignes === "object" && "message" in errors.lignes
                ? (errors.lignes as { message?: string }).message
                : "Vérifiez les lignes : chaque ligne doit contenir un matériel OU une maquette"}
            </p>
          )}
        </SectionCard>

        {/* Commentaire */}
        <SectionCard title="Commentaire">
          <textarea
            rows={3}
            {...register("commentaire")}
            className="otextarea"
            placeholder="Informations complémentaires..."
          />
        </SectionCard>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button type="submit" disabled={isSubmitting} className="obtn accent">
            {isSubmitting ? "Création en cours..." : "Créer la demande d'envoi"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="obtn">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
