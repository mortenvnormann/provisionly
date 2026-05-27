/** Public app origin for share links (no trailing slash). */
export function getAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export function buildJoinUrl(token: string): string {
  return `${getAppOrigin()}/join/${encodeURIComponent(token)}`;
}
