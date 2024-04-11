import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import AreaMeasurement3D from "@arcgis/core/widgets/AreaMeasurement3D";
import DirectLineMeasurement3D from "@arcgis/core/widgets/DirectLineMeasurement3D";
import ElevationProfile from "@arcgis/core/widgets/ElevationProfile";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { match } from "ts-pattern";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./MeasurePages.module.scss";
import { CloseButton } from "../utility-components/close-button/CloseButton";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import AppState, { Route } from "../application/AppState";

import "./esri-measurement-widget-overwrites.scss";
import ElevationProfileLineQuery from "@arcgis/core/widgets/ElevationProfile/ElevationProfileLineQuery";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
import { Mesh, Multipoint } from "@arcgis/core/geometry";
import ElevationSampler from "@arcgis/core/layers/support/ElevationSampler";
import ElevationProfileViewModel from "@arcgis/core/widgets/ElevationProfile/ElevationProfileViewModel";

type Page = "menu" | "area" | "line" | "elevation";

export const MeasureRoute = new Route({
  route: "measure",
  path: "menu",
  paths: ["line", "area", "elevation"],
});

declare const x: ElevationProfile;

@subclass("ExploreMars.page.Measure")
export class MeasurePage extends Widget {
  @property()
  page: Page = "menu";

  @property()
  meshSampler?: ElevationSampler;

  @property()
  mesh?: Mesh;

  @property()
  get elevationProfile() {
    const meshSampler = this.meshSampler;
    const mesh = this.mesh;
    return new ElevationProfileLineQuery({
      color: "rgb(0,255,0)",
      source: {
        async queryElevation(point) {
          const modelSamplePromise = meshSampler?.queryElevation(
            point,
          ) as Multipoint;
          const groundSamplePromise =
            AppState.view.map.ground.queryElevation(point);

          const [modelSample, groundSample] = await Promise.all([
            modelSamplePromise,
            groundSamplePromise,
          ]);

          const finalSample = groundSample.geometry.clone() as Multipoint;

          if (modelSample) {
            const getMeshHeightAdjustment = (z: number) => {
              const isMissingData = !Number.isFinite(z) && 0 > z;
              return !isMissingData ? z + mesh!.vertexSpace.origin[2] : 0;
            }

            const adjustedPoints = finalSample.points.map(([x, y, z], i) => [
              x,
              y,
              Math.max(z, z + getMeshHeightAdjustment(modelSample.points?.[i]?.[2])),
            ]);
            finalSample.points = adjustedPoints;
          }

          return { geometry: finalSample, noDataValue: 0 };
        },
      },
    });
  }

  constructor() {
    super();
    const watchPage = reactiveUtils.watch(
      () => MeasureRoute.path,
      (page) => {
        if (page === "menu") {
          AppState.status = "idle";
        } else {
          AppState.status = "editing";
        }
      },
    );

    const watchModelGraphic = reactiveUtils.watch(
      () => {
        const layer = AppState.view.map.layers.find(
          (layer) => layer.id === "add-object",
        ) as GraphicsLayer;
        const graphic = layer?.graphics.getItemAt(0);
        return graphic?.geometry as Mesh;
      },
      async (mesh) => {
        if (mesh != null)
          this.meshSampler = await meshUtils.createElevationSampler(mesh, {
            noDataValue: -Infinity,
          });
        this.mesh = mesh;
      },
      { initial: true },
    );

    this.addHandles([watchPage, watchModelGraphic]);
  }

  render() {
    if (MeasureRoute.path === "menu") {
      return (
        <div styles={{ display: "contents" }}>
          <MeasureMenu
            selectTool={(tool) => {
              MeasureRoute.push(tool);
            }}
          />
        </div>
      );
    }

    const tool = match(MeasureRoute.path)
      .with("area", () => (
        <AreaMeasurement3D
          //@ts-ignore
          afterCreate={(node) => {
            node.viewModel.start();
          }}
          view={AppState.view}
        />
      ))
      .with("elevation", () => (
        <ElevationProfile
          //@ts-ignore
          afterCreate={(node) => {
            const vm = (node.viewModel as ElevationProfileViewModel);
            vm.start();
            (vm).addHandles(
              reactiveUtils.watch(
                () => {
                  const layer = AppState.view.map.layers.find(
                    (layer) => layer.id === "add-object",
                  ) as GraphicsLayer;
                  const graphic = layer?.graphics.getItemAt(0);
                  return graphic?.geometry as Mesh;
                },
                async () => {
                  vm.input = vm.input.clone();
                })
            )
          }
          }
          view={AppState.view}
          profiles={[this.elevationProfile]}
          visibleElements={{
            legend: false,
          }}
        />
      ))
      .with("line", () => (
        <DirectLineMeasurement3D
          //@ts-ignore
          afterCreate={(node) => {
            node.viewModel.start();
          }}
          view={AppState.view}
        />
      ))
      .run();

    return (
      <div styles={{ display: "contents" }}>
        <div class={styles.measurement}>
          <CloseButton
            onClose={() => {
              this.close();
            }}
          />
          {tool}
        </div>
      </div>
    );
  }

  close() {
    MeasureRoute.reset();
    AppState.route.back();
  }
}

interface MeasureMenuProps {
  selectTool: (tool: Exclude<Page, "menu">) => void;
}
function MeasureMenu({ selectTool }: MeasureMenuProps) {
  return (
    <SubMenu
      items={[
        <Item
          text="Line"
          itemClass={styles.line}
          onClick={() => {
            selectTool("line");
          }}
        />,
        <Item
          text="Area"
          itemClass={styles.area}
          onClick={() => {
            selectTool("area");
          }}
        />,
        <Item
          text="Elevation"
          itemClass={styles.elevation}
          onClick={() => {
            selectTool("elevation");
          }}
        />,
      ]}
    />
  );
}
