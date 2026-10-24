import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/linear-algebra-calculator/",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [".monkeycode-ai.online"],
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: [".monkeycode-ai.online"],
  },
});
