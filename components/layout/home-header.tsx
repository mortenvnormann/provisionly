import { SettingsLink } from "@/components/nav/settings-link";

type HomeHeaderProps = {
  greeting: string;
  showSettings?: boolean;
};

export function HomeHeader({ greeting, showSettings = true }: HomeHeaderProps) {
  return (
    <header className="safe-area-pt sticky top-0 z-10 shrink-0 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--brand)] uppercase">
            Provisionly
          </p>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            Hi, {greeting}
          </h1>
        </div>
        {showSettings ? <SettingsLink /> : null}
      </div>
    </header>
  );
}
