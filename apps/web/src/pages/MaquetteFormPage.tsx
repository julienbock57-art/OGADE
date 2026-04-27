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
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          {isEdit ? "Modifier la maquette" : "Nouvelle maquette"}
        </h1>
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
              <input type="text" {...register("reference")} className="oinput" placeholder="Ex: MQ-001" />
              {errors.reference && <p style={errorStyle}>{errors.reference.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Libellé *</label>
              <input type="text" {...register("libelle")} className="oinput" placeholder="Nom de la maquette" />
              {errors.libelle && <p style={errorStyle}>{errors.libelle.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>ID maquette mère</label>
              <input type="number" {...register("maquetteMereId", { valueAsNumber: true })} className="oinput" placeholder="Laisser vide si racine" />
            </div>
            <div>
              <label style={labelStyle}>Quantité</label>
              <input type="number" {...register("quantite", { valueAsNumber: true })} className="oinput" min={1} />
            </div>
            {isEdit && (
              <div>
                <label style={labelStyle}>État</label>
                <select {...register("etat")} className="oselect">
                  {etatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Classification */}
        <SectionCard title="Classification">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 24px" }}>
            <div>
              <label style={labelStyle}>Type de maquette</label>
              <input type="text" {...register("typeMaquette")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Composant</label>
              <input type="text" {...register("composant")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Catégorie</label>
              <input type="text" {...register("categorie")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Forme de la maquette</label>
              <input type="text" {...register("forme")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Type d'assemblage</label>
              <input type="text" {...register("typeAssemblage")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Matière</label>
              <input type="text" {...register("matiere")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Procédures</label>
              <input type="text" {...register("procedures")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Type de contrôle</label>
              <input type="text" {...register("typeControle")} className="oinput" placeholder="UT, RT, ET, PT, MT..." />
            </div>
          </div>
        </SectionCard>

        {/* Localisation */}
        <SectionCard title="Localisation">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <div>
              <label style={labelStyle}>Site</label>
              <input type="text" {...register("site")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Localisation</label>
              <input type="text" {...register("localisation")} className="oinput" placeholder="Bâtiment, salle, rayonnage..." />
            </div>
            <div>
              <label style={labelStyle}>Entreprise</label>
              <input type="text" {...register("entreprise")} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Pôle / Entité</label>
              <input type="text" {...register("poleEntite")} className="oinput" />
            </div>
          </div>
        </SectionCard>

        {/* Dimensions */}
        <SectionCard title="Dimensions">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px 24px" }}>
            <div>
              <label style={labelStyle}>Longueur (mm)</label>
              <input type="number" step="0.1" {...register("longueur", { valueAsNumber: true })} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Largeur (mm)</label>
              <input type="number" step="0.1" {...register("largeur", { valueAsNumber: true })} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Hauteur (mm)</label>
              <input type="number" step="0.1" {...register("hauteur", { valueAsNumber: true })} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>DN</label>
              <input type="number" step="0.1" {...register("dn", { valueAsNumber: true })} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Épaisseur paroi (mm)</label>
              <input type="number" step="0.1" {...register("epaisseurParoi", { valueAsNumber: true })} className="oinput" />
            </div>
            <div>
              <label style={labelStyle}>Poids (kg)</label>
              <input type="number" step="0.01" {...register("poids", { valueAsNumber: true })} className="oinput" />
            </div>
          </div>
        </SectionCard>

        {/* Indicateurs */}
        <SectionCard title="Indicateurs">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {[
              { id: "referenceASN", name: "referenceASN" as const, label: "Référencée ASN" },
              { id: "horsPatrimoine", name: "horsPatrimoine" as const, label: "Hors patrimoine" },
              { id: "informationsCertifiees", name: "informationsCertifiees" as const, label: "Informations certifiées" },
              { id: "enTransit", name: "enTransit" as const, label: "En transit" },
            ].map(({ id, name, label }) => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" {...register(name)} id={id}
                  style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
                <label htmlFor={id} style={{ fontSize: 13, color: "var(--ink)" }}>{label}</label>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Informations financières */}
        <SectionCard title="Informations financières">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            <div>
              <label style={labelStyle}>Valeur financière (€)</label>
              <input type="number" step="0.01" {...register("valeurFinanciere", { valueAsNumber: true })} className="oinput" />
            </div>
          </div>
        </SectionCard>

        {/* Description */}
        <SectionCard title="Description">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea rows={3} {...register("description")} className="otextarea" placeholder="Description détaillée de la maquette..." />
            </div>
            <div>
              <label style={labelStyle}>Commentaires</label>
              <textarea rows={2} {...register("commentaires")} className="otextarea" />
            </div>
          </div>
        </SectionCard>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button type="submit" disabled={isSubmitting} className="obtn accent">
            {isSubmitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer la maquette"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="obtn">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
