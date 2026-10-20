import { useEffect, useRef, useState } from "react";
import type SceneView from "@arcgis/core/views/SceneView";
import AreaMeasurementAnalysis from "@arcgis/core/analysis/AreaMeasurementAnalysis";
import DirectLineMeasurementAnalysis from "@arcgis/core/analysis/DirectLineMeasurementAnalysis";
import ElevationProfileAnalysis from "@arcgis/core/analysis/ElevationProfileAnalysis";
import ElevationProfileLineGround from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineGround";
import ElevationProfileLineScene from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineScene";
import type AreaMeasurementAnalysisView3D from "@arcgis/core/views/3d/analysis/AreaMeasurementAnalysisView3D";
import type DirectLineMeasurementAnalysisView3D from "@arcgis/core/views/3d/analysis/DirectLineMeasurementAnalysisView3D";
import type ElevationProfileAnalysisView3D from "@arcgis/core/views/3d/analysis/ElevationProfileAnalysisView3D";
import type { ElevationProfileStatistics } from "@arcgis/core/views/analysis/ElevationProfile/types";
import type { ResourceHandle } from "@arcgis/core/core/Handles";
import type { Area, Length } from "@arcgis/core/core/quantity";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { ElevationChart } from "./ElevationChart";
import { formatValue, type ProfileSeries } from "./profile";
import { errorMessage, isAbortError } from "../utilities/errors";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-notice";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-progress";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-switch";
import "./MeasurePages.css";

type Tool = "line" | "area" | "elevation";
type Units = "metric" | "imperial";
type MeasurementAnalysis =
  | AreaMeasurementAnalysis
  | DirectLineMeasurementAnalysis
  | ElevationProfileAnalysis;
type MeasurementView =
  | AreaMeasurementAnalysisView3D
  | DirectLineMeasurementAnalysisView3D
  | ElevationProfileAnalysisView3D;
interface Results {
  metrics: { label: string; value: string }[];
  profiles: ProfileSeries[];
  statistics: ElevationProfileStatistics | null;
  distanceUnit: string;
  elevationUnit: string;
  progress: number;
  hasGeometry: boolean;
  error: string | null;
}
const emptyResults: Results = {
  metrics: [],
  profiles: [],
  statistics: null,
  distanceUnit: "meters",
  elevationUnit: "meters",
  progress: 0,
  hasGeometry: false,
  error: null,
};
function quantity(value: Length | Area | null | undefined) {
  return value ? formatValue(value.value, value.unit) : "Not available";
}

function readResults(analysisView: MeasurementView): Results {
  if (analysisView.type === "elevation-profile-view-3d") {
    const statistics = analysisView.statistics ?? null;
    const { elevation: elevationUnit, distance: distanceUnit } = analysisView.effectiveDisplayUnits;
    return {
      profiles: analysisView.results.map((result) => ({
        id: result.profile.type,
        title:
          result.profile.title ?? (result.profile.type === "ground" ? "Terrain" : "Scene / models"),
        samples:
          result.samples?.map((sample) => ({
            distance: sample.distance,
            elevation: sample.elevation ?? null,
          })) ?? [],
      })),
      statistics,
      elevationUnit,
      distanceUnit,
      metrics: statistics
        ? [
            {
              label: "Distance",
              value: formatValue(statistics.maxDistance, distanceUnit),
            },
            {
              label: "Elevation range",
              value: `${formatValue(statistics.minElevation, elevationUnit)} – ${formatValue(statistics.maxElevation, elevationUnit)}`,
            },
            {
              label: "Elevation gain",
              value: formatValue(statistics.elevationGain, elevationUnit),
            },
            {
              label: "Elevation loss",
              value: formatValue(statistics.elevationLoss, elevationUnit),
            },
          ]
        : [],
      progress: analysisView.progress,
      hasGeometry: analysisView.analysis.geometry != null,
      error: analysisView.error ? errorMessage(analysisView.error) : null,
    };
  }
  if (analysisView.type === "area-measurement-view-3d") {
    const result = analysisView.result;
    return {
      ...emptyResults,
      progress: result ? 1 : 0,
      hasGeometry: analysisView.analysis.geometry != null,
      metrics: result
        ? [
            { label: "Area", value: quantity(result.area) },
            { label: "Perimeter", value: quantity(result.perimeter) },
          ]
        : [],
    };
  }
  const result = analysisView.result;
  return {
    ...emptyResults,
    progress: result ? 1 : 0,
    hasGeometry: analysisView.analysis.endPoint != null,
    metrics: result
      ? [
          { label: "Direct distance", value: quantity(result.directDistance) },
          {
            label: "Horizontal distance",
            value: quantity(result.horizontalDistance),
          },
          {
            label: "Vertical distance",
            value: quantity(result.verticalDistance),
          },
        ]
      : [],
  };
}

