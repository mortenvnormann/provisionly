export const MIGRATION_ERROR_CODES = {
  notSignedIn: "migration_not_signed_in",
  failed: "migration_failed",
} as const;

export type MigrationErrorCode =
  (typeof MIGRATION_ERROR_CODES)[keyof typeof MIGRATION_ERROR_CODES];

export function isMigrationErrorCode(
  value: string,
): value is MigrationErrorCode {
  return Object.values(MIGRATION_ERROR_CODES).includes(
    value as MigrationErrorCode,
  );
}
