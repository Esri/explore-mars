// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error the gltf plugin does not have type definitions
import gltf from "vite-plugin-gltf";
import { defineConfig } from "vite";
import {
  dedup,
  draco,
  prune,
  textureCompress,
} from "@gltf-transform/functions";
import sharp from "sharp";

export default defineConfig({
  server: {
    port: 3000,
  },
  base: "/explore-mars/",
  build: {
    target: "es2020",
  },
  plugins: [
    gltf({
      transforms: [
        // remove unused resources
        prune(),
        // combine duplicated resources
        dedup(),
        textureCompress({ encoder: sharp, resize: [2048, 2048] }),
        // compress mesh geometry
        draco(),
      ],
    }),
  ],
});
