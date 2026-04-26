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
    RoleCode.ADMIN,
    RoleCode.GESTIONNAIRE_MAGASIN,
    RoleCode.REFERENT_LOGISTIQUE,
    RoleCode.REFERENT_MAQUETTE,
    RoleCode.REFERENT_MATERIEL,
  ]),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
