import { z } from 'zod';

export const logActionSchema = z.object({
  user_id: z.string().uuid(),
  user_type: z.enum(['owner', 'staff', 'manager', 'system']),
  action_type: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: z.string().uuid(),
  action_data: z.any(),
  previous_state: z.any().optional(),
  new_state: z.any().optional(),
  is_undoable: z.boolean().optional(),
}).strict();

export const getHistoryQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  action_type: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});
