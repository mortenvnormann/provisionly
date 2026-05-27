/** Prevent open redirects — only allow same-origin relative paths. */
export function safeNextPath(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/home";
  }
  return next;
}
