import { useEffect, useEffectEvent, useState } from "react";
import { defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { PanelSection } from "../utility-components/PanelSection";
import {
  formatValue,
  formatUnit,
  relativePosition,
  type ProfileSample,
  type ProfileSeries,
} from "./profile";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-slider";
import "./ElevationChart.css";

interface Props {
  profiles: ProfileSeries[];
  maxDistance: number;
  distanceUnit: string;
  elevationUnit: string;
  onIndicatorChange: (position: number | null) => void;
}

export function ElevationChart({
  profiles,
  maxDistance,
  distanceUnit,
  elevationUnit,
  onIndicatorChange,
}: Props) {
  const [range, setRange] = useState<[number, number]>([0, 100]);
  const [focused, setFocused] = useState<ProfileSample | null>(null);
  const clearIndicator = useEffectEvent(() => onIndicatorChange(null));
  useEffect(() => () => clearIndicator(), []);
  const hasSamples = profiles.some((profile) =>
    profile.samples.some((sample) => sample.elevation != null && Number.isFinite(sample.elevation)),
  );
  const definition = defineChart({
    marks: profiles.map((profile, index) =>
      lineY(profile.samples, {
        id: profile.id,
        x: "distance",
        y: "elevation",
        stroke: index === 0 ? "#f6a17b" : "#9bc7df",
        strokeWidth: 2,
      }),
    ),
    scales: {
      x: {
        scale: scaleLinear,
        domain: [(maxDistance * range[0]) / 100, Math.max((maxDistance * range[1]) / 100, 0.01)],
        axis: { label: `Distance (${formatUnit(distanceUnit)})` },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { label: `Elevation (${formatUnit(elevationUnit)})` },
      },
    },
    clip: true,
    focus: "group-x",
    keyboard: true,
    svgAnimation: false,
    tooltip,
  });

  if (!hasSamples) {
    return (
      <p className="muted">
        Draw a path to see its elevation profile. Missing terrain samples appear as gaps, not zero
        elevations.
      </p>
    );
  }
  return (
    <PanelSection label="Elevation profile">
      <h3>Elevation profile</h3>
      <div className="profile-legend">
        {profiles.map((profile, index) => (
          <span key={profile.id} className={index ? "scene-series" : ""}>
            {profile.title}
          </span>
        ))}
      </div>
      <Chart
        definition={definition}
        className="profile-chart"
        height={240}
        ariaLabel="Elevation along the measured path"
        ariaDescription="Use the left and right arrow keys to inspect samples. The focused sample is also highlighted on Mars. Use the distance range control to zoom."
        onFocusChange={(point) => {
          setFocused(point?.datum ?? null);
          onIndicatorChange(point ? relativePosition(point.datum.distance, maxDistance) : null);
        }}
      />
      <p className="muted profile-readout" aria-live="polite">
        {focused
          ? `${formatValue(focused.distance, distanceUnit)} along path · ${formatValue(focused.elevation, elevationUnit)} elevation`
          : "Hover, touch, or focus the chart and use arrow keys to inspect elevation."}
      </p>
      <calcite-label>
        Visible distance range (%)
        <calcite-slider
          label="Visible distance range"
          min={0}
          max={100}
          minValue={range[0]}
          maxValue={range[1]}
          minLabel="Start percentage"
          maxLabel="End percentage"
          step={1}
          oncalciteSliderInput={(event) => {
            const start = event.currentTarget.minValue;
            const end = event.currentTarget.maxValue;
            if (start < end) {
              setRange([start, end]);
            }
          }}
        />
      </calcite-label>
      <calcite-button
        className="profile-reset"
        width="full"
        appearance="outline"
        scale="s"
        onClick={() => setRange([0, 100])}
      >
        Reset zoom
      </calcite-button>
    </PanelSection>
  );
}
