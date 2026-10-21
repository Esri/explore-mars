import { createContext, use, useState } from "react";
import { Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { useScene } from "../application/SceneContext";
import { measurementTools } from "../application/panels";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";

type Units = "metric" | "imperial";
const MeasurementSettings = createContext<{
  units: Units;
  setUnits: (units: Units) => void;
  includeScene: boolean;
  setIncludeScene: (includeScene: boolean) => void;
} | null>(null);

export function useMeasurementSettings() {
  const settings = use(MeasurementSettings);
  if (!settings) {
    throw new Error("Measurement tools must render within a measurement route.");
  }
  return settings;
}

export function MeasurePage() {
  const { reportError } = useScene();
  const activePath = useMatches({ select: (matches) => matches.at(-1)?.fullPath });
  const navigate = useNavigate();
  const [units, setUnits] = useState<Units>("metric");
  const [includeScene, setIncludeScene] = useState(true);

  return (
    <MeasurementSettings value={{ units, setUnits, includeScene, setIncludeScene }}>
      <calcite-segmented-control
        label="Measurement tool"
        width="full"
        oncalciteSegmentedControlChange={(event) => {
          const value = event.currentTarget.value;
          if (value === "line" || value === "area" || value === "elevation") {
            void navigate({ to: measurementTools[value].to }).catch(reportError);
          }
        }}
      >
        {Object.entries(measurementTools).map(([tool, { to, label }]) => (
          <calcite-segmented-control-item key={tool} value={tool} checked={activePath === to}>
            {label}
          </calcite-segmented-control-item>
        ))}
      </calcite-segmented-control>
      <Outlet />
    </MeasurementSettings>
  );
}
