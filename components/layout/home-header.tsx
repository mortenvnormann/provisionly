import { useTranslations } from "next-intl";

type HomeHeaderProps = {
  greetingName: string;
};

export function HomeHeader({ greetingName }: HomeHeaderProps) {
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");

  return (
    <header className="safe-area-pt font-ui sticky top-0 z-10 shrink-0 bg-[var(--background)]/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--brand)] uppercase">
            {tCommon("appName")}
          </p>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {tHome("greeting", { name: greetingName })}
          </h1>
        </div>
      </div>
    </header>
  );
}
