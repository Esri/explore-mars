import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import AppState from "./AppState";
import {
  ComparePage,
} from "../compare/ComparePage";
import {
  MeasurePage,
} from "../measure/MeasurePages";
import { CSS } from "./constants";
import { getCookie, setCookie } from "./utils";
import { match } from 'ts-pattern'
import type { Page } from "./AppState";
import { LocationPage } from "../location/LocationPage";
import { CreditsPage } from "../credits/CreditsPage";
import { LandingPage } from "../home/HomePage";
import type SceneView from "@arcgis/core/views/SceneView";
import BasemapSwitcher from "./BasemapSwitcher";

@subclass("ExploreMars.Application")
class Application extends Widget {
  appState!: AppState;

  @property()
  view!: SceneView;

  @property()
  private content: any;

  async initialize() {
    const appState = new AppState({
      view: this.view,
    });
    this.appState = appState;

    appState.watch("page", (page: Page) => {
      this.refreshContent(page);
    });

    appState.watch("loading", () => {
      this.refreshContent(this.appState.page);
    })

    await this.view.when();
    setTimeout(
      () => new BasemapSwitcher({ view: this.view }),
      500,
    );
  }

  render() {
    const content = this.content?.render()
    const disclaimerCookie = getCookie(DISCLAIMER_COOKIE_NAME);

    const needsAcceptence = this.appState.page !== 'landing' && disclaimerCookie !== DISCLAIMER_COOKIE_VALUE;

    return (
      <div class={CSS.wrapper}>
        <div
          class={this.classes(CSS.belowPage, {
            "has-content": content != null,
          })}
        >
          <div class={CSS.border}>
            {this.appState.loading === 'idle' ? content : <Loading />}
          </div>
        </div>
        <div class={CSS.menu}>
          <nav>
            <a
              class={CSS.logo}
              onclick={(e: Event) => { this.goToPage('landing') }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon} title="Explore Mars"></div>
            </a>
            <a
              class={this.classes(CSS.menuItem, CSS.location)}
              onclick={(e: Event) => { this.goToPage('locations') }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon}></div>
              <div class={CSS.label}>Locations</div>
            </a>
            <a
              class={this.classes(CSS.menuItem, CSS.measure)}
              onclick={(e: Event) => { this.goToPage('measure') }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon}></div>
              <div class={CSS.label}>Measure</div>
            </a>
            <a
              class={this.classes(CSS.menuItem, CSS.compare)}
              onclick={(e: Event) => { this.goToPage('compare') }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon}></div>
              <div class={CSS.label}>Compare</div>
            </a>
            <a
              class={this.classes(CSS.menuItem, CSS.esriLogo)}
              onclick={(e: Event) => { this.goToPage('credits') }}
            >
              <div class={CSS.menuBackground}></div>
              <div class={CSS.icon} title="Credits"></div>
              <div class={CSS.label}>ArcGIS API for Javascript</div>
            </a>
          </nav>
        </div>
        <div
          class={this.classes(CSS.abovePage, {
            "has-content": needsAcceptence,
          })}
        >
          <div class={CSS.border}>
            {needsAcceptence ? <CookieBanner /> : null}
          </div>
        </div>
        <LandingPage hidden={this.appState.page !== 'landing'} onStart={() => { this.goToPage('home') } }/>
      </div>
    );
  }

  private goToPage(page: Page) {
    this.appState.page = page;
  }

  private refreshContent(page: Page) {
    const ContentConstructor = match(page)
      .with('home', () => null)
      .with('landing', () => null)
      .with('measure', () => MeasurePage)
      .with('compare', () => ComparePage)
      .with('credits', () => CreditsPage)
      .with('locations', () => LocationPage)
      .exhaustive();

    if (ContentConstructor == null) {
      setTimeout(() => {
        this.content = null
        this.scheduleRender();
      }, 200);
      return;
    }

    const content = this.content instanceof ContentConstructor
    ? this.content
    : new ContentConstructor(this.view);

    this.content = null
    setTimeout(() => {
      this.content = content
      this.scheduleRender();
    }, 200);
  }
}

function Loading() {
  return (
    <div
      id="loading-page"
      class={`${CSS.pageContainer} ${CSS.loadingPage}`}
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

const DISCLAIMER_COOKIE_NAME = "disclaimerCookie";
const DISCLAIMER_COOKIE_VALUE = "true";

function CookieBanner() {
  return (
    <div>
      <a
        class={CSS.closeButton}
        onclick={() => {
          setCookie(DISCLAIMER_COOKIE_NAME, DISCLAIMER_COOKIE_VALUE, 365);
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

export default Application;
