import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel } from "@ogade/shared";
import { api } from "@/lib/api";
import Badge from "@/components/Badge";
import {
  useReferentiel,
  useSites,
  useEntreprises,
} from "@/hooks/use-referentiels";

const etatBadge: Record<string, { variant: string; label: string }> = {
  DISPONIBLE: { variant: "success", label: "Disponible" },
  EN_SERVICE: { variant: "info", label: "En service" },
  EN_REPARATION: { variant: "warning", label: "En réparation" },
  REBUT: { variant: "danger", label: "Rebut" },
  PRETE: { variant: "purple", label: "Prêté" },
  ENVOYEE: { variant: "default", label: "Envoyé" },
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">{children || "—"}</dd>
    </div>
  );
}

function BoolField({ label, value }: { label: string; value?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded flex items-center justify-center ${value ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-300"}`}>
        {value ? (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="border-b border-gray-200 pb-2 mb-4">
        <h2 className="text-base font-semibold text-edf-blue">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function useRefLabel(type: string, code?: string | null) {
  const { data } = useReferentiel(type);
  if (!code) return null;
  return (data ?? []).find((r) => r.code === code)?.label ?? code;
}

export default function MaterielDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: materiel, isLoading, isError } = useQuery<Materiel>({
    queryKey: ["materiels", id],
    queryFn: () => api.get(`/materiels/${id}`),
    enabled: !!id,
  });

  const { data: sites } = useSites();
  const { data: fournisseurs } = useEntreprises("FOURNISSEUR");
  const { data: entreprisesData } = useEntreprises("ENTREPRISE");

  const typeEndLabel = useRefLabel("TYPE_END", materiel?.typeEND);
  const typeMatLabel = useRefLabel("TYPE_MATERIEL", materiel?.typeMateriel);
  const typeTraducteurLabel = useRefLabel("TYPE_TRADUCTEUR", materiel?.typeTraducteur);
  const groupeLabel = useRefLabel("GROUPE", materiel?.groupe);
  const completudeLabel = useRefLabel("COMPLETUDE", materiel?.completude);
  const motifPretLabel = useRefLabel("MOTIF_PRET", materiel?.motifPret);

  const siteObj = (sites ?? []).find((s) => s.code === materiel?.site);
  const fournisseurObj = (fournisseurs ?? []).find((e) => e.code === materiel?.fournisseur);
  const entrepriseObj = (entreprisesData ?? []).find((e) => e.code === materiel?.entreprise);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edf-blue" />
      </div>
    );
  }

  if (isError || !materiel) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
          <p className="text-sm text-red-600">Erreur lors du chargement du matériel.</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-xs text-red-500 hover:underline">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const badge = etatBadge[materiel.etat] ?? { variant: "default", label: materiel.etat };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{materiel.reference}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{materiel.libelle}</p>
          </div>
          <Badge variant={badge.variant} text={badge.label} />
        </div>
        <div className="flex gap-2">
          <Link
            to={`/materiels/${id}/edit`}
            className="inline-flex items-center gap-2 bg-edf-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </Link>
          <Link
            to="/materiels"
            className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Liste
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Identification */}
        <SectionCard title="Identification">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <Field label="Référence">{materiel.reference}</Field>
            <Field label="Libellé">{materiel.libelle}</Field>
            <Field label="Numéro de série">{materiel.numeroSerie}</Field>
            <Field label="Modèle">{materiel.modele}</Field>
            <Field label="État">
              <Badge variant={badge.variant} text={badge.label} />
            </Field>
          </div>
        </SectionCard>

        {/* Classification */}
        <SectionCard title="Classification">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <Field label="Type END">{typeEndLabel}</Field>
            <Field label="Type de matériel">{typeMatLabel}</Field>
            <Field label="Type de traducteur">{typeTraducteurLabel}</Field>
            <Field label="Groupe">{groupeLabel}</Field>
            <Field label="Fournisseur">
              {fournisseurObj ? (
                <span>
                  {fournisseurObj.label}
                  {fournisseurObj.ville && (
                    <span className="text-xs text-gray-400 ml-1">— {fournisseurObj.ville}</span>
                  )}
                </span>
              ) : (
                materiel.fournisseur || "—"
              )}
            </Field>
            <Field label="Entreprise">
              {entrepriseObj ? (
                <span>
                  {entrepriseObj.label}
                  {entrepriseObj.ville && (
                    <span className="text-xs text-gray-400 ml-1">— {entrepriseObj.ville}</span>
                  )}
                </span>
              ) : (
                materiel.entreprise || "—"
              )}
            </Field>
          </div>
        </SectionCard>

        {/* Localisation */}
        <SectionCard title="Localisation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Site">
              {siteObj ? (
                <div>
                  <div>{siteObj.label}</div>
                  {(siteObj.adresse || siteObj.ville) && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {[siteObj.adresse, siteObj.codePostal, siteObj.ville].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              ) : (
                materiel.site || "—"
              )}
            </Field>
            <Field label="Localisation">{materiel.localisation}</Field>
          </div>
        </SectionCard>

        {/* Étalonnage */}
        <SectionCard title="Étalonnage">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <Field label="Date dernier étalonnage">
              {formatDate(materiel.dateEtalonnage)}
            </Field>
            <Field label="Date prochain étalonnage">
              {formatDate(materiel.dateProchainEtalonnage)}
            </Field>
            <Field label="Validité">
              {materiel.validiteEtalonnage ? `${materiel.validiteEtalonnage} mois` : "—"}
            </Field>
            <BoolField label="Soumis à vérification périodique" value={materiel.soumisVerification} />
          </div>
        </SectionCard>

        {/* Prêt */}
        <SectionCard title="Prêt">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <BoolField label="En prêt" value={materiel.enPret} />
            <Field label="Motif du prêt">{motifPretLabel}</Field>
            <Field label="Date de retour">{formatDate(materiel.dateRetourPret)}</Field>
          </div>
        </SectionCard>

        {/* Complétude et vérification */}
        <SectionCard title="Complétude et vérification">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <Field label="Complétude">{completudeLabel}</Field>
            <BoolField label="Information vérifiée" value={materiel.informationVerifiee} />
            <BoolField label="Produits chimiques" value={materiel.produitsChimiques} />
          </div>
        </SectionCard>

        {/* Description */}
        {(materiel.description || materiel.commentaires) && (
          <SectionCard title="Description">
            <div className="space-y-4">
              {materiel.description && (
                <Field label="Description">
                  <p className="whitespace-pre-wrap">{materiel.description}</p>
                </Field>
              )}
              {materiel.commentaires && (
                <Field label="Commentaires">
                  <p className="whitespace-pre-wrap">{materiel.commentaires}</p>
                </Field>
              )}
            </div>
          </SectionCard>
        )}

        {/* QR Code + Métadonnées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="QR Code">
            <div className="flex justify-center">
              <img
                src={`/api/v1/qrcode/materiel/${id}`}
                alt={`QR code du matériel ${materiel.reference}`}
                className="w-48 h-48"
              />
            </div>
          </SectionCard>

          <SectionCard title="Métadonnées">
            <div className="space-y-3">
              <Field label="Créé le">{formatDate(materiel.createdAt)}</Field>
              <Field label="Dernière modification">{formatDate(materiel.updatedAt)}</Field>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
