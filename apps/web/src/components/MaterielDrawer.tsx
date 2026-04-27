import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Materiel } from "@ogade/shared";
import { useReferentiel, useSites, useEntreprises } from "@/hooks/use-referentiels";

const etatLabels: Record<string, string> = { CORRECT: "Correct", LEGER_DEFAUT: "Léger défaut", HS: "HS", PERDU: "Perdu" };
const etatColors: Record<string, string> = { CORRECT: "text-emerald-700 bg-emerald-50", LEGER_DEFAUT: "text-amber-700 bg-amber-50", HS: "text-red-600 bg-red-50", PERDU: "text-gray-500 bg-gray-100" };
const compLabels: Record<string, string> = { COMPLET: "Complet", INCOMPLET: "Incomplet" };
const compColors: Record<string, string> = { COMPLET: "text-emerald-700 bg-emerald-50", INCOMPLET: "text-amber-700 bg-amber-50" };

type Tab = "infos" | "etat" | "historique" | "qr";

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <span className="text-[13px] text-gray-900 font-medium">{children}</span>
    </div>
  );
}

function ValiditySection({ m }: { m: Materiel }) {
  if (!m.soumisVerification || !m.dateProchainEtalonnage) return null;
  const echeance = new Date(m.dateProchainEtalonnage);
  const now = new Date();
  const jours = Math.round((echeance.getTime() - now.getTime()) / 86400000);
  const totalDays = (m.validiteEtalonnage ?? 12) * 30;
  const pct = Math.max(0, Math.min(100, 100 - (jours / totalDays) * 100));
  let cls = "text-emerald-600"; let fill = "bg-emerald-500"; let label = `dans ${jours} j`;
  if (jours < 0) { cls = "text-red-600 font-semibold"; fill = "bg-red-500"; label = `${-jours} j de retard`; }
  else if (jours <= 30) { cls = "text-amber-600"; fill = "bg-amber-500"; }
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="mt-2">
      <div className="flex justify-between items-baseline text-[12px] mb-1">
        <span className="font-medium text-gray-700">{fmt(echeance)}</span>
        <span className={cls}>{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MaterielDrawer({ materiel: m, onClose }: { materiel: Materiel; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("infos");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const { data: typesEnd } = useReferentiel("TYPE_END");
  const { data: typesMat } = useReferentiel("TYPE_MATERIEL");
  const { data: motifs } = useReferentiel("MOTIF_PRET");
  const { data: sites } = useSites();
  const { data: entreprises } = useEntreprises();
  const { data: fournisseurs } = useEntreprises("FOURNISSEUR");

  const refLabel = (list: { code: string; label: string }[] | undefined, code: string | null | undefined) =>
    code ? (list ?? []).find((r) => r.code === code)?.label ?? code : "—";

  const fmt = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  };
  const fmtShort = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtTime = (d: string | Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const resp = m.responsable as { prenom: string; nom: string } | null | undefined;
  const tabs: { id: Tab; label: string }[] = [
    { id: "infos", label: "Infos" },
    { id: "etat", label: "État" },
    { id: "historique", label: "Historique" },
    { id: "qr", label: "QR" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[780px] bg-gray-50 border-l border-gray-200 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Pill label={etatLabels[m.etat] ?? m.etat} cls={etatColors[m.etat] ?? "text-gray-600 bg-gray-100"} />
                {m.completude && <Pill label={compLabels[m.completude] ?? m.completude} cls={compColors[m.completude] ?? "text-gray-600 bg-gray-100"} />}
                {m.enPret && <Pill label={`En prêt${m.motifPret ? ` · ${refLabel(motifs, m.motifPret)}` : ""}`} cls="text-sky-700 bg-sky-50" />}
                {m.informationVerifiee && <Pill label="Vérifié" cls="text-emerald-700 bg-emerald-50" />}
              </div>
              <h2 className="text-[17px] font-semibold text-gray-900 truncate">
                {refLabel(typesMat, m.typeMateriel) ?? m.libelle} <span className="text-gray-400 font-normal">· {m.modele ?? m.libelle}</span>
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                <span className="font-mono">{m.reference}</span>
                <span>·</span>
                <span>{m.fournisseur ?? "—"}</span>
                <span>·</span>
                <span>{refLabel(sites, m.site)}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-5 bg-white border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? "text-edf-blue border-edf-blue" : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5 space-y-5">
          {tab === "infos" && (
            <>
              <Section title="Informations générales">
                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                  <Field label="Référence"><span className="font-mono">{m.reference}</span></Field>
                  <Field label="N° de FIEC"><span className="font-mono">{m.numeroFIEC ?? "—"}</span></Field>
                  <Field label="Propriétaire">{m.proprietaire ?? "—"}</Field>
                  <Field label="Type de matériel">{refLabel(typesMat, m.typeMateriel)}</Field>
                  <Field label="Fournisseur">{m.fournisseur ?? "—"}</Field>
                  <Field label="Modèle">{m.modele ?? "—"}</Field>
                  <Field label="Type d'END">
                    {m.typeEND ? <span className="inline-flex px-1.5 py-0 rounded bg-gray-100 border border-gray-200 text-[11px] font-mono font-medium">{refLabel(typesEnd, m.typeEND)}</span> : "—"}
                  </Field>
                  <Field label="Type traducteur">{m.typeTraducteur ?? "—"}</Field>
                  <Field label="Lot / chaîne"><span className="font-mono">{m.lotChaine ?? "—"}</span></Field>
                  <Field label="Responsable">
                    {resp ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-edf-blue/10 text-edf-blue flex items-center justify-center text-[9px] font-semibold">{resp.prenom?.[0]}{resp.nom?.[0]}</span>
                        {resp.prenom} {resp.nom}
                      </span>
                    ) : "—"}
                  </Field>
                  <Field label="Vérif. périodique">{m.soumisVerification ? "Oui" : "Non"}</Field>
                  <Field label="Info vérifiée">{m.informationVerifiee ? "Oui" : "Non"}</Field>
                </div>
              </Section>

              <Section title="Étalonnage & validité">
                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                  <Field label="Dernier étalonnage">{fmt(m.dateEtalonnage)}</Field>
                  <Field label="Validité">{m.validiteEtalonnage ? `${m.validiteEtalonnage} mois` : "—"}</Field>
                  <Field label="Échéance">{fmt(m.dateProchainEtalonnage)}</Field>
                </div>
                <ValiditySection m={m} />
              </Section>

              <Section title="Localisation">
                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                  <Field label="Site">{refLabel(sites, m.site)}</Field>
                  <Field label="Groupe">{m.groupe ?? "—"}</Field>
                  <Field label="Entreprise">{m.entreprise ?? "—"}</Field>
                  <Field label="En prêt">{m.enPret ? "Oui" : "Non"}</Field>
                  <Field label="Motif du prêt">{m.motifPret ? refLabel(motifs, m.motifPret) : "—"}</Field>
                  <Field label="En transit">{m.enTransit ?? "NON"}</Field>
                  <Field label="Date retour prêt">{fmtShort(m.dateRetourPret)}</Field>
                  <Field label="Localisation">{m.localisation ?? "—"}</Field>
                </div>
                {m.complementsLocalisation && (
                  <p className="mt-2 text-[12px] text-gray-600 whitespace-pre-wrap">{m.complementsLocalisation}</p>
                )}
              </Section>

              <Section title="Métadonnées">
                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                  <Field label="Créé">{fmtTime(m.createdAt)}</Field>
                  <Field label="Modifié">{fmtTime(m.updatedAt)}</Field>
                </div>
              </Section>
            </>
          )}

          {tab === "etat" && (
            <>
              <Section title="État du matériel">
                <div className="flex items-center gap-3 mb-2">
                  <Pill label={etatLabels[m.etat] ?? m.etat} cls={etatColors[m.etat] ?? "text-gray-600 bg-gray-100"} />
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {m.commentaireEtat || "Aucun commentaire d'état."}
                </p>
              </Section>
              <Section title="Complétude">
                <div className="flex items-center gap-3 mb-2">
                  {m.completude && <Pill label={compLabels[m.completude] ?? m.completude} cls={compColors[m.completude] ?? "text-gray-600 bg-gray-100"} />}
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {m.commentairesCompletude || "Aucun commentaire de complétude."}
                </p>
              </Section>
              {m.commentaires && (
                <Section title="Commentaires généraux">
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{m.commentaires}</p>
                </Section>
              )}
            </>
          )}

          {tab === "historique" && (
            <Section title="Historique des modifications">
              <div className="text-[13px] text-gray-400 text-center py-8">
                L'historique détaillé sera disponible dans une prochaine version.
              </div>
            </Section>
          )}

          {tab === "qr" && (
            <Section title="QR Code de traçabilité">
              <div className="flex flex-col items-center gap-4 py-4">
                <img
                  src={`/api/v1/qrcode/materiel/${m.id}`}
                  alt="QR Code"
                  className="w-40 h-40 border border-gray-200 rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="font-mono text-[11px] text-gray-400">OGADE/{m.reference}</span>
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-5 py-3 flex justify-between">
          <Link
            to={`/materiels/${m.id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Page détail
          </Link>
          <Link
            to={`/materiels/${m.id}/edit`}
            className="inline-flex items-center gap-2 bg-edf-blue text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-edf-blue/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Modifier
          </Link>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}
