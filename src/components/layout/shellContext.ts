import { createContext, useContext } from "react";

/** Sections that have a browsable entity list (SectionRail on lg+, drawer group on mobile). */
export type LayoutSection = "components" | "threats" | "controls" | "architectures";

export interface ShellSectionInfo {
  section: LayoutSection;
  activeId?: string;
}

export interface ShellContextValue {
  /** The section the current page registered via PageLayout (null when none). */
  sectionInfo: ShellSectionInfo | null;
  setSectionInfo: (info: ShellSectionInfo | null) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

export const ShellContext = createContext<ShellContextValue | null>(null);

/** Shell state, or null when rendered outside AppShell (e.g. the full-screen modeler route). */
export function useShell(): ShellContextValue | null {
  return useContext(ShellContext);
}
