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
import Graphic from "@arcgis/core/Graphic";
import WebScene from "@arcgis/core/WebScene";
import {
  aliasOf,
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import * as promiseUtils from "@arcgis/core/core/promiseUtils";
import SceneView from "@arcgis/core/views/SceneView";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { graphicFromCountry } from "./countryUtils";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { type Point, type Polygon } from "@arcgis/core/geometry";
import {
  PointSymbol3D,
  ObjectSymbol3DLayer,
  TextSymbol3DLayer,
} from "@arcgis/core/symbols";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import PolygonTransform from "./PolygonTransform";
import { EditingInfo, compareRoute } from "./ComparePage";
import AppState from "../application/AppState";
import styles from "./AddRegion.module.scss";

interface Region {
  label: Graphic;
  center: Graphic;
  country: Graphic;
}

const viewGraphics = new GraphicsLayer({
  title: "Country comparison",
  listMode: "hide",
  elevationInfo: {
    mode: "on-the-ground",
  },
});

const editingGraphics = new GraphicsLayer({
  title: "SVM layer for comparison",
  listMode: "hide",
  elevationInfo: {
    mode: "on-the-ground",
  },
});

@subclass("ExploreMars.page.AddRegionPage")
export class AddRegionPage extends Widget {
  @property()
  state: "selecting" | "editing" = "selecting";

  @property()
  sketchViewModel = new SketchViewModel({
    view: AppState.view,
    layer: editingGraphics,
    defaultUpdateOptions: {
      toggleToolOnClick: false,
      enableScaling: false,
      enableZ: true,
    },
  });

  @property()
  selectedRegion: Promise<Graphic> | null = null;

  @property()
  highlight?: IHandle;

  overlayGlobe?: SceneView | null;

  postInitialize(): void {
    const view = AppState.view;
    view.map.layers.addMany([viewGraphics, editingGraphics]);

    this.sketchViewModel.on("delete", () => {
      this.clear();
      if (
        AppState.route.children?.match(compareRoute) &&
        compareRoute.path === "regions"
      ) {
        AppState.route.children.back();
      }
    });
  }

  render() {
    if (compareRoute.state !== "selecting") {
      return (
        <div>
          <EditingInfo />
        </div>
      );
    }

    return (
      <div class={styles.container}>
        <p>Select a region on the globe</p>
        <div
          class={styles.globeView}
          afterCreate={(element: HTMLDivElement) => {
            this.createView(element);
          }}
        ></div>
        <button
          class="esri-button esri-button--primary"
          disabled={this.selectedRegion == null}
          onclick={async () => {
            const country = await this.selectedRegion;
            if (country) {
              await this.clear();
              void AppState.load(this.addCountry(country));
            }
          }}
        >
          Place it on Mars
        </button>
      </div>
    );
  }

  private createView(element: HTMLDivElement) {
    const overlayGlobe = new SceneView(createGlobeConfig(element));

    const handle = overlayGlobe.on(
      "click",
      promiseUtils.debounce(async (e) => {
        this.highlight?.remove();

        let resolveSelectedRegion: (
          value: Graphic | PromiseLike<Graphic>,
        ) => void;
        const promise = new Promise<Graphic>((resolve) => {
          resolveSelectedRegion = resolve;
        });
        this.selectedRegion = promise;

        const hitTest = await overlayGlobe.hitTest(e);

        if (hitTest.results.length > 0) {
          const result = hitTest.results[hitTest.results.length - 1];
          if (result.type === "graphic") {
            const layerView = await overlayGlobe.whenLayerView(
              result.graphic.layer as FeatureLayer,
            );
            this.highlight = layerView.highlight(result.graphic);
            const country = await graphicFromCountry(
              result.graphic,
              AppState.view,
            );
            resolveSelectedRegion!(country);
          }
        }
      }),
    );

    this.addHandles(handle);

    this.overlayGlobe = overlayGlobe;
  }

  private async addCountry(country: Graphic) {
    compareRoute.state = "editing";

    const center = createRegionCenter(country);
    const label = createRegionLabel(country);

    this.clear();

    viewGraphics.addMany([country, label]);
    editingGraphics.add(center);
    country.addHandles([
      this.sketchViewModel.on(
        "update",
        watchRotation({ country, center, label }),
      ),
      AppState.view.on("click", async (event) => {
        const hitTest = await AppState.view.hitTest(event);
        const isHit = hitTest.results.some((result) => {
          return result.type === "graphic" && result.graphic === country;
        });

        if (isHit)
          void this.sketchViewModel.update(center, {
            enableScaling: false,
          });
      }),
    ]);

    void AppState.view.goTo(country);
    void this.sketchViewModel.update(center, {
      enableScaling: false,
    });
  }

  clear() {
    viewGraphics.removeAll();
    editingGraphics.removeAll();
    this.selectedRegion = null;
  }
}

function createGlobeConfig(
  container: HTMLDivElement,
): __esri.SceneViewProperties {
  return {
    container,
    qualityProfile: "high",
    map: new WebScene({
      portalItem: {
        id: "df5009a0ea79444e92f48f50fe171bf1",
      },
    }),
    alphaCompositingEnabled: true,
    environment: {
      atmosphereEnabled: false,
      starsEnabled: false,
      background: {
        type: "color",
        color: [255, 255, 255, 0],
      },
    },
    constraints: {
      altitude: {
        min: 0,
        max: 25512548 * 4,
      },
    },
    ui: {
      components: [],
    },
    popupEnabled: false,
    highlightOptions: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      color: "rgba(207, 88, 25, 0.5)",
    },
  };
}

