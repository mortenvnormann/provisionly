import { isRecipeImportErrorCode } from "@/lib/errors/recipe-import-codes";
import { isShareErrorCode } from "@/lib/errors/share-codes";

/** User-facing failure with a stable code for i18n mapping. */
export class AppError extends Error {
  readonly code: string;

  constructor(code: string, cause?: unknown) {
    super(code);
    this.name = "AppError";
    this.code = code;
    if (cause !== undefined) {
      console.error(`[AppError:${code}]`, cause);
    }
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/** Resolve a stable error code from AppError or serialized server-action errors. */
export function getAppErrorCode(err: unknown): string | null {
  if (isAppError(err)) return err.code;
  if (
    err instanceof Error &&
    (isShareErrorCode(err.message) || isRecipeImportErrorCode(err.message))
  ) {
    return err.message;
  }
  return null;
}
