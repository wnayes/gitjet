import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig } from "vite";
import { pluginExposeRenderer } from "./vite.base.config";
import { resolve } from "path";

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<"renderer">;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? "";
  return {
    root,
    mode,
    base: "./",
    build: {
      rollupOptions: {
        input: {
          blame: resolve(__dirname, "src", "renderer", "blame", "index.html"),
          log: resolve(__dirname, "src", "renderer", "log", "index.html"),
        },
      },
      outDir: `.vite/renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  } as UserConfig;
});
