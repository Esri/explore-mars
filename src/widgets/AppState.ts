import type Graphic from "@arcgis/core/Graphic";
import Accessor from "@arcgis/core/core/Accessor";
import Handles from "@arcgis/core/core/Handles";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
// import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
// import request from "@arcgis/core/request";
import type SceneView from "@arcgis/core/views/SceneView";
import AreaMeasurement3D from "@arcgis/core/widgets/AreaMeasurement3D";
import DirectLineMeasurement3D from "@arcgis/core/widgets/DirectLineMeasurement3D";
import ElevationProfile from "@arcgis/core/widgets/ElevationProfile";
import ElevationProfileLineGround from "@arcgis/core/widgets/ElevationProfile/ElevationProfileLineGround";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import type Widget from "@arcgis/core/widgets/Widget";
import BasemapSwitcher from "./BasemapSwitcher";
import type HomePage from "./HomePage";
import * as layers from "./layers";

export type Page = 
| 'home'
| 'locations'
| 'measure'
| 'compare'
| 'credits'

@subclass("ExploreMars.AppState")
export class AppState extends Accessor {
  @property()
  page: Page = 'home'

  @property()
  homePage!: HomePage;

  @property()
  currentPageBelow: Widget | null = null;

  @property()
  currentPageAbove: Widget | null = null;

  @property()
  view!: SceneView;

  @property()
  editingState!: Editing;

  @property()
  measureState!: MeasureState;

  async initialize() {
    await this.view.when();

    setTimeout(
      () => new BasemapSwitcher({ view: this.view, homePage: this.homePage }),
      500,
    );

    this.view.map.ground.layers.add(layers.marsElevation);

    const popup = this.view.popup;
    popup.actions?.removeAll();
    popup.dockEnabled = true;
    popup.dockOptions = {
      buttonEnabled: false,
      position: "top-right",
      breakpoint: false,
    };

    popup.spinnerEnabled = true;
    popup.collapseEnabled = false;

    const missionLayer = layers.createMissionLayer();
    this.view.map.addMany([missionLayer]);
    await missionLayer.when();

    const marsNamesLayer = layers.createMarsNamesLayer();
    this.view.map.add(marsNamesLayer);
    await marsNamesLayer.when();

    const perseveranceLayers = layers.createPerseveranceLayers();
    this.view.map.add(perseveranceLayers);
    await perseveranceLayers.when();

    this.editingState = new Editing({ view: this.view });
    this.measureState = new MeasureState({ view: this.view });
  }
}

// ---------
// Compare
// ---------

@subclass("ExploreMars.states.Editing")
export class Editing extends Accessor {
  constructor(args: { view: SceneView }) {
    super(args as any);
  }

  @property({ constructOnly: true })
  view!: SceneView;

  @property()
  sketchViewModel!: SketchViewModel;

  @property()
  graphics!: GraphicsLayer;

  @property()
  graphicEditing: Graphic[] = [];

  @property()
  handles = new Handles();

  @property()
  get isUpdating() {
    return this.sketchViewModel.state === "active";
  }

  @property()
  loading = false;

  initialize() {
    this.graphics = new GraphicsLayer({
      title: "SVM layer for comparison",
      listMode: "hide",
    });

    this.view.map.layers.add(this.graphics);

    this.sketchViewModel = new SketchViewModel({
      layer: this.graphics,
      view: this.view,
      defaultUpdateOptions: {
        toggleToolOnClick: false,
        enableScaling: false,
        enableZ: true,
      },
    });

    this.sketchViewModel.on("delete", () => {
      this.cancelEditing();
    });
  }

  public cancelEditing() {
    this.sketchViewModel.cancel();
    this.handles.removeAll();
    this.graphics.removeAll();
    this.view.graphics.removeAll();
    this.graphicEditing.forEach((graphic) => {
      graphic.destroy();
    });
    this.graphicEditing = [];
  }

  public doneEditing() {
    this.sketchViewModel.complete();
  }
}

// ---------
// Measure
// ---------

@subclass("ExploreMars.states.Measure")
export class MeasureState extends Accessor {
  @property()
  view!: SceneView;

  @property()
  elevationProfile!: ElevationProfile;

  @property()
  directMeasurement!: DirectLineMeasurement3D;

  @property()
  areaMeasurement!: AreaMeasurement3D;

  @property()
  widgets!: Array<
    AreaMeasurement3D | DirectLineMeasurement3D | ElevationProfile
  >;

  initialize() {
    this.elevationProfile = new ElevationProfile({
      view: this.view,
      profiles: [new ElevationProfileLineGround()],
      visibleElements: {
        selectButton: false,
        legend: false,
      },
    });

    this.directMeasurement = new DirectLineMeasurement3D({ view: this.view });
    this.areaMeasurement = new AreaMeasurement3D({ view: this.view });

    this.widgets = [
      this.directMeasurement,
      this.areaMeasurement,
      this.elevationProfile,
    ];

    // Ensure only one widget is visible:
    this.widgets.forEach((widget) => {
      // Start with widget hidden:
      widget.visible = false;
      widget.watch("visible", (visible: boolean) => {
        if (!visible) {
          widget.viewModel.clear();
        } else {
          // hide all other widgets:
          this.widgets.forEach(
            (widget2) => ((widget2 as any).visible = widget === widget2),
          );
        }
      });
    });
  }
}

export default AppState;
