import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.TRACECHECK_DEV_API_TARGET || "http://127.0.0.1:8787";
  const previewProxyTarget =
    env.TRACECHECK_PREVIEW_API_TARGET ||
    env.TRACECHECK_DEV_API_TARGET ||
    "http://127.0.0.1:8787";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target: previewProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
