import { useEffect } from "react";
import DirectLineMeasurementAnalysis from "@arcgis/core/analysis/DirectLineMeasurementAnalysis";
import type DirectLineMeasurementAnalysisView3D from "@arcgis/core/views/3d/analysis/DirectLineMeasurementAnalysisView3D";
import { useMeasurementSettings } from "./MeasurePage";
import { MeasurementMetrics, MeasurementPanel } from "./MeasurementPanel";
import { useMeasurement } from "./useMeasurement";
import { formatQuantity } from "./profile";

function readResults(analysisView: DirectLineMeasurementAnalysisView3D) {
  const result = analysisView.result;
  return result
    ? [
        { label: "Direct distance", value: formatQuantity(result.directDistance) },
        { label: "Horizontal distance", value: formatQuantity(result.horizontalDistance) },
        { label: "Vertical distance", value: formatQuantity(result.verticalDistance) },
      ]
    : [];
}

export function LineMeasurementPage() {
  const { units } = useMeasurementSettings();
  const measurement = useMeasurement(
    () => new DirectLineMeasurementAnalysis({ unit: units }),
    readResults,
    [],
  );
  const { analysisView, results } = measurement;

  useEffect(() => {
    if (analysisView) {
      analysisView.analysis.unit = units;
    }
  }, [analysisView, units]);

  return (
    <MeasurementPanel
      measurement={measurement}
      instructions="Click a start and end point on Mars. Press Escape or Stop drawing to finish."
    >
      <MeasurementMetrics metrics={results} />
    </MeasurementPanel>
  );
}
