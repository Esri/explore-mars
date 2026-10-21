import { useEffect } from "react";
import AreaMeasurementAnalysis from "@arcgis/core/analysis/AreaMeasurementAnalysis";
import type AreaMeasurementAnalysisView3D from "@arcgis/core/views/3d/analysis/AreaMeasurementAnalysisView3D";
import { useMeasurementSettings } from "./MeasurePage";
import { MeasurementMetrics, MeasurementPanel } from "./MeasurementPanel";
import { useMeasurement } from "./useMeasurement";
import { formatQuantity } from "./profile";

function readResults(analysisView: AreaMeasurementAnalysisView3D) {
  const result = analysisView.result;
  return result
    ? [
        { label: "Area", value: formatQuantity(result.area) },
        { label: "Perimeter", value: formatQuantity(result.perimeter) },
      ]
    : [];
}

export function AreaMeasurementPage() {
  const { units } = useMeasurementSettings();
  const measurement = useMeasurement(
    () => new AreaMeasurementAnalysis({ unit: units }),
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
      instructions="Click to add points on Mars. Double-click the final point. Press Escape or Stop drawing to finish."
    >
      <MeasurementMetrics metrics={results} />
    </MeasurementPanel>
  );
}
