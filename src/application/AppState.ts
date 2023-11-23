import Accessor from "@arcgis/core/core/Accessor";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import type SceneView from "@arcgis/core/views/SceneView";

export type Page =
  | "landing"
  | "home"
  | "locations"
  | "measure"
  | "compare"
  | "credits";

@subclass("ExploreMars.Store")
export class Store extends Accessor {
  @property()
  view: SceneView;

  @property()
  page: Page = "landing";

  @property()
  status: "uninitialized" | "idle" | "loading" | "editing";

  async initialize() {
    this.status = "uninitialized";
    await reactiveUtils.whenOnce(() => this.view != null);
    await this.view?.when();
    this.status = "idle";
  }

  async when() {
    await reactiveUtils.whenOnce(() => this.status !== "uninitialized");
  }

  async load<T>(promise: Promise<T>): Promise<T> {
    this.status = "loading";
    try {
      return await promise;
    } finally {
      this.status = "idle";
    }
  }
}

const AppState = new Store();

export default AppState;
