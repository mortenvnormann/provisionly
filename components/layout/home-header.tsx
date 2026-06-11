import { SettingsLink } from "@/components/nav/settings-link";
import { useTranslations } from "next-intl";

type HomeHeaderProps = {
  greetingName: string;
  showSettings?: boolean;
};

export function HomeHeader({ greetingName, showSettings = true }: HomeHeaderProps) {
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");

  return (
    <header className="safe-area-pt sticky top-0 z-10 shrink-0 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--brand)] uppercase">
            {tCommon("appName")}
          </p>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {tHome("greeting", { name: greetingName })}
          </h1>
        </div>
        {showSettings ? <SettingsLink /> : null}
      </div>
    </header>
  );
}
