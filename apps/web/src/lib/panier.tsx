/**
 * Panier de préparation d'envoi.
 *
 * Le panier rassemble des matériels ET des maquettes en une seule "poche"
 * persistée localement. L'utilisateur peut y ajouter des items depuis
 * n'importe quelle page (liste matériels, fiche matériel, fiche maquette,
 * etc.) puis ouvrir le `PanierDrawer` pour générer une demande d'envoi.
 *
 * On ne touche pas le backend ici — le panier est un état frontend
 * éphémère, transformé en `DemandeEnvoi` à la confirmation.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PanierItem =
  | {
      kind: "materiel";
      id: number;
      reference: string;
      libelle: string;
      site?: string | null;
      typeMateriel?: string | null;
    }
  | {
      kind: "maquette";
      id: number;
      reference: string;
      libelle: string;
      site?: string | null;
      typeMaquette?: string | null;
    };

type PanierState = {
  items: PanierItem[];
};

type AddResult = { ok: true } | { ok: false; reason: string };

type PanierContextValue = {
  items: PanierItem[];
  count: number;
  /** Site commun à tous les items du panier (null si vide). */
  site: string | null;
  has: (kind: PanierItem["kind"], id: number) => boolean;
  /**
   * Ajoute un item. Retourne `{ ok: false, reason }` si l'item n'a pas le
   * même site que les autres (règle métier : une demande d'envoi part
   * toujours d'un site unique).
   */
  add: (item: PanierItem) => AddResult;
  remove: (kind: PanierItem["kind"], id: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "ogade_panier_envoi";

const PanierContext = createContext<PanierContextValue>({
  items: [],
  count: 0,
  site: null,
  has: () => false,
  add: () => ({ ok: true }),
  remove: () => {},
  clear: () => {},
});

function load(): PanierState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as PanierState;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function save(state: PanierState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function PanierProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PanierState>(() => load());

  // Sync between tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(load());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const has = useCallback(
    (kind: PanierItem["kind"], id: number) =>
      state.items.some((it) => it.kind === kind && it.id === id),
    [state.items],
  );

  const add = useCallback((item: PanierItem): AddResult => {
    let result: AddResult = { ok: true };
    setState((s) => {
      if (s.items.some((it) => it.kind === item.kind && it.id === item.id)) {
        return s; // already in
      }
      // Règle métier : tous les items d'une même demande doivent être sur
      // le même site (un envoi part d'un seul site origine).
      const currentSite = s.items[0]?.site ?? null;
      const itemSite = item.site ?? null;
      if (currentSite && itemSite && currentSite !== itemSite) {
        result = {
          ok: false,
          reason: `Cet item est rattaché au site "${itemSite}" alors que le panier contient déjà des items du site "${currentSite}". Une demande d'envoi part d'un seul site — finalisez la demande en cours ou videz le panier avant d'ajouter cet item.`,
        };
        return s;
      }
      const next = { items: [...s.items, item] };
      save(next);
      return next;
    });
    return result;
  }, []);

  const remove = useCallback((kind: PanierItem["kind"], id: number) => {
    setState((s) => {
      const next = {
        items: s.items.filter((it) => !(it.kind === kind && it.id === id)),
      };
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setState({ items: [] });
    save({ items: [] });
  }, []);

  const value = useMemo<PanierContextValue>(
    () => ({
      items: state.items,
      count: state.items.length,
      site: state.items[0]?.site ?? null,
      has,
      add,
      remove,
      clear,
    }),
    [state.items, has, add, remove, clear],
  );

  return (
    <PanierContext.Provider value={value}>{children}</PanierContext.Provider>
  );
}

export function usePanier(): PanierContextValue {
  return useContext(PanierContext);
}
