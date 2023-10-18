import {
  aliasOf,
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import type AppState from "../widgets/AppState";
import { match } from 'ts-pattern';
import { AddObjectPage } from "./AddObject";
import { AddRegionPage } from "./AddRegion";
import type Graphic from "@arcgis/core/Graphic";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Handles from "@arcgis/core/core/Handles";
import PolygonTransform from "../widgets/PolygonTransform";
import { type Polygon, type Point } from "@arcgis/core/geometry";

const CSS = {
  closeButton: "close-button",
  submenuItem: "submenu-item",
  pageContainer: "page-container",

  submenuContainer: "submenu-container",
  lineMeasure: "line-measure",
  areaMeasure: "area-measure",
  elevationMeasure: "elevation-measure",
  loadingPage: "loading-page",
};

type Page =
| 'menu'
| 'regions'
| 'models';

@subclass("ExploreMars.page.CompareObject")
export class ComparePage extends Widget {
  constructor({ appState }: { appState: AppState }) {
    super();
    const view = appState.view

    this.addRegionWidget = new AddRegionPage({ 
      view,
      onClose: this.close,
      onAddRegion: (region) => {
        const { country, center, label } = region;
        this.addModels(
          [
            center,
            country,
            label
          ],
          {
            target: country.geometry,
            elevationInfo: { mode: 'on-the-ground' }
          }
        );

        const spherical = new PolygonTransform(view);
        let lastAngle = 0;
        this.handles.add(
          this.sketchViewModel.on("update", (ev) => {
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
          }),
        );
      }
    });

    this.addObjectWidget = new AddObjectPage({ 
      view,
      onClose: this.close,
      onAddObject: (object) => {
        this.addModels([object], {
          target: {
            target: object.geometry,
            scale: 250_000,
            tilt: 70,
          }
        });
      }
    });

    this.appState = appState
  }

  @property()
  page: Page = 'menu'

  @property()
  appState!: AppState;

  @property()
  isEditing = false;

  @property()
  sketchViewModel!: SketchViewModel;

  @property()
  graphics!: GraphicsLayer;

  @aliasOf('graphics.graphics')
  graphicEditing: Graphic[] = [];

  @property()
  handles = new Handles();

  private readonly addRegionWidget: AddRegionPage;
  private readonly addObjectWidget: AddObjectPage;

  initialize() {
    const view = this.appState.view;
    
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
      this.cancelEditing();
    });

    this.graphics = graphics;
    this.sketchViewModel = sketchViewModel;
  }

  render() {
    if (this.page === "menu") return <CompareMenu classes={this.classes} selectTool={(tool) => { this.page = tool }} />
    if (this.isEditing) return <EditingInfo close={() => { this.close(); }} />;

    const widget = match(this.page)
    .with('models', () => this.addObjectWidget)
    .with('regions', () => this.addRegionWidget)
    .exhaustive();

    widget.visible = true;
    return widget.render()
  }

  private close() {
    this.page = 'menu'
    this.cancelEditing();
  }

  private addModels(graphics: Graphic[], options?: Partial<{
    target: __esri.GoToTarget3D;
    elevationInfo: __esri.GraphicsLayerElevationInfo;
  }>) {
    this.graphics.addMany(graphics);

    if (options?.elevationInfo != null)
      this.graphics.elevationInfo = options.elevationInfo;

    void this.appState.view.goTo(options?.target);
    void this.sketchViewModel.update(graphics[0], {
      enableScaling: false,
    });

    this.isEditing = true;
  }

  private cancelEditing() {
    this.page = 'menu';
    this.isEditing = false;
    this.sketchViewModel.cancel();
    this.handles.removeAll();
    this.graphicEditing.forEach((graphic) => {
      graphic.destroy();
    });
    this.graphics.removeAll();
  }

}

interface CompareMenuProps {
  classes: __esri.Widget['classes'],
  selectTool: (tool: Exclude<Page, 'menu'>) => void
}
function CompareMenu({ classes, selectTool }: CompareMenuProps) {
  return (
    <nav id="submenu-compare" class={CSS.pageContainer}>
      <a
        href=""
        id="regions"
        class={classes(CSS.lineMeasure, CSS.submenuItem)}
        onclick={(e: Event) => {
          e.preventDefault(); 
          selectTool('regions')
        }}
      >
        <div class={CSS.submenuContainer}>Regions</div>
      </a>
      <a
        href=""
        id="3d-objects"
        class={classes(CSS.areaMeasure, CSS.submenuItem)}
        onclick={(e: Event) => {
          e.preventDefault(); 
          selectTool('models')
        }}
      >
        <div class={CSS.submenuContainer}>3D Models</div>
      </a>
    </nav>
  );
}

interface EditingInfoProps {
  close: (event: Event) => void
}
function EditingInfo({ close }: EditingInfoProps) {

  return (
    <div id="edit-objects" class={CSS.pageContainer}>
      <a
        class={CSS.closeButton}
        onclick={(e: Event) => {
          e.preventDefault(); 
          close(e);
        }}
      >
        <span></span>
      </a>
      <p>
        Move the object in the view using the orange handles. Press "delete"
        to remove the object.
      </p>
    </div>
  )
}