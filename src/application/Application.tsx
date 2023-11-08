import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import AppState from "./AppState";
import { ComparePage } from "../compare/ComparePage";
import { MeasurePage } from "../measure/MeasurePages";
import { match, P } from "ts-pattern";
import type { Page } from "./AppState";
import { LocationPage } from "../location/LocationPage";
import { CreditsPage } from "../credits/CreditsPage";
import { LandingPage } from "../home/HomePage";
import { enableBasemapSwitcher } from "./BasemapSwitcher";
import { CookieBanner } from "../utility-components/CookieBanner";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { Loading } from "../utility-components/Loading";
import styles from "./app.module.scss";
import { MenuBar } from "../utility-components/MenuBar";
import { Page as PageWrapper } from "../utility-components/Page";

@subclass("ExploreMars.Application")
class Application extends Widget {
  @property()
  private content: any;

  @property()
  private previousContent: any;

  async initialize() {
    const watchPage = reactiveUtils.watch(
      () => AppState.page,
      async (page) => {
        this.previousContent = this.content;

        this.content = null;
        const content = await this.refreshContent(page);

        setTimeout(() => {
          this.previousContent?.destroy();
          this.previousContent = null;
          this.content = content;
        }, 200);
      },
    );

    reactiveUtils.when(
      () => AppState.status !== "uninitialized",
      () => {
        enableBasemapSwitcher(AppState.view);
      },
    );

    this.addHandles(watchPage);
  }

  render() {
    const content = this.content?.render();
    const prev = this.previousContent?.render() ?? null;

    const renderedContent = match([AppState.status, content])
      .with(["loading", P._], () => <Loading />)
      .with([P._, P.nullish], () => prev)
      .otherwise(() => content);

    return (
      <div class={styles.wrapper}>
        <MenuBar
          onItemClick={(item) => {
            this.goToPage(item);
          }}
        />
        <CookieBanner hidden={false || AppState.page === "landing"} />
        <PageWrapper
          hidden={AppState.page === "home" || AppState.page === "landing"}
          content={renderedContent}
        />
        <LandingPage
          hidden={AppState.page !== "landing"}
          onStart={() => {
            this.goToPage("home");
          }}
        />
      </div>
    );
  }

  private goToPage(page: Page) {
    AppState.page = page;
  }

  private async refreshContent(page: Page) {
    const ContentConstructor = match(page)
      .with("home", () => null)
      .with("landing", () => null)
      .with("measure", () => MeasurePage)
      .with("compare", () => ComparePage)
      .with("credits", () => CreditsPage)
      .with("locations", () => LocationPage)
      .exhaustive();

    if (ContentConstructor == null) return;

    const content =
      this.content instanceof ContentConstructor
        ? this.content
        : new ContentConstructor(AppState.view);

    await content.when();

    return content;
  }
}

export default Application;
