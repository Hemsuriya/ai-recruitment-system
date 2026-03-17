import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 config
 * -------------------------------------------------
 * Primary theming is done via @theme {} in:
 *   src/styles/globals.css
 *
 * This file can be referenced in CSS via:
 *   @config "../tailwind.config.ts";
 *
 * Use this file for JS-based theme extensions,
 * custom plugins, or safelist entries.
 * -------------------------------------------------
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
