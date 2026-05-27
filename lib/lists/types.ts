export type ListSummary = {
  id: string;
  title: string;
  updatedAt: string;
  isOwner: boolean;
};

export type ListSettings = {
  groupByCategory: boolean;
};

export type ListItemRow = {
  id: string;
  listId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  categoryId: string | null;
  checked: boolean;
  sortKey: string;
};

export type CategoryRow = {
  id: string;
  slug: string;
  sortOrder: number;
  color: string;
  labels: Record<string, string>;
};
