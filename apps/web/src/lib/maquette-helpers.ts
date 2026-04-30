// Shared helpers for the maquette redesign (drawer, list, detail page).
// Mirrors the design from ogade-mq.jsx.

export const MQ_ICONS: Record<string, string> = {
  eye:     "M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  alert:   "M10 7v4m0 2v.01 M2 16L10 3l8 13H2z",
  clip:    "M7 9l5-5 3 3-7 7-3-3a2 2 0 0 1 0-3",
  photo:   "M3 5h14v10H3z M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M3 13l4-4 4 4 3-3 3 3",
  history: "M10 18a8 8 0 1 0-8-8 M2 4v4h4 M10 6v4l3 2",
  box:     "M3 6l7-3 7 3v8l-7 3-7-3V6z M3 6l7 3 7-3 M10 9v8",
  qr:      "M3 3h6v6H3z M11 3h6v6h-6z M3 11h6v6H3z M11 11h2v2h-2z M15 11h2v2h-2z M11 15h2v2h-2z M15 15h2v2h-2z M5 5h2v2H5z M13 5h2v2h-2z M5 13h2v2H5z",
  pin:     "M10 18s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z M10 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  user:    "M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M4 17a6 6 0 0 1 12 0",
  ruler:   "M3 13l4-4 7 7-4 4-7-7z M7 9l1 1 M9 7l1 1 M11 5l1 1 M13 11l1 1 M15 9l1 1",
  info:    "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M10 7v.01 M10 10v4",
  swap:    "M5 7h11l-3-3 M15 13H4l3 3",
  edit:    "M12 4l4 4-8 8H4v-4l8-8z",
  x:       "M5 5l10 10M15 5L5 15",
  plus:    "M10 4v12M4 10h12",
  dl:      "M10 3v10m0 0l-4-4m4 4l4-4M4 16h12",
  dash:    "M4 10h12",
  check:   "M4 10l4 4 8-8",
  chevR:   "M7 5l5 5-5 5",
  chevD:   "M5 7l5 5 5-5",
  flask:   "M8 3h4 M9 3v5l-4 8a2 2 0 0 0 2 3h6a2 2 0 0 0 2-3l-4-8V3",
  map:     "M3 5l5-2 4 2 5-2v12l-5 2-4-2-5 2z M8 3v12 M12 5v12",
  search:  "M11 11l4 4M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
  filter:  "M3 5h14M6 10h8M9 15h2",
  sort:    "M8 5l-3 3 M8 5l3 3 M8 5v8 M14 13l-3-3 M14 13l3-3 M14 13V5",
};

export function mqIconPaths(name: string): string[] {
  const d = MQ_ICONS[name] ?? "";
  return d.split(" M").map((p, i) => (i === 0 ? p : "M" + p));
}

/** Map a maquette `typeMaquette` value to the design's color class. */
export function mqTypeClass(t?: string | null): string {
  if (!t) return "";
  const v = t.toLowerCase();
  if (v.includes("qualif")) return "qual";
  if (v.includes("entra")) return "ent";
  if (v.includes("asn")) return "asn";
  if (v.includes("démo") || v.includes("demo")) return "dem";
  return "";
}

/** Etat pill colors for maquettes (existing schema values). */
export const MQ_ETAT_PILL: Record<string, { cls: string; label: string }> = {
  STOCK:         { cls: "pill c-emerald", label: "En stock" },
  EMPRUNTEE:     { cls: "pill c-amber",   label: "Empruntée" },
  EN_CONTROLE:   { cls: "pill c-sky",     label: "En contrôle" },
  REBUT:         { cls: "pill c-rose",    label: "Rebut" },
  EN_REPARATION: { cls: "pill c-violet",  label: "En réparation" },
  ENVOYEE:       { cls: "pill c-neutral", label: "Envoyée" },
};

/** Best-guess color for a defect type (label or code). */
export function defautColor(typeOrCouleur?: string | null): string {
  if (!typeOrCouleur) return "var(--ink-3)";
  if (typeOrCouleur.startsWith("oklch") || typeOrCouleur.startsWith("var(") || typeOrCouleur.startsWith("#")) {
    return typeOrCouleur;
  }
  const v = typeOrCouleur.toLowerCase();
  if (v.includes("fissure")) return "var(--rose)";
  if (v.includes("manque") || v.includes("retassure")) return "oklch(0.66 0.17 70)";
  if (v.includes("inclusion")) return "var(--violet)";
  if (v.includes("porosit")) return "var(--sky)";
  if (v.includes("soufflure")) return "var(--amber)";
  return "var(--ink-3)";
}
