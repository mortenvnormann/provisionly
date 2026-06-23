const QUEUE_KEY = "provisionly_offline_queue";

/** Read-only pending mutation count for global UI (avoids importing full queue module). */
export function countPendingMutations(listId?: string): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { mutations?: unknown[] };
    const mutations = Array.isArray(parsed.mutations) ? parsed.mutations : [];
    if (!listId) return mutations.length;
    return mutations.filter(
      (mutation) =>
        typeof mutation === "object" &&
        mutation !== null &&
        "listId" in mutation &&
        (mutation as { listId: string }).listId === listId,
    ).length;
  } catch {
    return 0;
  }
}
