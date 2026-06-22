import type { ListItemRow } from "@/lib/lists/types";

export const LOCAL_ITEM_PREFIX = "local:";

export type AddItemPayload = {
  name: string;
  quantity: number | null;
  unit: string | null;
  sortKey: string;
};

export type OfflineMutation =
  | {
      id: string;
      type: "add_item";
      listId: string;
      tempItemId: string;
      payload: AddItemPayload;
      at: number;
    }
  | {
      id: string;
      type: "toggle_checked";
      listId: string;
      itemId: string;
      checked: boolean;
      at: number;
    }
  | {
      id: string;
      type: "delete_item";
      listId: string;
      itemId: string;
      at: number;
    };

type QueueState = {
  mutations: OfflineMutation[];
  idMap: Record<string, string>;
};

const QUEUE_KEY = "provisionly_offline_queue";

function readState(): QueueState {
  if (typeof localStorage === "undefined") {
    return { mutations: [], idMap: {} };
  }
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return { mutations: [], idMap: {} };
    const parsed = JSON.parse(raw) as Partial<QueueState>;
    return {
      mutations: Array.isArray(parsed.mutations) ? parsed.mutations : [],
      idMap:
        parsed.idMap && typeof parsed.idMap === "object" ? parsed.idMap : {},
    };
  } catch {
    return { mutations: [], idMap: {} };
  }
}

function notifyQueueChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("provisionly-offline-queue"));
}

function writeState(state: QueueState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(state));
    notifyQueueChange();
  } catch {
    // Ignore quota errors
  }
}

export function isLocalItemId(itemId: string): boolean {
  return itemId.startsWith(LOCAL_ITEM_PREFIX);
}

export function createLocalItemId(): string {
  return `${LOCAL_ITEM_PREFIX}${crypto.randomUUID()}`;
}

export function resolveItemId(
  itemId: string,
  idMap: Record<string, string>,
): string {
  return idMap[itemId] ?? itemId;
}

export type EnqueueInput =
  | (Omit<
      Extract<OfflineMutation, { type: "add_item" }>,
      "id" | "at"
    > & { id?: string; at?: number })
  | (Omit<
      Extract<OfflineMutation, { type: "toggle_checked" }>,
      "id" | "at"
    > & { id?: string; at?: number })
  | (Omit<
      Extract<OfflineMutation, { type: "delete_item" }>,
      "id" | "at"
    > & { id?: string; at?: number });

export function enqueue(mutation: EnqueueInput): OfflineMutation {
  const state = readState();
  const entry = {
    ...mutation,
    id: mutation.id ?? crypto.randomUUID(),
    at: mutation.at ?? Date.now(),
  } as OfflineMutation;
  state.mutations.push(entry);
  writeState(state);
  return entry;
}

export function listMutations(listId?: string): OfflineMutation[] {
  const { mutations } = readState();
  if (!listId) return mutations;
  return mutations.filter((mutation) => mutation.listId === listId);
}

export function countPendingMutations(listId?: string): number {
  return listMutations(listId).length;
}

export function readIdMap(): Record<string, string> {
  return readState().idMap;
}

export function setIdMapping(tempItemId: string, serverItemId: string): void {
  const state = readState();
  state.idMap[tempItemId] = serverItemId;
  writeState(state);
}

export function removeMutation(mutationId: string): void {
  const state = readState();
  state.mutations = state.mutations.filter(
    (mutation) => mutation.id !== mutationId,
  );
  writeState(state);
}

export function applyOptimisticMutation(
  items: ListItemRow[],
  listId: string,
  mutation: OfflineMutation,
): ListItemRow[] {
  if (mutation.listId !== listId) return items;

  switch (mutation.type) {
    case "add_item": {
      if (items.some((item) => item.id === mutation.tempItemId)) {
        return items;
      }
      return [
        ...items,
        {
          id: mutation.tempItemId,
          listId,
          name: mutation.payload.name,
          quantity: mutation.payload.quantity,
          unit: mutation.payload.unit,
          categoryId: null,
          checked: false,
          sortKey: mutation.payload.sortKey,
        },
      ];
    }
    case "toggle_checked":
      return items.map((item) =>
        item.id === mutation.itemId ? { ...item, checked: mutation.checked } : item,
      );
    case "delete_item":
      return items.filter((item) => item.id !== mutation.itemId);
    default:
      return items;
  }
}

export function applyQueuedMutations(
  listId: string,
  items: ListItemRow[],
): ListItemRow[] {
  return listMutations(listId).reduce(
    (next, mutation) => applyOptimisticMutation(next, listId, mutation),
    items,
  );
}

export function pruneIdMap(activeTempIds: Set<string>): void {
  const state = readState();
  const nextMap: Record<string, string> = {};
  for (const [tempId, serverId] of Object.entries(state.idMap)) {
    if (activeTempIds.has(tempId)) {
      nextMap[tempId] = serverId;
    }
  }
  state.idMap = nextMap;
  writeState(state);
}

export function clearListQueue(listId: string): void {
  const state = readState();
  state.mutations = state.mutations.filter(
    (mutation) => mutation.listId !== listId,
  );
  writeState(state);
}
