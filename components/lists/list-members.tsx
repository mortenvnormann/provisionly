import type { ListMemberRow } from "@/lib/share/types";
import { useTranslations } from "next-intl";

type ListMembersProps = {
  members: ListMemberRow[];
  currentUserId?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function ListMembers({ members, currentUserId }: ListMembersProps) {
  const tLists = useTranslations("lists");

  if (members.length <= 1) return null;

  return (
    <div className="border-b border-[var(--border)] px-4 py-2">
      <p className="mb-2 text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
        {tLists("sharedWith")}
      </p>
      <ul className="flex flex-wrap gap-2">
        {members.map((member) => {
          const isYou = member.userId === currentUserId;
          const label = isYou ? tLists("you") : member.displayName;
          return (
            <li
              key={member.userId}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)]"
            >
              <span
                className="flex size-6 items-center justify-center rounded-full bg-[var(--secondary)]/20 text-[10px] font-semibold text-[var(--secondary)]"
                aria-hidden
              >
                {initials(member.displayName)}
              </span>
              <span>
                {label}
                {member.isOwner ? ` · ${tLists("owner")}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
