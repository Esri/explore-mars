import { useEffect } from "react";
import ElevationProfileAnalysis from "@arcgis/core/analysis/ElevationProfileAnalysis";
import ElevationProfileLineGround from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineGround";
import ElevationProfileLineScene from "@arcgis/core/analysis/ElevationProfile/ElevationProfileLineScene";
import type ElevationProfileAnalysisView3D from "@arcgis/core/views/3d/analysis/ElevationProfileAnalysisView3D";
import type { ElevationProfileStatistics } from "@arcgis/core/views/analysis/ElevationProfile/types";
import { useMeasurementSettings } from "./MeasurePage";
import { MeasurementMetrics, MeasurementPanel } from "./MeasurementPanel";
import { useMeasurement } from "./useMeasurement";
import { ElevationChart } from "./ElevationChart";
import { formatValue, type ProfileSeries } from "./profile";
import { errorMessage } from "../utilities/errors";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-progress";
import "@esri/calcite-components/components/calcite-switch";

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

function readResults(analysisView: ElevationProfileAnalysisView3D): Results {
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
          { label: "Distance", value: formatValue(statistics.maxDistance, distanceUnit) },
          {
            label: "Elevation range",
            value: `${formatValue(statistics.minElevation, elevationUnit)} – ${formatValue(statistics.maxElevation, elevationUnit)}`,
          },
          { label: "Elevation gain", value: formatValue(statistics.elevationGain, elevationUnit) },
          { label: "Elevation loss", value: formatValue(statistics.elevationLoss, elevationUnit) },
        ]
      : [],
    progress: analysisView.progress,
    hasGeometry: analysisView.analysis.geometry != null,
    error: analysisView.error ? errorMessage(analysisView.error) : null,
  };
}

export function ElevationProfilePage() {
  const { units, includeScene, setIncludeScene } = useMeasurementSettings();
  const measurement = useMeasurement(
    () =>
      new ElevationProfileAnalysis({
        profiles: [
          new ElevationProfileLineGround({ title: "Terrain", color: "#f6a17b" }),
          ...(includeScene
            ? [new ElevationProfileLineScene({ title: "Scene / models", color: "#9bc7df" })]
            : []),
        ],
        displayUnits: {
          distance: units === "metric" ? "meters" : "feet",
          elevation: units === "metric" ? "meters" : "feet",
        },
      }),
    readResults,
    emptyResults,
  );
  const { analysisView, results } = measurement;

  useEffect(() => {
    if (analysisView) {
      analysisView.analysis.displayUnits.distance = units === "metric" ? "meters" : "feet";
      analysisView.analysis.displayUnits.elevation = units === "metric" ? "meters" : "feet";
    }
  }, [analysisView, units]);

  useEffect(() => {
    if (!analysisView) {
      return;
    }
    const profiles = analysisView.analysis.profiles;
    const sceneProfile = profiles.find((profile) => profile.type === "scene");
    if (includeScene && !sceneProfile) {
      profiles.add(new ElevationProfileLineScene({ title: "Scene / models", color: "#9bc7df" }));
    } else if (!includeScene && sceneProfile) {
      profiles.remove(sceneProfile);
    }
  }, [analysisView, includeScene]);

  const setIndicator = (position: number | null) => {
    if (analysisView && !analysisView.destroyed) {
      analysisView.indicatorRelativePosition = position;
    }
  };

  return (
    <MeasurementPanel
      measurement={measurement}
      error={results.error}
      instructions="Click to add points on Mars. Double-click the final point. Press Escape or Stop drawing to finish."
    >
      <calcite-label layout="inline">
        Include scene and 3D models
        <calcite-switch
          checked={includeScene}
          oncalciteSwitchChange={(event) => setIncludeScene(event.currentTarget.checked)}
        />
      </calcite-label>
      {results.hasGeometry && results.progress < 1 && !results.error && !measurement.error && (
        <calcite-progress value={results.progress} label="Sampling elevation" />
      )}
      <MeasurementMetrics metrics={results.metrics} />
      <ElevationChart
        key={units}
        profiles={results.profiles}
        maxDistance={results.statistics?.maxDistance ?? 0}
        distanceUnit={results.distanceUnit}
        elevationUnit={results.elevationUnit}
        onIndicatorChange={setIndicator}
      />
    </MeasurementPanel>
  );
}
