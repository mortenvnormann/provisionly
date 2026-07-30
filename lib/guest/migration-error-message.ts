import {
  MIGRATION_ERROR_CODES,
  isMigrationErrorCode,
} from "@/lib/errors/migration-codes";

type HomeTranslator = (key: string, values?: { title?: string }) => string;

export function migrationErrorMessage(
  code: string,
  tHome: HomeTranslator,
): string {
  if (code === MIGRATION_ERROR_CODES.notSignedIn) {
    return tHome("importNotSignedIn");
  }

  const failedPrefix = `${MIGRATION_ERROR_CODES.failed}:`;
  if (code.startsWith(failedPrefix)) {
    const title = code.slice(failedPrefix.length);
    return tHome("importListFailed", { title });
  }

  if (isMigrationErrorCode(code)) {
    return tHome("importListFailed", { title: "" });
  }

  return tHome("importListFailed", { title: code });
}
