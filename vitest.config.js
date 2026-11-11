import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    // .env-файлы ищутся в tests/, где их нет: тесты не видят настоящие ключи из .env.local.
    envDir: "./tests",
    test: { environment: "jsdom", setupFiles: ["./tests/setup.js"] },
  }),
);
