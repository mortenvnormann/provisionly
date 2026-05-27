type AppShellProps = {
  children: React.ReactNode;
};

/** Keeps the mobile-first layout centered on larger screens. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col">
      {children}
    </div>
  );
}
