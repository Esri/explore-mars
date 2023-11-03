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
import { graphicFromCountry } from "./graphicFromCountry";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { type Polygon, type Point } from "@arcgis/core/geometry";
import {
  PointSymbol3D,
  ObjectSymbol3DLayer,
  TextSymbol3DLayer,
} from "@arcgis/core/symbols";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import PolygonTransform from "./PolygonTransform";
import { EditingInfo } from "../ComparePage";
import AppState from "../../application/AppState";
import styles from "./AddRegion.module.scss";
import { P, match } from "ts-pattern";
import { PolygonWorker } from "./PolygonWorker/PolygonWorker";
interface Region {
  label: Graphic;
  center: Graphic;
  country: Graphic;
  detailed: Polygon;
  simplified: Polygon;
}

@subclass("ExploreMars.page.AddRegionPage")
export class AddRegionPage extends Widget {
  @property()
  sketchViewModel!: SketchViewModel;

  @property()
  get state(): "selecting" | "editing" | "clearing" {
    if (AppState.page === "compare") {
      if (this.placedRegion == null) return "selecting";
      else return "editing";
    } else {
      // this means we are on our way out of the comparison page, we can use this state to ensure the globe doesn't flash for a few frames while the page is changed
      return "clearing";
    }
  }

  @property()
  viewGraphics!: GraphicsLayer;

  @property()
  editingGrapihcs: GraphicsLayer;

  @aliasOf("viewGraphics.graphics")
  graphicEditing: Graphic[] = [];

  @property()
  selectedRegion: Graphic | null = null;

  @property()
  placedRegion: Graphic | null = null;

  @property()
  hovered?: IHandle;

  @property()
  highlight?: IHandle;

  @property()
  hover?: IHandle;

  overlayGlobe?: SceneView | null;

  start() {
    if (this.viewGraphics != null) return;
    this.clear();

    const view = AppState.view;

    const viewGraphics = new GraphicsLayer({
      title: "Country comparison",
      listMode: "hide",
    });
    const editingGraphics = new GraphicsLayer({
      title: "SVM layer for comparison",
      listMode: "hide",
    });

    view.map.layers.addMany([viewGraphics, editingGraphics]);

    const sketchViewModel = new SketchViewModel({
      layer: editingGraphics,
      view,
      defaultUpdateOptions: {
        toggleToolOnClick: false,
        enableScaling: false,
        enableZ: true,
      },
    });

    sketchViewModel.on("delete", () => {
      AppState.page = "home";
      this.clear();
    });

    this.editingGrapihcs = editingGraphics;
    this.viewGraphics = viewGraphics;
    this.sketchViewModel = sketchViewModel;
  }

