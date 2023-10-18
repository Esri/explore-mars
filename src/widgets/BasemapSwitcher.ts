import Accessor from "@arcgis/core/core/Accessor";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import * as promiseUtils from "@arcgis/core/core/promiseUtils";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import type SceneView from "@arcgis/core/views/SceneView";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle";
import {
  marsHiRiseImagery,
  marsImageryBasemap,
  marsReconnaissanceImagery,
  shadedReliefBasemap,
} from "./layers";

@subclass("ExploreMars.BasemapSwitcher")
export class BasemapSwitcher extends Accessor {
  @property()
  view!: SceneView;

  async initialize() {
    const toggle = new BasemapToggle({
      view: this.view,
      nextBasemap: shadedReliefBasemap,
    });

    this.view.map.watch("basemap", () => {
      this.view.environment.atmosphereEnabled =
        toggle.activeBasemap === marsImageryBasemap;
    });

    this.view.ui.add(toggle, "bottom-right");

    const updateBasemap = promiseUtils.debounce(this.updateBasemap);

    reactiveUtils.when(
      () => this.view.stationary,
      () => {
        void updateBasemap();
      },
    );
  }

  /* Update visibility of HiRise basemaps depending on distance to camera */
  updateBasemap = async () => {
    const result = await this.view.hitTest(
      { x: this.view.width / 2, y: this.view.height / 2 },
      { include: [this.view.map.ground] },
    );
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const d = result.ground.mapPoint
      ? result.ground.distance
      : Number.MAX_VALUE;

    marsReconnaissanceImagery.visible = d < 100000;
    marsHiRiseImagery.visible = d < 10000;
  }
}

export default BasemapSwitcher;
