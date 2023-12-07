// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error the gltf plugin does not have type definitions
import gltf from "vite-plugin-gltf";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  base: "/explore-mars/",
  build: {
    target: "es2020",
  },
  plugins: [gltf()],
});
