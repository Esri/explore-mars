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
import type SceneView from "@arcgis/core/views/SceneView";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./MeasurePages.module.scss";
import { CloseButton } from "../utility-components/CloseButton";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import ElevationProfileLineView from "@arcgis/core/widgets/ElevationProfile/ElevationProfileLineView";
import AppState from "../application/AppState";

import "./esri-measurement-widget-overwrites.scss";

type Page = "menu" | "area" | "line" | "elevation";

const areaMeasurement = new AreaMeasurement3D({});

const lineMeasurement = new DirectLineMeasurement3D({});
const elevationProfile = new ElevationProfile({
  profiles: [new ElevationProfileLineView()],
  visibleElements: {
    selectButton: false,
    legend: false,
  },
});

reactiveUtils.watch(
  () => (elevationProfile as any)?._chart?.amChart,
  (amChart) => {
    if (amChart != null) {
      amChart.paddingLeft = 1;
      if (amChart?.yAxes?._values[0] != null) {
        amChart.yAxes._values[0].renderer.opposite = true;
      }
    }
  },
);

@subclass("ExploreMars.page.Measure")
export class MeasurePage extends Widget {
  @property()
  page: Page = "menu";

  constructor(view: SceneView) {
    super();

    areaMeasurement.view ??= view;
    lineMeasurement.view ??= view;
    elevationProfile.view ??= view;

    const watchPage = reactiveUtils.watch(
      () => this.page,
      (page) => {
        if (page !== "menu") {
          areaMeasurement?.viewModel.clear();
          lineMeasurement?.viewModel.clear();
          elevationProfile?.viewModel.clear();

          match(page)
            .with("area", () => {
              areaMeasurement.viewModel.start();
            })
            .with("elevation", () => {
              elevationProfile.viewModel.start();
            })
            .with("line", () => {
              lineMeasurement.viewModel.start();
            })
            .exhaustive();
        }
      },
    );
    this.addHandles(watchPage);
  }

  render() {
    if (this.page === "menu") {
      AppState.status = "idle";
      return (
        <MeasureMenu
          selectTool={(tool) => {
            this.page = tool;
          }}
        />
      );
    }

    AppState.status = "editing";

    const widget = match(this.page)
      .with("area", () => areaMeasurement)
      .with("elevation", () => elevationProfile)
      .with("line", () => lineMeasurement)
      .exhaustive();

    widget.visible = true;

    widget.viewModel.addHandles(
      reactiveUtils.when(
        () => widget.viewModel.state === "creating",
        () => {
          if (widget !== elevationProfile) widget.viewModel.clear();
        },
      ),
    );

    return (
      <div class={styles.measurement}>
        <CloseButton
          onClose={() => {
            this.close();
          }}
        />
        {widget.render()}
      </div>
    );
  }

  close() {
    this.page = "menu";
  }

  destroy(): void {
    super.destroy();
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
