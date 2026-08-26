import { z } from 'zod';

export const MonthlyReportSchema = z.object({
  year: z.string().transform((val) => val),
});

export type MonthlyReportInput = z.infer<typeof MonthlyReportSchema>;
