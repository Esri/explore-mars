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
import "@arcgis/map-components/components/arcgis-basemap-toggle";
import Handles from "@arcgis/core/core/Handles";
import * as promiseUtils from "@arcgis/core/core/promiseUtils";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import type SceneView from "@arcgis/core/views/SceneView";
import { tsx } from "@arcgis/core/widgets/support/widget";
import {
  marsHiRiseImagery,
  marsImageryBasemap,
  shadedReliefBasemap,
} from "../utilities/layers";
import AppState from "./AppState";

const basemapHandles = new Handles();
let activeView: SceneView | null | undefined;

async function updateHiRiseVisibility(view: SceneView) {
  await view.when();

  const map = view.map;

  if (map == null) {
    return;
  }

  const result = await view.hitTest(
    { x: view.width / 2, y: view.height / 2 },
    { include: [map.ground] },
  );

  const groundResult = result.ground;

  const distance =
    groundResult?.mapPoint != null
      ? (groundResult.distance ?? Number.MAX_VALUE)
      : Number.MAX_VALUE;

  marsHiRiseImagery.visible = distance < 10000;
}

function initializeBasemapBehavior(view: SceneView | null | undefined) {
  if (view == null || view === activeView) {
    return;
  }

  basemapHandles.removeAll();
  activeView = view;

  const debouncedUpdateHiRiseVisibility = promiseUtils.debounce(
    updateHiRiseVisibility,
  );

  basemapHandles.add([
    reactiveUtils.watch(
      () => view.map?.basemap,
      () => {
        view.environment.atmosphereEnabled =
          view.map?.basemap === marsImageryBasemap;
      },
      { initial: true },
    ),
    reactiveUtils.when(
      () => view.stationary,
      () => {
        void debouncedUpdateHiRiseVisibility(view);
      },
    ),
  ]);

  void debouncedUpdateHiRiseVisibility(view);
}

export function BasemapSwitcher() {
  initializeBasemapBehavior(AppState.view);

  return (
    <arcgis-basemap-toggle
      class="explore-mars-basemap-toggle"
      view={AppState.view}
      nextBasemap={shadedReliefBasemap}
    />
  );
}