import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import type AppState from "./AppState";
import {
  ComparePage,
} from "../compare/ComparePage";
import {
  MeasurePage,
} from "../measure/MeasurePages";
import { CSS } from "./constants";
import { cameras } from "./layers";
import { getCookie, setCookie } from "./utils";
import { match } from 'ts-pattern'
import type { Page } from "./AppState";

const DISCLAIMER_COOKIE_NAME = "disclaimerCookie";
const DISCLAIMER_COOKIE_VALUE = "true";

@subclass("ExploreMars.Application")
class Application extends Widget {
  @property()
  appState!: AppState;

  @property()
  private content: any;

  initialize() {
    this.appState.watch("page", (page: Page) => {
      this.goToPage(page);
    })

    // Check if we need to show the cookie disclaimer
    void this.appState.homePage.onStart.then(() => {
      const disclaimerCookie = getCookie(DISCLAIMER_COOKIE_NAME);
      if (disclaimerCookie !== DISCLAIMER_COOKIE_VALUE) {
        this.appState.currentPageAbove = new CookieDisclaimerPage({
          appState: this.appState,
        });
      }
    });
  }

  render() {
    const abovePage = this.appState.currentPageAbove?.render();
    const bottom = this.content?.render()

    return (
      <div class={CSS.wrapper}>
        <div
          class={this.classes(CSS.belowPage, {
            "has-content": bottom != null,
          })}
        >
          <div class={CSS.border}>{bottom}</div>
        </div>
        <div class={CSS.menu}>
          <nav>
            <a
              class={CSS.logo}
              onclick={(e: Event) => {
                this.showHome(e);
                this.appState.page = 'home';
              }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon} title="Explore Mars"></div>
            </a>
            <a
              class={this.classes(CSS.menuItem, CSS.location)}
              onclick={(e: Event) => { this.appState.page = 'locations' }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon}></div>
              <div class={CSS.label}>Locations {this.appState.page}</div>
            </a>
            <a
              class={this.classes(CSS.menuItem, CSS.measure)}
              onclick={(e: Event) => { this.appState.page = 'measure' }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon}></div>
              <div class={CSS.label}>Measure</div>
            </a>
            <a
              class={this.classes(CSS.menuItem, CSS.compare)}
              onclick={(e: Event) => { this.appState.page = 'compare' }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon}></div>
              <div class={CSS.label}>Compare</div>
            </a>
            <a
              class={this.classes(CSS.menuItem, CSS.esriLogo)}
              onclick={(e: Event) => { this.appState.page = 'credits' }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon} title="Credits"></div>
              <div class={CSS.label}>ArcGIS API for Javascript</div>
            </a>
          </nav>
        </div>
        <div
          class={this.classes(CSS.abovePage, {
            "has-content": abovePage != null,
          })}
        >
          <div class={CSS.border}>{abovePage}</div>
        </div>
      </div>
    );
  }

  private goToPage(page: Page) {
    const ContentConstructor = match(page)
      .with('home', () => null)
      .with('measure', () => MeasurePage)
      .with('compare', () => ComparePage)
      .with('credits', () => MenuCredit)
      .with('locations', () => MenuLocation)
      .exhaustive();

    if (ContentConstructor == null) return;

    const content = this.content != null && this.content instanceof ContentConstructor
    ? this.content
    : new ContentConstructor({ appState: this.appState });

    this.content = null

    setTimeout(() => {
      this.content = content
      this.scheduleRender();
    }, 200);
  }

  private showHome(event: Event) {
    event.preventDefault();
    this.appState.currentPageBelow = null;
    this.appState.currentPageAbove = null;
    this.appState.homePage.visible = !this.appState.homePage.visible;
    this.scheduleRender();
  }
}

@subclass("ExploreMars.menu.Location")
class MenuLocation extends Widget {
  constructor(args: { appState: AppState }) {
    super(args as any);
  }

  @property()
  appState!: AppState;

  render() {
    return (
      <nav id="submenu-location" class={CSS.pageContainer}>
        <a
          href=""
          class={this.classes(CSS.submenuItem)}
          onclick={(e: Event) => {
            this.goTo(e, "perseverance");
          }}
        >
          <div class={CSS.submenuContainer}>
            <div class={CSS.icon}></div>
            <div>Perseverance Rover</div>
          </div>
        </a>
        <a
          href=""
          class={this.classes(CSS.submenuItem)}
          onclick={(e: Event) => {
            this.goTo(e, "curiosity");
          }}
        >
          <div class={CSS.submenuContainer}>
            <div class={CSS.icon}></div>
            <div>Curiosity Rover</div>
          </div>
        </a>
        <a href="" class={this.classes(CSS.submenuItem)} style="display:none;">
          <div class={CSS.submenuContainer}>
            <div class={CSS.icon}></div>
            <div>Martian Path</div>
          </div>
        </a>
        <a
          href=""
          class={this.classes(CSS.submenuItem)}
          onclick={(e: Event) => {
            this.goTo(e, "opportunity");
          }}
        >
          <div class={CSS.submenuContainer}>
            <div class={CSS.icon}></div>
            <div>Opportunity Rover</div>
          </div>
        </a>
      </nav>
    );
  }

  private goTo(event: Event, rover: keyof typeof cameras) {
    event.preventDefault();
    const camera = cameras[rover];
    void this.appState.view.goTo(camera);
  }
}

@subclass("ExploreMars.menu.Credit")
class MenuCredit extends Widget {
  @property()
  appState!: AppState;

  constructor(args: { appState: AppState }) {
    super(args as any);
  }

  render() {
    return (
      <div id="submenu-credit" class={CSS.pageContainer} style="margin: 25px;">
        <div>
          <p>
            <strong>Explore Mars in 3D!</strong>
          </p>

          <p>
            Various imagery layers and detailed terrain allow you to explore the
            planet's surface. Place Earth-sized regions and 3D models to better
            understand distances and elevation on Mars.
          </p>
          <p>
            The app was built using the{" "}
            <a href="https://js.arcgis.com">ArcGIS API for JavaScript</a>.
          </p>
        </div>
        <hr />
        <div class="credit">
          NASA, ESA, HRSC, Goddard Space Flight Center | USGS Astrogeology
          Science Center, Esri, JPL | Wikipedia
        </div>
      </div>
    );
  }
}

@subclass("ExploreMars.pages.Loading")
class LoadingPage extends Widget {
  render() {
    return (
      <div
        id="loading-page"
        class={this.classes(CSS.pageContainer, CSS.loadingPage)}
        style="margin: 25px;text-align: center; margin-bottom: 110px;"
      >
        <div class="loader">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }
}

@subclass("ExploreMars.pages.CookieDisclaimer")
class CookieDisclaimerPage extends Widget {
  constructor(args: { appState: AppState }) {
    console.log('wtffff')
    super(args as any);
  }

  @property()
  appState!: AppState;

  close() {
    setCookie(DISCLAIMER_COOKIE_NAME, DISCLAIMER_COOKIE_VALUE, 365);
    this.appState.currentPageAbove = null;
  }

  render() {
    return (
      <div>
        <a
          class={CSS.closeButton}
          onclick={() => {
            this.close();
          }}
        >
          <span></span>
        </a>
        <div class={CSS.esriWidget} style="padding: 20px;">
          By using this app, you agree to the storing of cookies on your device
          to access data layers, enhance user experience and analyze site usage.
        </div>
      </div>
    );
  }
}

export default Application;
