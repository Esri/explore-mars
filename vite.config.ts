/* Copyright 2023 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { comparisonModes, measurementTools, panels } from "./src/application/panels";

export default defineConfig({
  plugins: [
    react({ compiler: true }),
    {
      name: "panel-entry-points",
      enforce: "post",
      generateBundle(_, bundle) {
        const index = bundle["index.html"];
        if (!index || index.type !== "asset") {
          this.error("The application entry page was not generated.");
        }
        const entries = [
          ...Object.values(panels),
          ...Object.values(measurementTools),
          ...Object.values(comparisonModes),
        ];
        for (const { to } of entries) {
          this.emitFile({
            type: "asset",
            fileName: `${to.slice(1)}/index.html`,
            source: index.source,
          });
        }
        this.emitFile({ type: "asset", fileName: "404.html", source: index.source });
      },
    },
  ],
  worker: { format: "es" },
  assetsInclude: ["**/*.zip", "**/*.gltf"],
});
