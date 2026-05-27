import Link from "next/link";

type AppNavProps = {
  active: "lists" | "recipes";
  isGuest?: boolean;
};

export function AppNav({ active, isGuest = false }: AppNavProps) {
  if (isGuest) {
    return (
      <nav className="flex gap-1 rounded-xl bg-[var(--muted)] p-1">
        <span className="flex-1 rounded-lg bg-[var(--surface)] px-3 py-2 text-center text-sm font-medium text-[var(--foreground)] shadow-sm">
          Lists
        </span>
        <span
          className="flex-1 rounded-lg px-3 py-2 text-center text-sm text-[var(--muted-foreground)]"
          title="Create an account to use recipes"
        >
          Recipes
        </span>
      </nav>
    );
  }

  return (
    <nav className="flex gap-1 rounded-xl bg-[var(--muted)] p-1">
      <Link
        href="/home"
        className={[
          "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
          active === "lists"
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        ].join(" ")}
      >
        Lists
      </Link>
      <Link
        href="/recipes"
        className={[
          "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
          active === "recipes"
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        ].join(" ")}
      >
        Recipes
      </Link>
    </nav>
  );
}
