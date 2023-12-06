import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  base: "/explore-mars/",
  build: {
    target: "es2020",
  },
  assetsInclude: ["**/*.zip", "**/*.gltf"],
});
