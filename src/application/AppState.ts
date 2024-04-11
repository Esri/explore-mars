import Accessor from "@arcgis/core/core/Accessor";
import Collection from "@arcgis/core/core/Collection";
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

type RouteConfig<R extends string, Path extends string, State> = {
  route: R;
  state?: State;
  path: Path;
  children?: Route<Path>;
};
@subclass()
export class Route<
  R extends string,
  Path extends string = string,
  State = unknown,
> extends Accessor {
  @property()
  history = new Collection<{
    path: Path;
    state?: State;
    children?: Route<Path>;
  }>();

  @property()
  children?: Route<Path>;

  @property()
  private _path: Path;

  @property({ constructOnly: true })
  route: R;

  @property({ constructOnly: true })
  initialConfig: RouteConfig<R, Path, State>;

  @property()
  get path() {
    return this._path;
  }

  @property()
  private _state?: State;

  @property()
  get state(): State | undefined {
    return this._state;
  }

  set state(s: State) {
    this.push(this._path, s);
  }

  push(value: Path | Route<Path>, state?: State) {
    this.history.add({
      path: this.path,
      state: this.state,
      children: this.children,
    });

    if (typeof value === "string") {
      this.children = undefined;
      this._path = value;
    } else {
      this._path = value.route;
      this.children = value;
    }

    this._state = state;
  }

  replace(value: Path | Route<Path>, state?: State) {
    this.history.removeAll();

    if (typeof value === "string") {
      this.children = undefined;
      this._path = value;
    } else {
      this._path = value.route;
      this.children = value;
    }

    this._state = state;
  }

  reset() {
    this.history.removeAll();
    this._path = this.initialConfig.path;
    this.children = this.initialConfig.children;
    this._state = this.initialConfig.state;
  }

  back() {
    const { path, state, children } = this.history.pop();

    this._path = path;
    this._state = state;
    this.children = children;
  }

  match(route: Route<string> | string, state?: any): boolean {
    if (typeof route === "string") {
      return this.path === route;
    }
    if (this === route)
      return state !== undefined ? this.state === state : true;
    else if (this.children) {
      return this.children.match(route, state);
    } else return false;
  }

  constructor(
    props: RouteConfig<R, Path, State> & {
      paths: Path[];
    },
  ) {
    super();
    this.initialConfig = props;
    this.route = props.route;
    if (props.path) this._path = props.path;
    if (props.state) this.state = props.state;
    if (props.children) this.children = props.children;
  }
}

@subclass("ExploreMars.Store")
export class Store extends Accessor {
  @property()
  view: SceneView;

  @property()
  page: Page = "landing";

  @property()
  route = new Route({
    path: "landing",
    route: "root",
    paths: ["landing", "home", "compare", "measure", "locations", "credits"],
  });

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

(window as any).AppState = AppState;

export default AppState;
