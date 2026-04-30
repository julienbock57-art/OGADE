import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(500).optional().default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
