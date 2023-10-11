// import { CSS } from "./constants";
import Map from "@arcgis/core/Map";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import { addFrameTask } from "@arcgis/core/core/scheduling";
import SceneView from "@arcgis/core/views/SceneView";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { CSS } from "./constants";
import { marsImageryBasemap, marsSR } from "./layers";

const NOOP = () => {};

@subclass("ExploreMars.HomePage")
class HomePage extends Widget {
  @property()
  visible = false;

  @property()
  view!: SceneView;

  @property()
  onStart: Promise<void>;

  private resolveStart: () => void = NOOP;

  constructor(args: { container: string }) {
    super(args);

    this.onStart = new Promise((resolve) => {
      this.resolveStart = () => {
        this.resolveStart = NOOP;
        resolve();
      };
    });
  }

  private initializeSceneView() {
    const map = new Map({
      basemap: marsImageryBasemap,
      ground: {
        surfaceColor: [144, 106, 100],
      },
    });

    this.view = new SceneView({
      container: "viewDiv",
      map,
      qualityProfile: "high",
      spatialReference: marsSR,
      environment: {
        lighting: {
          directShadowsEnabled: true,
        },
      },
      camera: {
        position: {
          x: 360 * Math.random() - 180,
          y: 90 * Math.random() - 45,
          z: 6500000,
          spatialReference: { wkid: 104971 },
        },
        heading: 0.0,
        tilt: 10,
      },
    });

    this.view.ui.remove("attribution");
  }

  private showHomePage() {
    setTimeout(() => (this.visible = true), 1000);
  }

  private spinGlobe() {
    const stopSpin = addFrameTask({
      update: () => {
        if (!this.view.interacting) {
          const camera = this.view?.camera.clone();
          camera.position.longitude -= 0.04;
          this.view.camera = camera;
        } else {
          stopSpin.remove();
        }
      },
    });

    void this.onStart.then(() => {
      stopSpin.remove();
    });
  }

  init(): SceneView {
    this.initializeSceneView();

    // display the home page
    this.showHomePage();
    // and spin the globe
    this.spinGlobe();

    return this.view;
  }

  render() {
    return (
      <div
        id="landing-page"
        class={this.classes(CSS.pageContainer, { hidden: !this.visible })}
      >
        <div class="content">
          <div class="container">
            <h1>Explore Mars!</h1>
            <p class="text">
              Have you always dreamt of being an astronaut? Come close by
              exploring Mars, its canyons, mountains and craters along with the
              location of previous missions!
            </p>
            <p>
              <button
                onclick={() => {
                  this.clickStart();
                }}
              >
                Start now!
              </button>
            </p>
            <p class="small navigation-tip">
              Tip: to navigate use the left and right mouse buttons, or with
              your keyboard using W,A,S,D + arrow keys.
            </p>
          </div>
        </div>
        <div class="graphics">
          <div class="graphic-1 right"></div>
          <div class="graphic-2 right"></div>
          <div class="graphic-3 middle"></div>
          <div class="graphic-4 right"></div>
          <div class="graphic-5 right"></div>
          <div class="graphic-6 left"></div>
          <div class="graphic-7 middle"></div>
          <div class="graphic-8 left"></div>
          <div class="graphic-9 left"></div>
        </div>
      </div>
    );
  }

  private clickStart() {
    this.resolveStart();
    this.visible = false;
  }
}

export default HomePage;
