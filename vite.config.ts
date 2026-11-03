import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { sandboxWorkerPlugin } from "./vite/sandbox-worker-plugin.ts"

const config = defineConfig({
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
  optimizeDeps: {
    include: [
      "@tanstack/ai-react",
      "@tanstack/ai-client",
      "react-markdown",
      "remark-gfm",
    ],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    sandboxWorkerPlugin(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
