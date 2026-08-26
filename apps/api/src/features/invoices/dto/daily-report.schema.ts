import { z } from 'zod';

export const DailyReportSchema = z.object({
  from: z.string().transform((val) => val),
  to: z.string().transform((val) => val),
});

export type DailyReportInput = z.infer<typeof DailyReportSchema>;
