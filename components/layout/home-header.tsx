import { useTranslations } from "next-intl";

type HomeHeaderProps = {
  greetingName: string;
};

export function HomeHeader({ greetingName }: HomeHeaderProps) {
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");

  return (
    <header className="safe-area-pt sticky top-0 z-10 shrink-0 bg-[var(--background)]/95">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
        <div>
          <p className="font-ui text-[11px] font-medium tracking-[0.12em] text-[var(--brand)] uppercase">
            {tCommon("appName")}
          </p>
          <h1 className="heading-editorial text-[1.375rem] leading-tight text-[var(--foreground)]">
            {tHome("greeting", { name: greetingName })}
          </h1>
        </div>
      </div>
    </header>
  );
}
