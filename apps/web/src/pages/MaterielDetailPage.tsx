import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel } from "@ogade/shared";
import { api } from "@/lib/api";
import {
  useReferentiel,
  useSites,
  useEntreprises,
} from "@/hooks/use-referentiels";

const etatPill: Record<string, { cls: string; label: string }> = {
  CORRECT:     { cls: "pill c-emerald", label: "Correct" },
  LEGER_DEFAUT:{ cls: "pill c-amber",   label: "Léger défaut" },
  HS:          { cls: "pill c-rose",    label: "HS" },
  PERDU:       { cls: "pill c-neutral", label: "Perdu" },
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
      <dt style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </dt>
      <dd style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{children || "—"}</dd>
    </div>
  );
}

function BoolField({ label, value }: { label: string; value?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4,
        background: value ? "var(--accent)" : "var(--bg-sunken)",
        border: `1.5px solid ${value ? "var(--accent)" : "var(--line)"}`,
        display: "grid", placeItems: "center", color: "white", flexShrink: 0,
      }}>
        {value && (
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: "var(--ink)" }}>{label}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--bg-panel)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <h2 style={{
        fontSize: 11, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "var(--ink-3)",
        margin: "0 0 16px",
        paddingBottom: 10,
        borderBottom: "1px solid var(--line-2)",
      }}>
        {title}
      </h2>
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
  const lotChaineLabel = useRefLabel("LOT_CHAINE", materiel?.lotChaine);

  const siteObj = (sites ?? []).find((s) => s.code === materiel?.site);
  const fournisseurObj = (fournisseurs ?? []).find((e) => e.code === materiel?.fournisseur);
  const entrepriseObj = (entreprisesData ?? []).find((e) => e.code === materiel?.entreprise);

  if (isLoading) {
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

  if (isError || !materiel) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: "var(--rose-soft)", border: "1px solid color-mix(in oklch, var(--rose) 25%, transparent)",
          borderRadius: 12, padding: "32px", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--rose)" }}>Erreur lors du chargement du matériel.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 8, fontSize: 12, color: "var(--rose)", background: "none", border: 0, textDecoration: "underline", cursor: "pointer" }}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  const pill = etatPill[materiel.etat] ?? { cls: "pill c-neutral", label: materiel.etat };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ color: "var(--ink-3)", background: "none", border: 0, padding: 4, cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{materiel.reference}</h1>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{materiel.libelle}</p>
          </div>
          <span className={pill.cls}><span className="dot" />{pill.label}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to={`/materiels/${id}/edit`}
            className="obtn accent"
            style={{ textDecoration: "none" }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </Link>
          <Link
            to="/materiels"
            className="obtn"
            style={{ textDecoration: "none" }}
          >
            Liste
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Identification */}
        <SectionCard title="Identification">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 32px" }}>
            <Field label="Référence">{materiel.reference}</Field>
            <Field label="Libellé">{materiel.libelle}</Field>
            <Field label="Numéro de série">{materiel.numeroSerie}</Field>
            <Field label="Modèle">{materiel.modele}</Field>
            <Field label="N° FIEC">{materiel.numeroFIEC}</Field>
            <Field label="Propriétaire">{materiel.proprietaire}</Field>
            <Field label="État">
              <span className={pill.cls}><span className="dot" />{pill.label}</span>
            </Field>
            {materiel.commentaireEtat && (
              <Field label="Commentaire état">
                <p style={{ whiteSpace: "pre-wrap", color: "var(--ink-2)", margin: 0 }}>{materiel.commentaireEtat}</p>
              </Field>
            )}
          </div>
        </SectionCard>

        {/* Classification */}
        <SectionCard title="Classification">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 32px" }}>
            <Field label="Type END">{typeEndLabel}</Field>
            <Field label="Type de matériel">{typeMatLabel}</Field>
            <Field label="Type de traducteur">{typeTraducteurLabel}</Field>
            <Field label="Groupe">{groupeLabel}</Field>
            <Field label="Lot / Chaîne">{lotChaineLabel}</Field>
            <Field label="Fournisseur">
              {fournisseurObj ? (
                <span>
                  {fournisseurObj.label}
                  {fournisseurObj.ville && (
                    <span style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: 4 }}>— {fournisseurObj.ville}</span>
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
                    <span style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: 4 }}>— {entrepriseObj.ville}</span>
                  )}
                </span>
              ) : (
                materiel.entreprise || "—"
              )}
            </Field>
            <Field label="Responsable">
              {materiel.responsable ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--accent-soft)", color: "var(--accent-ink)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 600,
                  }}>
                    {materiel.responsable.prenom?.[0]}{materiel.responsable.nom?.[0]}
                  </span>
                  {materiel.responsable.prenom} {materiel.responsable.nom}
                </span>
              ) : "—"}
            </Field>
          </div>
        </SectionCard>

        {/* Localisation */}
        <SectionCard title="Localisation">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 32px" }}>
            <Field label="Site">
              {siteObj ? (
                <div>
                  <div>{siteObj.label}</div>
                  {(siteObj.adresse || siteObj.ville) && (
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                      {[siteObj.adresse, siteObj.codePostal, siteObj.ville].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              ) : (
                materiel.site || "—"
              )}
            </Field>
            <Field label="Localisation">{materiel.localisation}</Field>
            <Field label="Compléments">{materiel.complementsLocalisation}</Field>
            <Field label="En transit">{materiel.enTransit === "OUI" ? "Oui" : "Non"}</Field>
          </div>
        </SectionCard>

        {/* Étalonnage */}
        <SectionCard title="Étalonnage">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 32px" }}>
            <Field label="Date dernier étalonnage">{formatDate(materiel.dateEtalonnage)}</Field>
            <Field label="Date prochain étalonnage">{formatDate(materiel.dateProchainEtalonnage)}</Field>
            <Field label="Validité">
              {materiel.validiteEtalonnage ? `${materiel.validiteEtalonnage} mois` : "—"}
            </Field>
            <BoolField label="Soumis à vérification périodique" value={materiel.soumisVerification} />
          </div>
        </SectionCard>

        {/* Prêt */}
        <SectionCard title="Prêt">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 32px" }}>
            <BoolField label="En prêt" value={materiel.enPret} />
            <Field label="Motif du prêt">{motifPretLabel}</Field>
            <Field label="Date de retour">{formatDate(materiel.dateRetourPret)}</Field>
          </div>
        </SectionCard>

        {/* Complétude et vérification */}
        <SectionCard title="Complétude et vérification">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 32px" }}>
            <Field label="Complétude">{completudeLabel}</Field>
            <BoolField label="Information vérifiée" value={materiel.informationVerifiee} />
            <BoolField label="Produits chimiques" value={materiel.produitsChimiques} />
          </div>
          {materiel.commentairesCompletude && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line-2)" }}>
              <Field label="Commentaire complétude">
                <p style={{ whiteSpace: "pre-wrap", color: "var(--ink-2)", margin: 0 }}>{materiel.commentairesCompletude}</p>
              </Field>
            </div>
          )}
        </SectionCard>

        {/* Description */}
        {(materiel.description || materiel.commentaires) && (
          <SectionCard title="Description">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {materiel.description && (
                <Field label="Description">
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{materiel.description}</p>
                </Field>
              )}
              {materiel.commentaires && (
                <Field label="Commentaires">
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{materiel.commentaires}</p>
                </Field>
              )}
            </div>
          </SectionCard>
        )}

        {/* QR Code + Métadonnées */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <SectionCard title="QR Code">
            <div style={{ display: "flex", justifyContent: "center" }}>
              <img
                src={`/api/v1/qrcode/materiel/${id}`}
                alt={`QR code du matériel ${materiel.reference}`}
                style={{ width: 160, height: 160 }}
              />
            </div>
          </SectionCard>

          <SectionCard title="Métadonnées">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Créé le">{formatDate(materiel.createdAt)}</Field>
              <Field label="Dernière modification">{formatDate(materiel.updatedAt)}</Field>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
