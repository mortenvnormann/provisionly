"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type TabId = "lists" | "recipes";

export type TabNavigation = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
};

export type DockActionSlot = {
  visible: boolean;
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export type DockFormActions = {
  visible: boolean;
  cancelLabel: string;
  saveLabel: string;
  saving?: boolean;
  saveDisabled?: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export type DockPageHandlers = {
  sortVisible?: boolean;
  sortActive?: boolean;
  onSort?: () => void;
  action?: DockActionSlot | null;
  addVisible?: boolean;
  onAdd?: () => void;
  createFormOpen?: boolean;
  formActions?: DockFormActions | null;
};

type DockContextValue = {
  handlers: DockPageHandlers | null;
  setHandlers: (handlers: DockPageHandlers | null) => void;
  lastMainTab: TabId;
  setLastMainTab: (tab: TabId) => void;
  tabNavigation: TabNavigation | null;
  setTabNavigation: (navigation: TabNavigation | null) => void;
  isGuest: boolean;
  setIsGuest: (guest: boolean) => void;
};

const DockContext = createContext<DockContextValue | null>(null);

export function DockProvider({ children }: { children: React.ReactNode }) {
  const [handlers, setHandlersState] = useState<DockPageHandlers | null>(null);
  const [lastMainTab, setLastMainTab] = useState<TabId>("lists");
  const [tabNavigation, setTabNavigationState] = useState<TabNavigation | null>(
    null,
  );
  const [isGuest, setIsGuest] = useState(false);

  const setHandlers = useCallback((next: DockPageHandlers | null) => {
    setHandlersState(next);
  }, []);

  const setTabNavigation = useCallback((next: TabNavigation | null) => {
    setTabNavigationState(next);
  }, []);

  const value = useMemo(
    () => ({
      handlers,
      setHandlers,
      lastMainTab,
      setLastMainTab,
      tabNavigation,
      setTabNavigation,
      isGuest,
      setIsGuest,
    }),
    [
      handlers,
      setHandlers,
      lastMainTab,
      tabNavigation,
      setTabNavigation,
      isGuest,
    ],
  );

  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

export function useDock() {
  const ctx = useContext(DockContext);
  if (!ctx) {
    throw new Error("useDock must be used within DockProvider");
  }
  return ctx;
}

export function useDockOptional() {
  return useContext(DockContext);
}

/** Register page-specific dock handlers; cleared on unmount. */
export function useRegisterDock(handlers: DockPageHandlers | null) {
  const dock = useDockOptional();
  const setHandlers = dock?.setHandlers;

  useEffect(() => {
    if (!setHandlers) return;
    setHandlers(handlers);
    return () => setHandlers(null);
  }, [setHandlers, handlers]);
}
