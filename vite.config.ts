import { defineConfig, PluginOption } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util", "@ffmpeg/core"],
  },
  plugins: [react()] as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    // Ensure proper memory handling for large files
    rollupOptions: {
      output: {
        manualChunks: {
          ffmpeg: ["@ffmpeg/ffmpeg", "@ffmpeg/core"],
        },
      },
    },
  },
}))
