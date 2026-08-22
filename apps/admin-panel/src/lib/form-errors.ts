import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";

interface ZodIssueLike {
  path: Array<string | number>;
  message: string;
}

export function getFormErrorMessages(
  error: TRPCClientErrorLike<AppRouter>,
): string[] {
  const data: unknown = error.data;
  const zodError = (data as { zodError?: ZodIssueLike[] | null } | undefined)
    ?.zodError;

  if (Array.isArray(zodError) && zodError.length > 0) {
    return zodError.map((issue) => issue.message);
  }

  return [error.message];
}
