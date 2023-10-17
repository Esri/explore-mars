import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import ElevationLayer from "@arcgis/core/layers/ElevationLayer";
import AreaMeasurement3D from "@arcgis/core/widgets/AreaMeasurement3D";
import DirectLineMeasurement3D from "@arcgis/core/widgets/DirectLineMeasurement3D";
import ElevationProfile from "@arcgis/core/widgets/ElevationProfile";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import type AppState from "./AppState";
import { match } from 'ts-pattern';
import SceneView from "@arcgis/core/views/SceneView";
import ElevationProfileLineGround from "@arcgis/core/widgets/ElevationProfile/ElevationProfileLineGround";

const marsHiRiseImageryElevation = new ElevationLayer({
  url: "https://astro.arcgis.com/arcgis/rest/services/OnMars/HiRISE_DEM/ImageServer",
});

const CSS = {
  closeButton: "close-button",

  submenuItem: "submenu-item",
  submenuContainer: "submenu-container",
  lineMeasure: "line-measure",
  areaMeasure: "area-measure",
  elevationMeasure: "elevation-measure",
  pageContainer: "page-container",
};

type State = 
| 'menu'
| 'area'
| 'line'
| 'elevation'

@subclass("ExploreMars.page.Measure")
export class MeasurePage extends Widget {
  constructor({ appState: { view }}: { appState: AppState }) {
    super();
    this.areaMeasurement = new AreaMeasurement3D({
      view
    });

    this.lineMeasurement = new DirectLineMeasurement3D({
      view
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
  measureState: State = 'menu'

  @property()
  appState!: AppState;

  initialize() {
    // (this.widget as any).visible = true;
    (window as any).elevationProfile = this.elevationProfile;
    this.elevationProfile.watch("_chart.amChart", (amChart) => {
      if (amChart != null) {
        amChart.paddingLeft = 1;
        if (amChart?.yAxes?._values[0] != null) {
          amChart.yAxes._values[0].renderer.opposite = true;
        }
      }
    });
  }

  render() {
    if (this.measureState === 'menu') 
      return <MeasureMenu classes={this.classes} selectTool={(tool) => { this.measureState = tool }} />;

    const widget = match(this.measureState)
    .with('area', () => this.areaMeasurement)
    .with("elevation", () => this.elevationProfile)
    .with("line", () => this.lineMeasurement)
    .exhaustive()

    widget.visible = true;

    return (
      <MeasureTool onClose={() => { this.close(widget); }} children={widget.render()} />
    )
  }

  close(widget: AreaMeasurement3D | DirectLineMeasurement3D | ElevationProfile) {
    widget.viewModel.clear();
    widget.visible = false;
    this.measureState = 'menu';
  }
}


interface MeasureMenuProps {
  classes: __esri.Widget['classes'],
  selectTool: (tool: Exclude<State, 'menu'>) => void
}
function MeasureMenu({ classes, selectTool }: MeasureMenuProps) {
  return (
    <nav key="submenu-measure" id="submenu-measure" class={CSS.pageContainer}>
      <a
        class={classes(CSS.lineMeasure, CSS.submenuItem)}
        onclick={() => { selectTool('line') }}
      >
        <div class={CSS.submenuContainer}>Line</div>
      </a>
      <a
        class={classes(CSS.areaMeasure, CSS.submenuItem)}
        onclick={() => { selectTool('area') }}
      >
        <div class={CSS.submenuContainer}>Area</div>
      </a>
      <a
        class={classes(CSS.elevationMeasure, CSS.submenuItem)}
        onclick={() => { selectTool('elevation') }}
      >
        <div class={CSS.submenuContainer}>Elevation</div>
      </a>
    </nav>
  )
}

interface MeasureToolProps {
  onClose: () => void;
  children: ReturnType<Widget['render']>
}
function MeasureTool({ children, onClose }: MeasureToolProps) {
  return (
  <div>
    <a
      class={CSS.closeButton}
      onclick={() => {
        onClose();
      }}
    >
      <span></span>
    </a>
      {children}
  </div>
  )
}