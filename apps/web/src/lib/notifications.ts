/**
 * Helpers et types partagés pour le système de notifications côté front.
 * Centralisé ici pour éviter la duplication entre la cloche, la page liste
 * et la page préférences.
 */

export type NotificationType =
  | "DEMANDE_A_VALIDER"
  | "DEMANDE_VALIDEE"
  | "DEMANDE_REFUSEE"
  | "DEMANDE_VAL_PARTIELLE"
  | "DEMANDE_A_TRAITER"
  | "DEMANDE_EXPEDIEE"
  | "DEMANDE_RECUE"
  | "DEMANDE_CLOTUREE"
  | "ETALONNAGE_PROCHE"
  | "ETALONNAGE_ECHU"
  | "MATERIEL_MODIFIE"
  | "MAQUETTE_MODIFIEE";

export type Notification = {
  id: number;
  recipientId: number;
  type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  entityType?: string | null;
  entityId?: number | string | null;
  payload?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  data: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type NotificationPreference = {
  agentId: number;
  notifType: string;
  inApp: boolean;
  email: boolean;
  updatedAt: string;
};

export const NOTIFICATION_TYPES: { type: NotificationType; label: string }[] = [
  { type: "DEMANDE_A_VALIDER", label: "Demandes à valider (je suis référent)" },
  { type: "DEMANDE_VALIDEE", label: "Ma demande a été validée" },
  { type: "DEMANDE_REFUSEE", label: "Ma demande a été refusée" },
  { type: "DEMANDE_VAL_PARTIELLE", label: "Ma demande est partiellement validée" },
  { type: "DEMANDE_A_TRAITER", label: "Demandes à traiter sur mes sites magasinier" },
  { type: "DEMANDE_EXPEDIEE", label: "Ma demande / une demande sur mes sites a été expédiée" },
  { type: "DEMANDE_RECUE", label: "Ma demande / une demande sur mes sites a été reçue" },
  { type: "DEMANDE_CLOTUREE", label: "Ma demande a été clôturée" },
  { type: "ETALONNAGE_PROCHE", label: "Étalonnages à échéance (matériels dont je suis responsable)" },
  { type: "ETALONNAGE_ECHU", label: "Étalonnages échus (matériels dont je suis responsable)" },
  { type: "MATERIEL_MODIFIE", label: "Modifications sur les matériels dont je suis responsable" },
  { type: "MAQUETTE_MODIFIEE", label: "Modifications sur les maquettes dont je suis référent" },
];

const NOTIF_LABEL_MAP: Record<string, string> = NOTIFICATION_TYPES.reduce<
  Record<string, string>
>((acc, item) => {
  acc[item.type] = item.label;
  return acc;
}, {});

const NOTIF_SHORT_MAP: Record<string, string> = {
  DEMANDE_A_VALIDER: "À valider",
  DEMANDE_VALIDEE: "Validée",
  DEMANDE_REFUSEE: "Refusée",
  DEMANDE_VAL_PARTIELLE: "Val. partielle",
  DEMANDE_A_TRAITER: "À traiter",
  DEMANDE_EXPEDIEE: "Expédiée",
  DEMANDE_RECUE: "Reçue",
  DEMANDE_CLOTUREE: "Clôturée",
  ETALONNAGE_PROCHE: "Étalonnage proche",
  ETALONNAGE_ECHU: "Étalonnage échu",
  MATERIEL_MODIFIE: "Matériel modifié",
  MAQUETTE_MODIFIEE: "Maquette modifiée",
};

const NOTIF_BADGE_CLASS: Record<string, string> = {
  DEMANDE_A_VALIDER: "c-amber",
  DEMANDE_VALIDEE: "c-emerald",
  DEMANDE_REFUSEE: "c-rose",
  DEMANDE_VAL_PARTIELLE: "c-amber",
  DEMANDE_A_TRAITER: "c-sky",
  DEMANDE_EXPEDIEE: "c-sky",
  DEMANDE_RECUE: "c-emerald",
  DEMANDE_CLOTUREE: "c-neutral",
  ETALONNAGE_PROCHE: "c-amber",
  ETALONNAGE_ECHU: "c-rose",
  MATERIEL_MODIFIE: "c-violet",
  MAQUETTE_MODIFIEE: "c-violet",
};

export function notifTypeLabel(type: string): string {
  return NOTIF_SHORT_MAP[type] ?? type;
}

export function notifTypeFullLabel(type: string): string {
  return NOTIF_LABEL_MAP[type] ?? type;
}

export function notifBadgeClass(type: string): string {
  return NOTIF_BADGE_CLASS[type] ?? "c-neutral";
}

const REL_UNITS: { limit: number; div: number; one: string; many: string }[] = [
  { limit: 60, div: 1, one: "à l'instant", many: "à l'instant" },
  { limit: 3600, div: 60, one: "il y a 1 min", many: "il y a {n} min" },
  { limit: 86400, div: 3600, one: "il y a 1 h", many: "il y a {n} h" },
  { limit: 604800, div: 86400, one: "il y a 1 j", many: "il y a {n} j" },
  { limit: 2592000, div: 604800, one: "il y a 1 sem.", many: "il y a {n} sem." },
];

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  for (const unit of REL_UNITS) {
    if (diffSec < unit.limit) {
      const n = Math.max(1, Math.floor(diffSec / unit.div));
      const tpl = n === 1 ? unit.one : unit.many;
      return tpl.replace("{n}", String(n));
    }
  }
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAbsoluteDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
