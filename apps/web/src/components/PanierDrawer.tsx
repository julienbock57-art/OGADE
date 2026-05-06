/**
 * PanierDrawer — slide-over droite affichant le panier d'envoi en
 * préparation, avec picker intégré pour ajouter matériels et maquettes.
 *
 * Onglets internes : "Panier" (lignes courantes) et "Ajouter"
 * (recherche multi-types).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Materiel, Maquette, PaginatedResult } from "@ogade/shared";
import { api } from "@/lib/api";
import { usePanier, type PanierItem } from "@/lib/panier";

const ICONS: Record<string, string> = {
  x:      "M5 5l10 10M15 5L5 15",
  search: "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
  plus:   "M10 4v12M4 10h12",
  trash:  "M5 6h10 M8 6V4h4v2 M6 6v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6",
  cart:   "M3 4h2l2 9h10l2-7H7 M8 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M16 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  list:   "M4 5h12M4 10h12M4 15h12",
  box:    "M3 6l7-3 7 3v8l-7 3-7-3V6z M3 6l7 3 7-3 M10 9v8",
  check:  "M4 10l4 4 8-8",
  send:   "M3 10l14-7-7 14-2-7-5-0z",
};

function Icon({ name, size = 14, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const d = ICONS[name] ?? "";
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

type Tab = "panier" | "ajouter";

export default function PanierDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { items, count, add, has, remove, clear } = usePanier();
  const [tab, setTab] = useState<Tab>(items.length > 0 ? "panier" : "ajouter");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "materiel" | "maquette">("all");
  const [addError, setAddError] = useState<string | null>(null);

  function handleAdd(it: PanierItem) {
    const r = add(it);
    if (!r.ok) setAddError(r.reason);
    else setAddError(null);
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const { data: matResults, isLoading: matLoading } = useQuery<PaginatedResult<Materiel>>({
    queryKey: ["materiels", "panier-search", search],
    queryFn: () => api.get("/materiels", { page: 1, pageSize: 20, search: search || undefined }),
    enabled: tab === "ajouter" && filter !== "maquette",
  });
  const { data: maqResults, isLoading: maqLoading } = useQuery<PaginatedResult<Maquette>>({
    queryKey: ["maquettes", "panier-search", search],
    queryFn: () => api.get("/maquettes", { page: 1, pageSize: 20, search: search || undefined }),
    enabled: tab === "ajouter" && filter !== "materiel",
  });

  const matItems: PanierItem[] = (matResults?.data ?? []).map((m) => ({
    kind: "materiel" as const,
    id: m.id,
    reference: m.reference,
    libelle: m.libelle,
    site: m.site ?? null,
    typeMateriel: m.typeMateriel ?? null,
  }));
  const maqItems: PanierItem[] = (maqResults?.data ?? []).map((m) => ({
    kind: "maquette" as const,
    id: m.id,
    reference: m.reference,
    libelle: m.libelle,
    site: m.site ?? null,
    typeMaquette: m.typeMaquette ?? null,
  }));

  const merged: PanierItem[] = [
    ...(filter === "materiel" || filter === "all" ? matItems : []),
    ...(filter === "maquette" || filter === "all" ? maqItems : []),
  ];

  const goToCreateDe = () => {
    onClose();
    navigate("/demandes-envoi/nouveau");
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ width: "min(560px, 96vw)" }}>
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Icon name="cart" size={16} />
              <h2 className="drawer-title" style={{ margin: 0 }}>Panier d'envoi</h2>
              <span className="tag" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)", fontWeight: 600 }}>
                {count} item{count > 1 ? "s" : ""}
              </span>
            </div>
            <div className="drawer-sub">
              Préparez votre demande d'envoi en sélectionnant matériels et maquettes
              {items[0]?.site && (
                <> · <strong>Site origine : {items[0].site}</strong></>
              )}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>

        {/* Onglets */}
        <div className="otabs">
          <button
            className={`otab${tab === "panier" ? " on" : ""}`}
            onClick={() => setTab("panier")}
            type="button"
          >
            <Icon name="cart" size={13} />
            Panier ({count})
          </button>
          <button
            className={`otab${tab === "ajouter" ? " on" : ""}`}
            onClick={() => setTab("ajouter")}
            type="button"
          >
            <Icon name="plus" size={13} />
            Ajouter
          </button>
        </div>

        {addError && (
          <div style={{ padding: "10px 16px", background: "var(--rose-soft, #fee2e2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", color: "var(--rose)", fontSize: 12.5 }}>
            {addError}
            <button
              type="button"
              onClick={() => setAddError(null)}
              className="icon-btn"
              style={{ marginLeft: 6, color: "var(--rose)" }}
              aria-label="Fermer"
            >×</button>
          </div>
        )}

        <div className="drawer-body">
          {tab === "panier" && (
            <PanierTab
              items={items}
              onRemove={remove}
              onClear={clear}
              onSwitchAdd={() => setTab("ajouter")}
              onCreateDe={goToCreateDe}
            />
          )}

          {tab === "ajouter" && (
            <div className="vstack" style={{ gap: 12 }}>
              <div className="search-bar">
                <Icon name="search" />
                <input
                  type="text"
                  placeholder="Recherche — référence, libellé…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="seg">
                <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")} type="button">Tous</button>
                <button className={filter === "materiel" ? "on" : ""} onClick={() => setFilter("materiel")} type="button">Matériels</button>
                <button className={filter === "maquette" ? "on" : ""} onClick={() => setFilter("maquette")} type="button">Maquettes</button>
              </div>

              <div className="vstack" style={{ gap: 6 }}>
                {(matLoading || maqLoading) && (
                  <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: "8px 0 0" }}>Chargement…</p>
                )}
                {!matLoading && !maqLoading && merged.length === 0 && (
                  <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: "8px 0 0" }}>
                    Aucun résultat pour cette recherche.
                  </p>
                )}
                {merged.map((it) => {
                  const inCart = has(it.kind, it.id);
                  return (
                    <div
                      key={`${it.kind}-${it.id}`}
                      className="mchip"
                      style={inCart ? { background: "var(--accent-soft)", borderColor: "var(--accent-line)" } : undefined}
                    >
                      <span className="mchip-id">{it.reference}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mchip-lbl">
                          {it.kind === "materiel" ? (it.typeMateriel ?? "Matériel") : (it.typeMaquette ?? "Maquette")}
                          {it.libelle ? ` · ${it.libelle}` : ""}
                        </div>
                        <div className="mchip-meta">
                          <span className={`tag ${it.kind === "materiel" ? "c-accent" : ""}`} style={{ fontSize: 10 }}>
                            {it.kind === "materiel" ? "MATÉRIEL" : "MAQUETTE"}
                          </span>
                          {it.site ? ` · ${it.site}` : ""}
                        </div>
                      </div>
                      {inCart ? (
                        <button
                          className="obtn ghost sm"
                          onClick={() => remove(it.kind, it.id)}
                          type="button"
                          style={{ color: "var(--ink-3)" }}
                        >
                          Retirer
                        </button>
                      ) : (
                        <button
                          className="obtn accent sm"
                          onClick={() => handleAdd(it)}
                          type="button"
                        >
                          <Icon name="plus" size={11} />
                          Ajouter
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <div className="left">
            <button className="obtn ghost" onClick={onClose} type="button">Fermer</button>
          </div>
          <div className="right">
            <button
              className="obtn accent"
              type="button"
              disabled={count === 0}
              onClick={goToCreateDe}
            >
              <Icon name="send" size={13} />
              Créer la demande d'envoi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PanierTab({
  items,
  onRemove,
  onClear,
  onSwitchAdd,
  onCreateDe,
}: {
  items: PanierItem[];
  onRemove: (kind: PanierItem["kind"], id: number) => void;
  onClear: () => void;
  onSwitchAdd: () => void;
  onCreateDe: () => void;
}) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)" }}>
        <Icon name="cart" size={24} />
        <p style={{ marginTop: 8, fontSize: 13 }}>Votre panier est vide</p>
        <button className="obtn accent sm" onClick={onSwitchAdd} type="button">
          <Icon name="plus" size={11} />
          Ajouter des items
        </button>
      </div>
    );
  }
  const matCount = items.filter((it) => it.kind === "materiel").length;
  const maqCount = items.filter((it) => it.kind === "maquette").length;
  return (
    <div className="vstack" style={{ gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)" }}>
        <span>{matCount} matériel{matCount > 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{maqCount} maquette{maqCount > 1 ? "s" : ""}</span>
        <span style={{ flex: 1 }} />
        <button
          className="obtn ghost sm"
          type="button"
          onClick={() => {
            if (confirm("Vider le panier ?")) onClear();
          }}
        >
          <Icon name="trash" size={11} />
          Vider
        </button>
      </div>

      {items.map((it) => (
        <div key={`${it.kind}-${it.id}`} className="mchip">
          <span className="mchip-id">{it.reference}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mchip-lbl">
              {it.kind === "materiel" ? (it.typeMateriel ?? "Matériel") : (it.typeMaquette ?? "Maquette")}
              {it.libelle ? ` · ${it.libelle}` : ""}
            </div>
            <div className="mchip-meta">
              <span className="tag" style={{ fontSize: 10 }}>
                {it.kind === "materiel" ? "MATÉRIEL" : "MAQUETTE"}
              </span>
              {it.site ? ` · ${it.site}` : ""}
            </div>
          </div>
          <button
            className="icon-btn"
            type="button"
            onClick={() => onRemove(it.kind, it.id)}
            aria-label="Retirer du panier"
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      ))}

      <button
        className="obtn accent"
        style={{ marginTop: 12, justifyContent: "center" }}
        onClick={onCreateDe}
        type="button"
      >
        <Icon name="send" size={13} />
        Créer la demande d'envoi avec ces {items.length} item{items.length > 1 ? "s" : ""}
      </button>
    </div>
  );
}
