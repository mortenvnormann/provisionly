type AppShellProps = {
  children: React.ReactNode;
};

/** Keeps the mobile-first layout centered on larger screens. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
