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
import { EditingInfo } from "./ComparePage";
import AppState from "../application/AppState";
import styles from "./AddRegion.module.scss";

interface Region {
  label: Graphic;
  center: Graphic;
  country: Graphic;
}

@subclass("ExploreMars.page.AddRegionPage")
export class AddRegionPage extends Widget {
  @property()
  sketchViewModel!: SketchViewModel;

  @property()
  viewGraphics!: GraphicsLayer;

  @aliasOf("viewGraphics.graphics")
  graphicEditing: Graphic[] = [];

  @property()
  selectedRegion: Graphic | null = null;

  @property()
  placedRegion: Graphic | null = null;

  @property()
  highlight?: IHandle;

  overlayGlobe?: SceneView | null;

  start() {
    if (this.viewGraphics != null) return;
    const view = AppState.view;

    const graphics = new GraphicsLayer({
      title: "SVM layer for comparison",
      listMode: "hide",
    });

    view.map.layers.add(graphics);

    const sketchViewModel = new SketchViewModel({
      layer: graphics,
      view,
      defaultUpdateOptions: {
        toggleToolOnClick: false,
        enableScaling: false,
        enableZ: true,
      },
    });

    sketchViewModel.on("delete", () => {
      this.destroy();
    });

    this.viewGraphics = graphics;
    this.sketchViewModel = sketchViewModel;
  }

  render() {
    if (this.placedRegion != null) {
      return <EditingInfo />;
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
          onclick={() => {
            void AppState.load(this.addCountry());
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
        const hitTest = await overlayGlobe.hitTest(e);

        if (hitTest.results.length > 0) {
          const result = hitTest.results[hitTest.results.length - 1];
          if (result.type === "graphic") {
            this.selectedRegion = result.graphic;
            const layerView = await overlayGlobe.whenLayerView(
              result.graphic.layer as FeatureLayer,
            );
            this.highlight = layerView.highlight(result.graphic);
          }
        }
      }),
    );

    this.addHandles(handle);

    this.overlayGlobe = overlayGlobe;
  }

  private async addCountry() {
    if (this.selectedRegion == null) {
      return;
    }

    const region = this.selectedRegion;
    this.placedRegion = this.selectedRegion;
    const country = await graphicFromCountry(region, AppState.view);

    const center = createRegionCenter(country);
    const label = createRegionLabel(country);
    this.selectedRegion = null;

    this.viewGraphics.addMany([center, country, label]);

    this.viewGraphics.elevationInfo = { mode: "on-the-ground" };

    void AppState.view.goTo(country.geometry);
    void this.sketchViewModel.update(center, {
      enableScaling: false,
    });

    this.addHandles(
      this.sketchViewModel.on(
        "update",
        watchRotation(this.sketchViewModel, { country, center, label }),
      ),
    );
  }

  clear() {
    this.viewGraphics?.removeAll();
    this.selectedRegion?.destroy();
    this.placedRegion?.destroy();
    this.graphicEditing.forEach((graphic) => {
      graphic.destroy();
    });
    this.selectedRegion = null;
    this.placedRegion = null;
  }

  destroy(): void {
    this.sketchViewModel.cancel();
    this.graphicEditing.forEach((graphic) => {
      graphic.destroy();
    });
    this.viewGraphics.removeAll();

    this.overlayGlobe?.destroy();
    this.selectedRegion?.destroy();
    this.placedRegion?.destroy();

    if (!this.sketchViewModel.destroyed) this.sketchViewModel.destroy();

    this.viewGraphics.destroy();
    super.destroy();
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

function watchRotation(model: SketchViewModel, region: Region) {
  let lastAngle = 0;
  const view = model.view as SceneView;

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
      const infoAngle = (ev.toolEventInfo as __esri.RotateEventInfo).angle;
      const angle = infoAngle - lastAngle;

      current = spherical.rotate(current, angle);
      lastAngle = rotateStartStop ? 0 : infoAngle;
    } else {
      const newCenter = center.geometry as Point;
      current = spherical.moveTo(current, newCenter);
      label.geometry = newCenter;
    }
    country.geometry = current;
  };
}