  render() {
    if (this.state !== "selecting") {
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

    overlayGlobe.on("click", async (e) => {
      try {
        await this.highlightOnClick(e);
      } catch (error) {
        ignoreAbortError(error);
      }
    });

    overlayGlobe.on("pointer-move", async (e) => {
      try {
        await this.highlightOnHover(e);
      } catch (error) {
        ignoreAbortError(error);
      }
    });

    this.overlayGlobe = overlayGlobe;
  }

  private readonly highlightOnHover = promiseUtils.debounce(
    async (e: __esri.ViewPointerMoveEvent) => {
      if (this.overlayGlobe == null) return;

      const graphic = await queryRegion(e, this.overlayGlobe);

      this.hover?.remove();

      if (graphic != null && graphic.layer.type !== "graphics") {
        const layerView = await this.overlayGlobe.whenLayerView(
          graphic.layer as FeatureLayer,
        );
        this.hover = layerView.highlight(graphic);
      }
    },
  );

  private readonly highlightOnClick = promiseUtils.debounce(
    async (e: __esri.ViewClickEvent) => {
      if (this.overlayGlobe == null) return;

      const graphic = await queryRegion(e, this.overlayGlobe);

      this.highlight?.remove();
      if (graphic != null && graphic.layer.type !== "graphics") {
        this.selectedRegion = graphic;
        const layerView = await this.overlayGlobe.whenLayerView(
          graphic.layer as FeatureLayer,
        );
        this.highlight = layerView.highlight(graphic);
      }
    },
  );

  private async addCountry() {
    if (this.selectedRegion == null) {
      return;
    }

    const region = this.selectedRegion;
    this.placedRegion = this.selectedRegion;
    const country = await graphicFromCountry(region, AppState.view);

    const detailed = await PolygonWorker.simplify(
      country.geometry as Polygon,
      1000,
    ); // toSimplified(country.geometry as Polygon, 1000);
    const simplified = await PolygonWorker.simplify(
      country.geometry as Polygon,
    ); // toSimplified(country.geometry as Polygon);
    country.geometry = detailed;

    const center = createRegionCenter(country);
    const label = createRegionLabel(country);
    this.selectedRegion = null;

    this.viewGraphics.addMany([country, label]);
    this.editingGrapihcs.add(center);

    this.viewGraphics.elevationInfo = { mode: "on-the-ground" };

    void AppState.view.goTo(country.geometry);
    void this.sketchViewModel.update(center, {
      enableScaling: false,
    });

    this.addHandles(
      this.sketchViewModel.on(
        "update",
        watchModifications(this.sketchViewModel, {
          country,
          center,
          label,
          detailed,
          simplified,
        }),
      ),
    );
  }

  clear() {
    this.viewGraphics?.removeAll();
    this.editingGrapihcs?.removeAll();
    this.selectedRegion?.destroy();
    this.placedRegion?.destroy();
    this.graphicEditing?.forEach((graphic) => {
      graphic.destroy();
    });
    this.selectedRegion = null;
    this.placedRegion = null;
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
        id: "8e49a0c79bf543fd8fa52b4dd5c9a064",
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

function watchModifications(model: SketchViewModel, region: Region) {
  let lastAngle = 0;
  let totalAngleDiff = 0;
  const view = model.view as SceneView;

  const { country, center, label } = region;

  // for performance reasons, we keep a simplified version of the geometry which will be visible throughout the interaction
  let { detailed, simplified } = region;
  const spherical = new PolygonTransform(view);

  // after the user has stopped interacting with the model
  let commitUpdateTimeout = -1;

  return (ev: __esri.SketchViewModelUpdateEvent) => {
    if (ev.state === "start") return;

    clearTimeout(commitUpdateTimeout);

    match(ev.toolEventInfo)
      .with(
        {
          type: P.union("rotate-start", "rotate-stop", "rotate"),
        },
        ({ type, angle: currentAngle }) => {
          // each "rotate" event gives you the change in the angle relative to the last "rotate-start" event
          // since we're rotating the model on every update, we need to make sure we only apply the difference since the last update
          const diff = currentAngle - lastAngle;
          simplified = spherical.rotate(simplified, diff);
          lastAngle = type === "rotate" ? currentAngle : 0;

          // we also keep track of the total difference, so we can apply the rotation to the detailed geometry later
          totalAngleDiff += diff;
        },
      )
      .with(
        {
          type: P.union("move-start", "move-stop", "move"),
        },
        () => {
          const newCenter = center.geometry as Point;
          simplified = spherical.moveTo(simplified, newCenter);
          label.geometry = newCenter;
        },
      );

    country.geometry = simplified;

    // here we commit the update to the detailed geometry
    commitUpdateTimeout = setTimeout(() => {
      detailed = spherical.moveTo(detailed, center.geometry as Point);
      detailed = spherical.rotate(detailed, totalAngleDiff);
      country.geometry = detailed;
      totalAngleDiff = 0;

      void PolygonWorker.simplify(country.geometry as Polygon).then((simp) => {
        simplified = simp;
      });
    }, 200);
  };
}

function isSceneViewGraphicHit(
  hit: __esri.SceneViewViewHit,
): hit is __esri.SceneViewGraphicHit {
  return hit.type === "graphic";
}

async function queryRegion(
  e: __esri.SceneViewScreenPoint | MouseEvent,
  view: SceneView,
) {
  const include = view.map.allLayers.filter(
    (l) => l.type === "feature" || l.type === "graphics",
  );

  const htResult = await view.hitTest(e, {
    include,
  });

  const results = htResult.results;

  const graphicHits = results.filter(isSceneViewGraphicHit);

  function layerIndex(r: __esri.SceneViewGraphicHit) {
    return include.indexOf(r.graphic.layer);
  }

  if (graphicHits.length > 0) {
    graphicHits.sort((a, b) => {
      // Intentionally reversing order
      return layerIndex(b) - layerIndex(a);
    });

    const graphic = graphicHits[0].graphic;
    const layer = graphic.layer;
    if (layer.type === "feature" && layer instanceof FeatureLayer) {
      const query = layer.createQuery();
      query.returnGeometry = true;
      query.objectIds = [graphic.getObjectId()];
      query.outSpatialReference = graphic.geometry.spatialReference;
      const response = await layer.queryFeatures(query);

      if (response.features.length > 0) {
        return response.features[0];
      }
    }
    return graphic;
  }
}

function ignoreAbortError(error: any) {
  const isAbortError = promiseUtils.isAbortError(error);
  if (isAbortError) return;

  throw error;
}
