import { z } from 'zod';

export const createClientNoteSchema = z.object({
  salon_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  note_type: z.string().optional(),
  is_pinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
}).strict();

export const updateClientNoteSchema = z.object({
  salon_id: z.string().uuid(),
  content: z.string().min(1).max(5000).optional(),
  note_type: z.string().optional(),
  is_pinned: z.boolean().optional(),
}).strict();

export const togglePinNoteSchema = z.object({
  salon_id: z.string().uuid(),
}).strict();

export const addTagsSchema = z.object({
  salon_id: z.string().uuid(),
  tags: z.array(z.string()).min(1),
}).strict();