export function MeasurePage({ view }: { view: SceneView }) {
  const [tool, setTool] = useState<Tool>("line");
  const [units, setUnits] = useState<Units>("metric");
  const [revision, setRevision] = useState(0);
  const [includeScene, setIncludeScene] = useState(true);
  const [results, setResults] = useState(emptyResults);
  const [placing, setPlacing] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const analysis = useRef<MeasurementAnalysis | null>(null);
  const analysisView = useRef<MeasurementView | null>(null);
  const operation = useRef<AbortController | null>(null);
  const preferences = useRef({ units, includeScene });
  preferences.current = { units, includeScene };

  useEffect(() => {
    let disposed = false;
    let handle: ResourceHandle | undefined;
    const controller = new AbortController();
    operation.current = controller;
    const settings = preferences.current;
    let current: MeasurementAnalysis;

    if (tool === "line") {
      current = new DirectLineMeasurementAnalysis({ unit: settings.units });
    } else if (tool === "area") {
      current = new AreaMeasurementAnalysis({ unit: settings.units });
    } else {
      const profiles = [
        new ElevationProfileLineGround({
          title: "Terrain",
          color: "#f6a17b",
        }),
      ];

      current = new ElevationProfileAnalysis({
        profiles,
        displayUnits: {
          distance: settings.units === "metric" ? "meters" : "feet",
          elevation: settings.units === "metric" ? "meters" : "feet",
        },
      });

      if (settings.includeScene) {
        current.profiles.add(
          new ElevationProfileLineScene({
            title: "Scene / models",
            color: "#9bc7df",
          }),
        );
      }
    }

    analysis.current = current;
    view.analyses.add(current);
    setResults(emptyResults);
    setInitializing(true);
    setPlacing(false);

    async function initialize() {
      try {
        let measurementView: MeasurementView;

        if (current instanceof ElevationProfileAnalysis) {
          measurementView = await view.whenAnalysisView(current);
        } else if (current instanceof AreaMeasurementAnalysis) {
          measurementView = await view.whenAnalysisView(current);
        } else {
          measurementView = await view.whenAnalysisView(current);
        }

        if (disposed) {
          return;
        }
        analysisView.current = measurementView;
        measurementView.interactive = true;
        handle = reactiveUtils.watch(() => readResults(measurementView), setResults, {
          initial: true,
        });
        setInitializing(false);
        setPlacing(true);
        await measurementView.place({ signal: controller.signal });
      } catch (cause) {
        if (!disposed && !isAbortError(cause)) {
          console.error(cause);
          setResults((previous) => ({
            ...previous,
            error: errorMessage(cause),
          }));
        }
      } finally {
        if (!disposed) {
          setInitializing(false);
          setPlacing(false);
        }
      }
    }
    void initialize();
    return () => {
      disposed = true;
      controller.abort();
      handle?.remove();
      if (analysisView.current) {
        analysisView.current.interactive = false;
        if (analysisView.current.type === "elevation-profile-view-3d") {
          analysisView.current.indicatorRelativePosition = null;
        }
      }
      analysisView.current = null;
      analysis.current = null;
      operation.current = null;
      view.analyses.remove(current);
      current.destroy();
    };
  }, [view, tool, revision]);

  useEffect(() => {
    const current = analysis.current;
    if (!current) {
      return;
    }
    if (current instanceof ElevationProfileAnalysis) {
      current.displayUnits.distance = units === "metric" ? "meters" : "feet";
      current.displayUnits.elevation = units === "metric" ? "meters" : "feet";
    } else {
      current.unit = units;
    }
  }, [units]);

  useEffect(() => {
    const current = analysis.current;
    if (!(current instanceof ElevationProfileAnalysis)) {
      return;
    }
    const sceneProfile = current.profiles.find((profile) => profile.type === "scene");
    if (includeScene && !sceneProfile) {
      current.profiles.add(
        new ElevationProfileLineScene({
          title: "Scene / models",
          color: "#9bc7df",
        }),
      );
    }
    if (!includeScene && sceneProfile) {
      current.profiles.remove(sceneProfile);
    }
  }, [includeScene]);

  const setIndicator = (position: number | null) => {
    if (analysisView.current?.type === "elevation-profile-view-3d") {
      analysisView.current.indicatorRelativePosition = position;
    }
  };

  let instructions = "Drag the measurement handles to edit, or start a new measurement.";

  if (initializing) {
    instructions = "Preparing measurement…";
  } else if (placing) {
    instructions =
      tool === "line"
        ? "Click a start and end point on Mars. Press Escape or Stop drawing to finish."
        : "Click to add points on Mars. Double-click the final point. Press Escape or Stop drawing to finish.";
  }

  return (
    <div className="panel-content">
      <calcite-segmented-control
        label="Measurement tool"
        width="full"
        oncalciteSegmentedControlChange={(event) => {
          const value = event.currentTarget.value;
          if (value === "line" || value === "area" || value === "elevation") {
            setTool(value);
          }
        }}
      >
        <calcite-segmented-control-item value="line" checked={tool === "line"}>
          Line
        </calcite-segmented-control-item>
        <calcite-segmented-control-item value="area" checked={tool === "area"}>
          Area
        </calcite-segmented-control-item>
        <calcite-segmented-control-item value="elevation" checked={tool === "elevation"}>
          Elevation
        </calcite-segmented-control-item>
      </calcite-segmented-control>
      <p className="instructions" role="status">
        {instructions}
      </p>
      <calcite-label>
        Units
        <calcite-select
          label="Measurement units"
          value={units}
          oncalciteSelectChange={(event) => {
            if (
              event.currentTarget.value === "metric" ||
              event.currentTarget.value === "imperial"
            ) {
              setUnits(event.currentTarget.value);
            }
          }}
        >
          <calcite-option value="metric">Metric</calcite-option>
          <calcite-option value="imperial">Imperial</calcite-option>
        </calcite-select>
      </calcite-label>
      {tool === "elevation" && (
        <calcite-label layout="inline">
          Include scene and 3D models
          <calcite-switch
            checked={includeScene}
            oncalciteSwitchChange={(event) => setIncludeScene(event.currentTarget.checked)}
          />
        </calcite-label>
      )}
      {results.error && (
        <calcite-notice open kind="danger">
          <span slot="title">Measurement unavailable</span>
          <span slot="message">{results.error}</span>
        </calcite-notice>
      )}
      {tool === "elevation" && results.hasGeometry && results.progress < 1 && !results.error && (
        <calcite-progress value={results.progress} label="Sampling elevation" />
      )}
      {results.metrics.length > 0 && (
        <dl className="stats" aria-label="Measurement results">
          {results.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {tool === "elevation" && (
        <ElevationChart
          key={`${revision}-${units}`}
          profiles={results.profiles}
          maxDistance={results.statistics?.maxDistance ?? 0}
          distanceUnit={results.distanceUnit}
          elevationUnit={results.elevationUnit}
          onIndicatorChange={setIndicator}
        />
      )}
      <div className="button-row">
        <calcite-button
          iconStart="plus"
          disabled={initializing}
          onClick={() => setRevision((value) => value + 1)}
        >
          New measurement
        </calcite-button>
        {placing && (
          <calcite-button appearance="outline" onClick={() => operation.current?.abort()}>
            Stop drawing
          </calcite-button>
        )}
      </div>
      <p className="muted">
        Measurements use Mars’ planetary spatial reference. Terrain detail is limited by the source
        elevation data.
      </p>
    </div>
  );
}
