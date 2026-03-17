import { z } from 'zod';

export const conciergeChatSchema = z.object({
  message: z.string().min(1, 'message is required'),
  salonId: z.string().min(1, 'salonId is required'),
  clientId: z.string().optional(),
  sessionId: z.string().optional(),
}).strict();

export const directBookSchema = z.object({
  salonId: z.string().min(1, 'salonId is required'),
  clientId: z.string().min(1, 'clientId is required'),
  serviceId: z.string().min(1, 'serviceId is required'),
  staffId: z.string().optional(),
  dateTime: z.string().min(1, 'dateTime is required'),
  serviceName: z.string().optional(),
  staffName: z.string().optional(),
}).strict();
