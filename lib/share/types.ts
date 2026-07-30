export type ListMemberRow = {
  userId: string;
  displayName: string;
  role: string;
  isOwner: boolean;
};

export type ShareLinkResult = {
  url: string;
  expiresAt: string;
};

export type JoinShareResult = {
  type: "list" | "recipe";
  id: string;
};
