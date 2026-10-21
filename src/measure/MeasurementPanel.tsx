import type { ReactNode } from "react";
import { useMeasurementSettings } from "./MeasurePage";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-notice";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-select";
import "./MeasurementPanel.css";

interface Props {
  measurement: {
    initializing: boolean;
    placing: boolean;
    error: string | null;
    start: (() => void) | undefined;
    stop: () => void;
  };
  instructions: string;
  error?: string | null;
  children: ReactNode;
}

export function MeasurementPanel({ measurement, instructions, error, children }: Props) {
  const { units, setUnits } = useMeasurementSettings();
  const message = measurement.error ?? error;

  return (
    <>
      <p className="instructions" role="status">
        {measurement.initializing
          ? "Preparing measurement..."
          : measurement.placing
            ? instructions
            : "Drag the measurement handles to edit, or start a new measurement."}
      </p>
      <calcite-label>
        Units
        <calcite-select
          label="Measurement units"
          value={units}
          oncalciteSelectChange={(event) => {
            const value = event.currentTarget.value;
            if (value === "metric" || value === "imperial") {
              setUnits(value);
            }
          }}
        >
          <calcite-option value="metric">Metric</calcite-option>
          <calcite-option value="imperial">Imperial</calcite-option>
        </calcite-select>
      </calcite-label>
      {message && (
        <calcite-notice open kind="danger">
          <span slot="title">Measurement unavailable</span>
          <span slot="message">{message}</span>
        </calcite-notice>
      )}
      {children}
      <div className="measurement-actions">
        <calcite-button
          iconStart="plus"
          disabled={measurement.initializing || !measurement.start}
          onClick={measurement.start}
        >
          New measurement
        </calcite-button>
        {measurement.placing && (
          <calcite-button appearance="outline" onClick={measurement.stop}>
            Stop drawing
          </calcite-button>
        )}
      </div>
      <p className="muted">
        Measurements use Mars' planetary spatial reference. Terrain detail is limited by the source
        elevation data.
      </p>
    </>
  );
}

export function MeasurementMetrics({ metrics }: { metrics: { label: string; value: string }[] }) {
  if (!metrics.length) {
    return null;
  }
  return (
    <dl className="stats" aria-label="Measurement results">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}
