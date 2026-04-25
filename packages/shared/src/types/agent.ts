export const RoleCode = {
  ADMIN: "ADMIN",
  GESTIONNAIRE_MAGASIN: "GESTIONNAIRE_MAGASIN",
  REFERENT_LOGISTIQUE: "REFERENT_LOGISTIQUE",
  REFERENT_MAQUETTE: "REFERENT_MAQUETTE",
  REFERENT_MATERIEL: "REFERENT_MATERIEL",
} as const;

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];

export type Role = {
  id: number;
  code: RoleCode;
  label: string;
  description?: string | null;
};

export type AgentRole = {
  agentId: number;
  roleId: number;
  role?: Role;
  grantedAt: string | Date;
  grantedBy?: number | null;
};

export type Agent = {
  id: number;
  azureAdOid?: string | null;
  email: string;
  nom: string;
  prenom: string;
  actif: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  roles?: AgentRole[];
};
