import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
	plugins: [vue()],
	base: "/rmat-dashboard/", // Already set for GitHub Pages
});
