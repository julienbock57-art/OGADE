import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Materiel, PaginatedResult, Reservation } from "@ogade/shared";
import { TypeReservation } from "@ogade/shared";
import { api } from "@/lib/api";

const ICONS: Record<string, string> = {
  search: "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
  x: "M5 5l10 10M15 5L5 15",
  check: "M4 10l4 4 8-8",
  alert: "M10 7v4m0 2v.01 M2 16L10 3l8 13H2z",
  swap: "M5 7h11l-3-3 M15 13H4l3 3",
  flask: "M8 3h4 M9 3v5l-4 8a2 2 0 0 0 2 3h6a2 2 0 0 0 2-3l-4-8V3",
  truck: "M3 6h10v9H3z M13 9h4l2 3v3h-6 M6 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M15 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  qr: "M3 3h6v6H3z M11 3h6v6h-6z M3 11h6v6H3z M11 11h2v2h-2z M15 11h2v2h-2z M11 15h2v2h-2z M15 15h2v2h-2z M5 5h2v2H5z M13 5h2v2h-2z M5 13h2v2H5z",
  star: "M10 3l2.3 4.6 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.4l5.2-.8L10 3z",
};

function Icon({ name, size = 14, stroke = 1.6, style }: { name: string; size?: number; stroke?: number; style?: React.CSSProperties }) {
  const d = ICONS[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const TYPE_OPTIONS: { code: string; label: string; couleur: string; icon: string }[] = [
  { code: TypeReservation.TRANSFERT_SITE, label: "Transfert site", couleur: "sky", icon: "swap" },
  { code: TypeReservation.ETALONNAGE, label: "Étalonnage", couleur: "violet", icon: "flask" },
  { code: TypeReservation.PRET_EXTERNE, label: "Prêt externe", couleur: "amber", icon: "truck" },
  { code: TypeReservation.PRET_INTERNE, label: "Prêt interne", couleur: "emerald", icon: "swap" },
  { code: TypeReservation.AUTRE, label: "Autre", couleur: "neutral", icon: "star" },
];

type Conflict = {
  kind: "reservation" | "demande-envoi";
  id: number;
  numero: string;
  label: string;
  dateDebut: string | Date;
  dateFin: string | Date | null;
};

const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const todayIso = () => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};
const inDaysIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export type ReservationModalProps = {
  onClose: () => void;
  onCreated?: (reservation: Reservation) => void;
  initialMateriel?: Materiel | null;
  reservation?: Reservation | null;
};

export default function ReservationModal({
  onClose,
  onCreated,
  initialMateriel,
  reservation,
}: ReservationModalProps) {
  const isEdit = !!reservation;
  const qc = useQueryClient();

  const [mat, setMat] = useState<Materiel | null>(initialMateriel ?? (reservation?.materiel
    ? ({ ...(reservation.materiel as unknown as Materiel) })
    : null));
  const [type, setType] = useState<string | null>(reservation?.type ?? null);
  const [debut, setDebut] = useState<string>(
    reservation
      ? new Date(reservation.dateDebut).toISOString().slice(0, 10)
      : initialMateriel
        ? inDaysIso(7)
        : inDaysIso(7),
  );
  const [fin, setFin] = useState<string>(
    reservation
      ? new Date(reservation.dateFin).toISOString().slice(0, 10)
      : inDaysIso(14),
  );
  const [motif, setMotif] = useState<string>(reservation?.motif ?? "");
  const [commentaire, setCommentaire] = useState<string>(
    reservation?.commentaire ?? "",
  );
  const [matSearch, setMatSearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Search materiels (only when picking)
  const { data: matResults } = useQuery<PaginatedResult<Materiel>>({
    queryKey: ["materiels", "modal-search", matSearch],
    queryFn: () =>
      api.get("/materiels", {
        page: 1,
        pageSize: 8,
        search: matSearch || undefined,
      }),
    enabled: !mat,
  });

  // Conflict check — refetched on every submit to avoid stale cache after a
  // prior creation in the same session.
  const { data: conflicts = [], refetch: refetchConflicts } = useQuery<Conflict[]>({
    queryKey: ["reservation-conflicts", mat?.id, debut, fin, reservation?.id],
    queryFn: () =>
      api.get("/reservations/conflicts", {
        materielId: mat!.id,
        dateDebut: new Date(debut).toISOString(),
        dateFin: new Date(fin).toISOString(),
        ...(reservation?.id ? { excludeId: reservation.id } : {}),
      }),
    enabled: !!mat && !!debut && !!fin && new Date(fin) >= new Date(debut),
    staleTime: 0,
  });

  const durationDays = useMemo(() => {
    if (!debut || !fin) return 0;
    const diff = new Date(fin).getTime() - new Date(debut).getTime();
    return Math.round(diff / 86400000) + 1;
  }, [debut, fin]);

  const datesValid = !!debut && !!fin && new Date(fin) >= new Date(debut);
  const canSubmit =
    !!mat && !!type && datesValid && conflicts.length === 0;

  const invalidateAfterMutation = () => {
    qc.invalidateQueries({ queryKey: ["reservations"] });
    qc.invalidateQueries({ queryKey: ["reservations-stats"] });
    qc.invalidateQueries({ queryKey: ["materiel-reservations"] });
    qc.invalidateQueries({ queryKey: ["materiel-calendar"] });
    qc.invalidateQueries({ queryKey: ["reservation-conflicts"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post<Reservation>("/reservations", payload),
    onSuccess: (created) => {
      invalidateAfterMutation();
      onCreated?.(created);
      onClose();
    },
    onError: (e: any) => setSubmitError(e?.message ?? "Erreur lors de la création"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      api.patch<Reservation>(`/reservations/${reservation!.id}`, payload),
    onSuccess: (updated) => {
      invalidateAfterMutation();
      onCreated?.(updated);
      onClose();
    },
    onError: (e: any) => setSubmitError(e?.message ?? "Erreur lors de la mise à jour"),
  });

  async function handleSubmit() {
    if (!mat || !type || !datesValid) return;
    setSubmitError(null);
    // Force a fresh check to prevent stale-cache double-bookings
    const fresh = await refetchConflicts();
    if (fresh.data && fresh.data.length > 0) {
      setSubmitError(
        "Conflit avec une réservation existante sur la période demandée.",
      );
      return;
    }
    const payload = {
      ...(isEdit ? {} : { materielId: mat.id }),
      dateDebut: new Date(debut).toISOString(),
      dateFin: new Date(fin).toISOString(),
      type,
      motif: motif || undefined,
      commentaire: commentaire || undefined,
    };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <h2 className="modal-title">
              {isEdit ? "Modifier la réservation" : "Nouvelle réservation"}
            </h2>
            <div className="modal-sub">
              Pré-bloquer un matériel pour une utilisation future
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>

        <div className="modal-body">
          {/* Matériel */}
          <div className="field">
            <label className="field-label">Matériel à réserver *</label>
            {!mat ? (
              <>
                <div className="search-bar">
                  <Icon name="search" />
                  <input
                    type="text"
                    placeholder="ID, type, modèle…"
                    value={matSearch}
                    onChange={(e) => setMatSearch(e.target.value)}
                  />
                </div>
                <div className="vstack" style={{ gap: 6, marginTop: 10 }}>
                  {(matResults?.data ?? []).map((m) => (
                    <div key={m.id} className="mchip-pick" onClick={() => setMat(m)}>
                      <span className="mchip-id">{m.reference}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mchip-lbl">
                          {m.typeMateriel ?? "Matériel"} · {m.modele ?? "—"}
                        </div>
                        <div className="mchip-meta">
                          {m.localisation || m.site || "—"}
                        </div>
                      </div>
                      <button className="obtn sm accent" type="button">
                        <Icon name="check" size={11} stroke={2.5} />
                        Choisir
                      </button>
                    </div>
                  ))}
                  {(matResults?.data?.length ?? 0) === 0 && (
                    <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "8px 0 0" }}>
                      Aucun matériel ne correspond à la recherche.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="mchip ok">
                <span className="mchip-id">{mat.reference}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mchip-lbl">
                    {mat.typeMateriel ?? "Matériel"} · {mat.modele ?? "—"}
                  </div>
                  <div className="mchip-meta">
                    {mat.localisation || mat.site || "—"}
                  </div>
                </div>
                {!isEdit && !initialMateriel && (
                  <button
                    className="icon-btn"
                    onClick={() => setMat(null)}
                    aria-label="Retirer"
                  >
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Période */}
          <div className="form-grid two">
            <div className="field">
              <label className="field-label">Date début *</label>
              <input
                className="input"
                type="date"
                min={todayIso()}
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Date fin *</label>
              <input
                className="input"
                type="date"
                min={debut || todayIso()}
                value={fin}
                onChange={(e) => setFin(e.target.value)}
              />
            </div>
          </div>
          {datesValid && (
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: -10 }}>
              Durée : {durationDays} jour{durationDays > 1 ? "s" : ""}
            </div>
          )}
          {!datesValid && debut && fin && (
            <div style={{ fontSize: 11.5, color: "var(--rose)", marginTop: -10 }}>
              La date de fin doit être postérieure à la date de début.
            </div>
          )}

          {/* Type */}
          <div className="field">
            <label className="field-label">Type d&apos;utilisation prévu *</label>
            <div className="hstack" style={{ gap: 6, flexWrap: "wrap" }}>
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  className={`type-badge ${t.couleur}${type === t.code ? " on" : ""}`}
                  style={{
                    padding: "4px 10px",
                    borderColor: type === t.code ? "currentColor" : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setType(t.code)}
                >
                  <Icon name={t.icon} size={11} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Motif */}
          <div className="field">
            <label className="field-label">Motif / Campagne</label>
            <textarea
              className="textarea"
              placeholder="Arrêt de tranche T2 Cruas, mai 2026…"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />
          </div>

          {/* Commentaire */}
          <div className="field">
            <label className="field-label">Commentaire</label>
            <textarea
              className="textarea"
              placeholder="Précisions complémentaires"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </div>

          {/* Conflict / availability feedback */}
          {mat && conflicts.length > 0 && (
            <div className="conflict-box">
              <Icon name="alert" size={14} stroke={2.2} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Conflit potentiel — ce matériel est déjà engagé
                </div>
                {conflicts.map((c) => (
                  <div key={`${c.kind}-${c.id}`} style={{ fontSize: 11.5, marginTop: 2 }}>
                    · {c.label} ({fmtDate(c.dateDebut)} → {fmtDate(c.dateFin)})
                  </div>
                ))}
              </div>
            </div>
          )}
          {mat && datesValid && conflicts.length === 0 && (
            <div className="availability-box">
              <Icon name="check" size={13} stroke={2.5} />
              Disponible sur la période demandée
            </div>
          )}

          {submitError && (
            <div className="conflict-box">
              <Icon name="alert" size={14} stroke={2.2} />
              <div>{submitError}</div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="obtn ghost" onClick={onClose} type="button">
            Annuler
          </button>
          <button
            className="obtn accent"
            type="button"
            disabled={!canSubmit || createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit}
          >
            <Icon name="check" size={13} stroke={2.5} />
            {isEdit ? "Enregistrer" : "Confirmer la réservation"}
          </button>
        </div>
      </div>
    </div>
  );
}
