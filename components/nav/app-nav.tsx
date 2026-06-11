import Link from "next/link";
import { useTranslations } from "next-intl";

type AppNavProps = {
  active: "lists" | "recipes";
  isGuest?: boolean;
};

export function AppNav({ active, isGuest = false }: AppNavProps) {
  const t = useTranslations("nav");

  if (isGuest) {
    return (
      <nav className="flex gap-1 rounded-xl bg-[var(--muted)] p-1">
        <span className="flex-1 rounded-lg bg-[var(--surface)] px-3 py-2 text-center text-sm font-medium text-[var(--foreground)] shadow-sm">
          {t("lists")}
        </span>
        <span
          className="flex-1 rounded-lg px-3 py-2 text-center text-sm text-[var(--muted-foreground)]"
          title={t("guestRecipesHint")}
        >
          {t("recipes")}
        </span>
      </nav>
    );
  }

  return (
    <nav className="flex gap-1 rounded-xl bg-[var(--muted)] p-1">
      <Link
        href="/home"
        transitionTypes={active === "recipes" ? ["nav-back"] : undefined}
        className={[
          "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
          active === "lists"
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        ].join(" ")}
      >
        {t("lists")}
      </Link>
      <Link
        href="/recipes"
        transitionTypes={active === "lists" ? ["nav-forward"] : undefined}
        className={[
          "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
          active === "recipes"
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        ].join(" ")}
      >
        {t("recipes")}
      </Link>
    </nav>
  );
}
