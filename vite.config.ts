import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Vendor chunk groups (IMPROVEMENT_PLAN.md P1-14). Heavy libraries get their own long-cacheable chunk so
 * that route chunks stay small and a change in app code does not invalidate vendor bytes. jspdf and
 * html-to-image are only ever reached through dynamic import() in the export handlers, so their chunks
 * load on demand. Anything not listed (react-syntax-highlighter, react-helmet, …) is left to Rollup.
 */
const VENDOR_CHUNKS: ReadonlyArray<readonly [name: string, pattern: RegExp]> = [
  [
    "react",
    /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run\/router)\//,
  ],
  ["radix-ui", /node_modules\/(@radix-ui|@floating-ui)\//],
  // d3-* is shared by d3, d3-sankey, recharts (via victory-vendor) and @xyflow (zoom/drag/selection).
  ["d3", /node_modules\/(d3|d3-[^/]+|internmap|delaunator|robust-predicates)\//],
  ["recharts", /node_modules\/(recharts|recharts-scale|victory-vendor)\//],
  ["xyflow", /node_modules\/(@xyflow|@dagrejs)\//],
  ["jspdf", /node_modules\/(jspdf|jspdf-autotable)\//],
  ["html-to-image", /node_modules\/html-to-image\//],
  ["lucide-react", /node_modules\/lucide-react\//],
  // Tiny helpers used by the app shell and by several vendor groups. Unassigned, Rollup may absorb them
  // into whichever lazy chunk (recharts, jspdf) happens to import them, and the entry then loads that
  // whole chunk for a 200-byte function (clsx did exactly that).
  [
    "react",
    /node_modules\/(clsx|tailwind-merge|class-variance-authority|tslib|@babel\/runtime|prop-types|react-is|object-assign|loose-envify)\//,
  ],
];

function manualChunks(id: string): string | undefined {
  // Rollup/Vite helper modules (zero imports) are needed by the entry chunk and by every vendor chunk.
  // Left unassigned they get absorbed into a lazy vendor chunk (jspdf, recharts), which would then
  // load eagerly just for a one-line helper. Pin them to the always-loaded react chunk instead.
  if (id.includes("vite/preload-helper") || id.includes("commonjsHelpers")) return "react";
  if (!id.includes("node_modules")) return undefined;
  return VENDOR_CHUNKS.find(([, pattern]) => pattern.test(id))?.[0];
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
  build: {
    outDir: "docs",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: { manualChunks },
    },
  },
}));
