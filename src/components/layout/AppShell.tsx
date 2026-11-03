import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteHeader } from "./Header";
import { MobileNav } from "./MobileNav";
import { PageSkeleton } from "./Skeletons";
import { ShellContext, type ShellSectionInfo } from "./shellContext";
import { useRouteFadeIn } from "./useRouteTransition";

/**
 * Persistent chrome for every content route: skip link, Header and mobile drawer stay mounted
 * outside the route Suspense boundary, so they never disappear while a page chunk loads.
 * Pages render inside <PageLayout> (metadata, section rail, main, footer).
 */
export function AppShell() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sectionInfo, setSectionInfoState] = useState<ShellSectionInfo | null>(null);
  const fadeRef = useRouteFadeIn<HTMLDivElement>(pathname);

  const setSectionInfo = useCallback((info: ShellSectionInfo | null) => {
    setSectionInfoState((prev) =>
      prev?.section === info?.section && prev?.activeId === info?.activeId ? prev : info,
    );
  }, []);

  // Close the drawer on navigation.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const value = useMemo(
    () => ({ sectionInfo, setSectionInfo, drawerOpen, setDrawerOpen }),
    [sectionInfo, setSectionInfo, drawerOpen],
  );

  return (
    <ShellContext.Provider value={value}>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <SiteHeader onMenuToggle={() => setDrawerOpen((o) => !o)} menuOpen={drawerOpen} />
      <MobileNav open={drawerOpen} onOpenChange={setDrawerOpen} sectionInfo={sectionInfo} />
      <div ref={fadeRef}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
    </ShellContext.Provider>
  );
}

export default AppShell;