function createRegionCenter(country: Graphic): Region["center"] {
  const centroid = (country.geometry as Polygon).centroid;

  return new Graphic({
    geometry: centroid,
    symbol: new PointSymbol3D({
      symbolLayers: [
        new ObjectSymbol3DLayer({
          material: {
            color: "white",
          },
          width: 5_000,
          height: 5_000,
          depth: 5_000,
          resource: {
            primitive: "diamond",
          },
        }),
      ],
    }),
  });
}

function createRegionLabel(country: Graphic): Region["label"] {
  const centroid = (country.geometry as Polygon).centroid;

  return new Graphic({
    geometry: centroid,
    symbol: new PointSymbol3D({
      symbolLayers: [
        new TextSymbol3DLayer({
          text: country.getAttribute("label"),
          material: {
            color: [0, 0, 0, 0.9],
          },
          halo: {
            size: 2,
            color: [255, 255, 255, 0.7],
          },
          font: {
            size: 10,
          },
        }),
      ],
      verticalOffset: {
        screenLength: 40,
        maxWorldLength: 500000,
        minWorldLength: 0,
      },
      callout: {
        type: "line",
        size: 0.5,
        color: [255, 255, 255, 0.9],
        border: {
          color: [0, 0, 0, 0.3],
        },
      },
    }),
  });
}

function watchRotation(region: Region) {
  let lastAngle = 0;
  const view = AppState.view;

  const { country, center, label } = region;
  const spherical = new PolygonTransform(view);
  return (ev: __esri.SketchViewModelUpdateEvent) => {
    if (ev.state !== "active") {
      return;
    }

    const toolType = ev.toolEventInfo.type;
    const rotateStartStop =
      toolType === "rotate-stop" || toolType === "rotate-start";
    let current = country.geometry as Polygon;

    if (toolType === "rotate" || rotateStartStop) {
      const currentAngle = (ev.toolEventInfo as __esri.RotateEventInfo).angle;
      const angleDiff = (currentAngle - lastAngle) * (Math.PI / 180);

      current = spherical.rotate(current, angleDiff);
      lastAngle = rotateStartStop ? 0 : currentAngle;
    } else {
      const newCenter = center.geometry as Point;
      current = spherical.moveTo(current, newCenter);
      label.geometry = newCenter;
    }
    country.geometry = current;
  };
}
