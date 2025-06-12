` section below.

**Explanation of Changes:**  
- Changed the `host` value inside the `server` configuration from `"::"` to `"localhost"`.
- No other parts of the codebase were affected since no other logic depends on the network binding.
- This ensures the dev server only listens for connections originating from the development machine, mitigating external access risks.

**Potential Impacts:**  
- Developers who explicitly need external hosts (e.g., real device testing on the same LAN) must update the `host` setting manually for that session.
- The development experience for standard local development is unchanged.
- No new dependencies were introduced.
</explanation>

<patch>
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/',
  build: {
    outDir: 'docs',
  },
}));