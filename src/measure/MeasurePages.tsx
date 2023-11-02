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
import Handles from "@arcgis/core/core/Handles";
import { Item, SubMenu } from "../utility-components/SubMenu";
import styles from "./MeasurePages.module.scss";

type Page = "menu" | "area" | "line" | "elevation";

@subclass("ExploreMars.page.Measure")
export class MeasurePage extends Widget {
  constructor(view: SceneView) {
    super();
    this.areaMeasurement = new AreaMeasurement3D({
      view,
    });

    this.lineMeasurement = new DirectLineMeasurement3D({
      view,
    });

    this.elevationProfile = new ElevationProfile({
      view,
      profiles: [new ElevationProfileLineGround()],
      visibleElements: {
        selectButton: false,
        legend: false,
      },
    });
  }

  private readonly areaMeasurement: AreaMeasurement3D;
  private readonly lineMeasurement: DirectLineMeasurement3D;
  private readonly elevationProfile: ElevationProfile;

  @property()
  page: Page = "menu";

  handles = new Handles();

  initialize() {
    (window as any).elevationProfile = this.elevationProfile;
    const handle = this.elevationProfile.watch("_chart.amChart", (amChart) => {
      if (amChart != null) {
        amChart.paddingLeft = 1;
        if (amChart?.yAxes?._values[0] != null) {
          amChart.yAxes._values[0].renderer.opposite = true;
        }
      }
    });

    this.handles.add(handle);
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

    return <div class={styles.measurement}>{widget.render()}</div>;
  }

  close(
    widget: AreaMeasurement3D | DirectLineMeasurement3D | ElevationProfile,
  ) {
    widget.viewModel.clear();
    widget.visible = false;
    this.page = "menu";
  }

  destroy(): void {
    this.areaMeasurement.destroy();
    this.lineMeasurement.destroy();
    this.elevationProfile.destroy();
    delete (window as any).elevationProfile;

    this.handles.removeAll();
    this.handles.destroy();
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
