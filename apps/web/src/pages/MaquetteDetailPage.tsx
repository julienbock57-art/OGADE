import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Maquette } from "@ogade/shared";
import { api } from "@/lib/api";

const etatPill: Record<string, { cls: string; label: string }> = {
  STOCK:        { cls: "pill c-emerald", label: "En stock" },
  EMPRUNTEE:    { cls: "pill c-amber",   label: "Empruntée" },
  EN_CONTROLE:  { cls: "pill c-sky",     label: "En contrôle" },
  REBUT:        { cls: "pill c-rose",    label: "Rebut" },
  EN_REPARATION:{ cls: "pill c-violet",  label: "En réparation" },
  ENVOYEE:      { cls: "pill c-neutral", label: "Envoyée" },
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
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

function QrCard({ id, reference }: { id: number; reference: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const apiPath = `/qrcode/maquette/${id}`;

  useEffect(() => {
    let revoke: string | null = null;
    api.fetchBlob(apiPath).then(blob => {
      const url = URL.createObjectURL(blob);
      revoke = url;
      setImgSrc(url);
    }).catch(() => setError(true));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [apiPath]);

  const handleDownload = async () => {
    const blob = await api.fetchBlob(apiPath);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-${reference}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      const blob = await api.fetchBlob(apiPath);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const blob = await api.fetchBlob(apiPath);
      const url = URL.createObjectURL(blob);
      window.open(url);
    }
  };

  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px" }}>
      <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--line-2)" }}>
        QR Code de traçabilité
      </h2>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "12px 0" }}>
        {error ? (
          <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", borderRadius: 12, background: "white", color: "var(--ink-3)", fontSize: 12 }}>
            QR indisponible
          </div>
        ) : imgSrc ? (
          <img
            src={imgSrc}
            alt={`QR Code ${reference}`}
            style={{ width: 200, height: 200, border: "1px solid var(--line)", borderRadius: 12, background: "white", padding: 8 }}
          />
        ) : (
          <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", borderRadius: 12, background: "white" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ink-3)" }}>OGADE/{reference}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="obtn" onClick={handleDownload} disabled={!imgSrc}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3v10m0 0l-4-4m4 4l4-4" /><path d="M4 16h12" />
            </svg>
            Télécharger le QR
          </button>
          <button className="obtn" onClick={handleCopy} disabled={!imgSrc}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              {copied
                ? <path d="M4 10l4 4 8-8" />
                : <><path d="M6 4h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M10 2h4a2 2 0 0 1 2 2v4" /></>
              }
            </svg>
            {copied ? "Copié !" : "Copier l'image"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MaquetteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: maquette,
    isLoading,
    isError,
  } = useQuery<Maquette>({
    queryKey: ["maquettes", id],
    queryFn: () => api.get(`/maquettes/${id}`),
    enabled: !!id,
  });

  const emprunterMutation = useMutation({
    mutationFn: () => api.post(`/maquettes/${id}/emprunter`, { emprunteurId: 1 }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["maquettes", id] }),
  });

  const retournerMutation = useMutation({
    mutationFn: () => api.post(`/maquettes/${id}/retourner`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["maquettes", id] }),
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "32px 0", color: "var(--ink-3)", fontSize: 13 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--accent-soft)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
        Chargement...
      </div>
    );
  }
  if (isError || !maquette) {
    return <p style={{ fontSize: 13, color: "var(--rose)" }}>Erreur lors du chargement de la maquette.</p>;
  }

  const pill = etatPill[maquette.etat] ?? { cls: "pill c-neutral", label: maquette.etat };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
              Maquette : {maquette.reference}
            </h1>
            <span className={pill.cls}><span className="dot" />{pill.label}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>{maquette.libelle}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to={`/maquettes/${id}/edit`}
            className="obtn accent"
            style={{ textDecoration: "none" }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </Link>
          <Link
            to="/maquettes"
            className="obtn"
            style={{ textDecoration: "none" }}
          >
            Retour à la liste
          </Link>
        </div>
      </div>

      {/* Main info card */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid var(--line-2)" }}>
          Informations
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
          <Field label="Référence">{maquette.reference}</Field>
          <Field label="Libellé">{maquette.libelle}</Field>
          <Field label="État">
            <span className={pill.cls}><span className="dot" />{pill.label}</span>
          </Field>
          <Field label="Type de maquette">{maquette.typeMaquette ?? "—"}</Field>
          <Field label="Site">{maquette.site ?? "—"}</Field>
          <Field label="Localisation">{maquette.localisation ?? "—"}</Field>
          <Field label="Date d'emprunt">{formatDate(maquette.dateEmprunt)}</Field>
          <Field label="Date de retour">{formatDate(maquette.dateRetour)}</Field>
          {maquette.description && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Description">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{maquette.description}</p>
              </Field>
            </div>
          )}
          <Field label="Créé le">{formatDate(maquette.createdAt)}</Field>
          <Field label="Modifié le">{formatDate(maquette.updatedAt)}</Field>
        </div>
      </div>

      {/* Actions */}
      {(maquette.etat === "STOCK" || maquette.etat === "EMPRUNTEE") && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {maquette.etat === "STOCK" && (
            <button
              onClick={() => emprunterMutation.mutate()}
              disabled={emprunterMutation.isPending}
              className="obtn"
              style={{
                background: "var(--amber-soft)", color: "oklch(0.50 0.17 60)",
                borderColor: "color-mix(in oklch, var(--amber) 30%, transparent)",
              }}
            >
              Emprunter
            </button>
          )}
          {maquette.etat === "EMPRUNTEE" && (
            <button
              onClick={() => retournerMutation.mutate()}
              disabled={retournerMutation.isPending}
              className="obtn"
              style={{
                background: "var(--emerald-soft)", color: "var(--emerald)",
                borderColor: "color-mix(in oklch, var(--emerald) 25%, transparent)",
              }}
            >
              Retourner
            </button>
          )}
        </div>
      )}

      {/* QR Code */}
      <QrCard id={Number(id)} reference={maquette.reference} />
    </div>
  );
}
