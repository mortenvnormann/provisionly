type FloatingCreateDockProps = {
  children: React.ReactNode;
};

export function FloatingCreateDock({ children }: FloatingCreateDockProps) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-transparent"
      />
      <div className="safe-area-pb pointer-events-auto fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
        {children}
      </div>
    </>
  );
}

/** Scroll padding below list content — use tall when create form is open. */
export function floatingDockScrollPadding(tall?: boolean) {
  return tall ? "pb-44" : "pb-32";
}
