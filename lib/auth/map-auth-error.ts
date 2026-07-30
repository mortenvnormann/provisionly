type AuthErrorKey =
  | "invalidCredentials"
  | "emailTaken"
  | "weakPassword"
  | "networkError";

const AUTH_ERROR_KEYS: Record<AuthErrorKey, AuthErrorKey> = {
  invalidCredentials: "invalidCredentials",
  emailTaken: "emailTaken",
  weakPassword: "weakPassword",
  networkError: "networkError",
};

export function mapAuthErrorKey(err: unknown): AuthErrorKey | null {
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message).toLowerCase()
      : "";

  if (!message) return null;

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return AUTH_ERROR_KEYS.invalidCredentials;
  }

  if (
    message.includes("already registered") ||
    message.includes("user already registered") ||
    message.includes("already exists")
  ) {
    return AUTH_ERROR_KEYS.emailTaken;
  }

  if (
    message.includes("password") &&
    (message.includes("weak") ||
      message.includes("short") ||
      message.includes("at least"))
  ) {
    return AUTH_ERROR_KEYS.weakPassword;
  }

  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("failed to fetch")
  ) {
    return AUTH_ERROR_KEYS.networkError;
  }

  return null;
}
