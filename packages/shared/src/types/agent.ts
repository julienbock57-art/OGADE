export const RoleCode = {
  MAGASINIER: "MAGASINIER",
  REFERENT_LOGISTIQUE_DQI: "REFERENT_LOGISTIQUE_DQI",
  REFERENT_MAQUETTE: "REFERENT_MAQUETTE",
  ADMIN_MATERIELS: "ADMIN_MATERIELS",
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
  grantedAt: string | Date;
  grantedBy?: string | null;
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
