/* eslint-disable react-refresh/only-export-components -- provider and its hook belong together */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  /** True when the user picked a theme explicitly (stored in localStorage). */
  isExplicit: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/** localStorage key read by the inline bootstrap script in index.html — keep in sync. */
export const THEME_STORAGE_KEY = "theme";

/** Browser chrome colours; must match --background in src/index.css and index.html. */
export const THEME_COLORS: Record<Theme, string> = {
  light: "#f9f9fa",
  dark: "#131316",
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStored(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia?.(DARK_QUERY).matches
    ? "dark"
    : "light";
}

function initialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  // The inline script in index.html has already applied the class before first paint.
  if (document.documentElement.classList.contains("dark")) return "dark";
  return readStored() ?? systemTheme();
}

function applyTheme(theme: Theme, explicit: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  // With an explicit choice the media-scoped theme-color tags would disagree with the page,
  // so pin both to the chosen theme; otherwise restore the per-scheme defaults.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const scheme: Theme = meta.media.includes("dark") ? "dark" : "light";
    meta.content = THEME_COLORS[explicit ? theme : scheme];
  });
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [isExplicit, setIsExplicit] = useState<boolean>(() =>
    typeof window === "undefined" ? false : readStored() !== null,
  );

  useEffect(() => {
    applyTheme(theme, isExplicit);
  }, [theme, isExplicit]);

  // Follow the OS setting until the user chooses explicitly.
  useEffect(() => {
    if (isExplicit || !window.matchMedia) return;
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => setThemeState(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [isExplicit]);

  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const stored = readStored();
      setIsExplicit(stored !== null);
      setThemeState(stored ?? systemTheme());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable (private mode); the choice still applies for this session
    }
    setIsExplicit(true);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, isExplicit, setTheme, toggleTheme }),
    [theme, isExplicit, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
