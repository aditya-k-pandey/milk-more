import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind plugin for Vite v4+
  ],
  esbuild: {
    jsx: "automatic", // ensures JSX works properly
  },
});
