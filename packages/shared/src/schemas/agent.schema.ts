import { z } from "zod";
import { RoleCode } from "../types/agent";

export const createAgentSchema = z.object({
  email: z.string().email(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  azureAdOid: z.string().optional(),
});

export const updateAgentSchema = createAgentSchema.partial().extend({
  actif: z.boolean().optional(),
});

export const assignRoleSchema = z.object({
  roleCode: z.enum([
    RoleCode.MAGASINIER,
    RoleCode.REFERENT_LOGISTIQUE_DQI,
    RoleCode.REFERENT_MAQUETTE,
    RoleCode.ADMIN_MATERIELS,
  ]),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
