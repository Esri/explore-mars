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
import ElevationProfileLineGround from "@arcgis/core/widgets/ElevationProfile/ElevationProfileLineGround";
import type SceneView from "@arcgis/core/views/SceneView";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./MeasurePages.module.scss";
import { CloseButton } from "../utility-components/CloseButton";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import ElevationProfileLineView from "@arcgis/core/widgets/ElevationProfile/ElevationProfileLineView";

type Page = "menu" | "area" | "line" | "elevation";

@subclass("ExploreMars.page.Measure")
export class MeasurePage extends Widget {
  private areaMeasurement: AreaMeasurement3D;
  private lineMeasurement: DirectLineMeasurement3D;
  private elevationProfile: ElevationProfile;

  @property()
  page: Page = "menu";

  constructor(view: SceneView) {
    super();
    reactiveUtils.watch(
      () => this.page,
      (page) => {
        if (page !== "menu") {
          this.areaMeasurement?.destroy();
          this.areaMeasurement = new AreaMeasurement3D({
            view,
          });

          this.lineMeasurement?.destroy();
          this.lineMeasurement = new DirectLineMeasurement3D({
            view,
          });
          this.elevationProfile?.destroy();
          this.elevationProfile = new ElevationProfile({
            view,
            profiles: [
              new ElevationProfileLineGround(),
              new ElevationProfileLineView(),
            ],
            visibleElements: {
              selectButton: false,
              legend: false,
            },
          });

          const handle = reactiveUtils.watch(
            () => (this.elevationProfile as any)?._chart?.amChart,
            (amChart) => {
              console.log("am chart");
              if (amChart != null) {
                amChart.paddingLeft = 1;
                if (amChart?.yAxes?._values[0] != null) {
                  amChart.yAxes._values[0].renderer.opposite = true;
                }
              }
            },
          );
          this.elevationProfile.addHandles(handle);
        }
      },
    );
  }

  render() {
    if (this.page === "menu")
      return (
        <MeasureMenu
          selectTool={(tool) => {
            this.page = tool;
          }}
        />
      );

    const widget = match(this.page)
      .with("area", () => this.areaMeasurement)
      .with("elevation", () => this.elevationProfile)
      .with("line", () => this.lineMeasurement)
      .exhaustive();

    widget.visible = true;

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
    delete (window as any).elevationProfile;
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
