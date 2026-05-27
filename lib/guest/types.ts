export type GuestListItem = {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
  categoryId?: string;
  sortKey?: string;
};

export type GuestList = {
  id: string;
  title: string;
  items: GuestListItem[];
  updatedAt: string;
  groupByCategory?: boolean;
};
