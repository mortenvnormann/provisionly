type ClientErrorContext = {
  digest?: string;
  boundary?: "error" | "global-error";
};

export function reportClientError(
  error: Error & { digest?: string },
  context: ClientErrorContext = {},
): void {
  console.error("[Provisionly]", {
    message: error.message,
    digest: error.digest ?? context.digest,
    boundary: context.boundary,
    stack: error.stack,
  });
}
