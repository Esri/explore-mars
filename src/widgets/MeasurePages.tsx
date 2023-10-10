import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import ElevationLayer from "@arcgis/core/layers/ElevationLayer";
import type AreaMeasurement3D from "@arcgis/core/widgets/AreaMeasurement3D";
import type DirectLineMeasurement3D from "@arcgis/core/widgets/DirectLineMeasurement3D";
import type ElevationProfile from "@arcgis/core/widgets/ElevationProfile";
import Widget from "@arcgis/core/widgets/Widget";
import { tsx } from "@arcgis/core/widgets/support/widget";
import type AppState from "./AppState";

const marsHiRiseImageryElevation = new ElevationLayer({
  url: "https://astro.arcgis.com/arcgis/rest/services/OnMars/HiRISE_DEM/ImageServer",
});

const CSS = {
  closeButton: "close-button",
};

@subclass("ExploreMars.page.Measure")
class MeasurePage extends Widget {
  constructor(args: {
    widget: AreaMeasurement3D | DirectLineMeasurement3D;
    appState: AppState;
  }) {
    super(args as any);
  }

  @property()
  appState!: AppState;

  @property()
  widget!: AreaMeasurement3D | DirectLineMeasurement3D;

  initialize() {
    (this.widget as any).visible = true;
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
        {this.widget.render()}
      </div>
    );
  }

  close() {
    if (this.widget.viewModel.state === "measuring") {
      this.widget.viewModel.clear();
    }

    setTimeout(() => {
      this.appState.currentPageAbove = null;
      this.destroy();
    }, 1);
  }
}

export function createLinePage(appState: AppState, shouldStartFresh = true) {
  if (shouldStartFresh) {
    appState.measureState.directMeasurement.viewModel.start();
  }
  return new MeasurePage({
    appState,
    widget: appState.measureState.directMeasurement,
  });
}

export function createAreaPage(appState: AppState, shouldStartFresh = true) {
  if (shouldStartFresh) {
    appState.measureState.areaMeasurement.viewModel.start();
  }
  return new MeasurePage({
    appState,
    widget: appState.measureState.areaMeasurement,
  });
}

@subclass("ExploreMars.page.Elevation")
class ElevationPage extends Widget {
  constructor(args: { appState: AppState }) {
    super(args as any);
  }

  initialize() {
    this.widget.visible = true;

    (window as any).elevationProfile = this.widget;
    this.widget.watch("_chart.amChart", (amChart) => {
      if (amChart != null) {
        amChart.paddingLeft = 1;
        if (amChart?.yAxes?._values[0] != null) {
          amChart.yAxes._values[0].renderer.opposite = true;
        }
      }
    });
  }

  @property()
  appState!: AppState;

  @property({ aliasOf: "appState.measureState.elevationProfile" })
  widget: ElevationProfile;

  render() {
    return (
      <div class="elevation-page">
        <a
          class={CSS.closeButton}
          onclick={() => {
            this.close();
          }}
        >
          <span></span>
        </a>
        {this.widget.render()}
      </div>
    );
  }

  close() {
    if (this.widget.viewModel.state === "creating") {
      this.widget.viewModel.clear();
    }

    setTimeout(() => {
      this.appState.currentPageAbove = null;
      this.destroy();
    }, 1);
  }
}

export function createElevationPage(
  appState: AppState,
  shouldStartFresh = true,
) {
  if (shouldStartFresh) {
    appState.measureState.elevationProfile.viewModel.start();
  }
  return new ElevationPage({ appState });
}
