import { Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { useScene } from "../application/SceneContext";
import { comparisonModes } from "../application/panels";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";

export function ComparePage() {
  const { reportError } = useScene();
  const activePath = useMatches({ select: (matches) => matches.at(-1)?.fullPath });
  const navigate = useNavigate();

  return (
    <>
      <calcite-segmented-control
        label="Comparison type"
        width="full"
        oncalciteSegmentedControlChange={(event) => {
          const value = event.currentTarget.value;
          if (value === "models" || value === "regions") {
            void navigate({ to: comparisonModes[value].to }).catch(reportError);
          }
        }}
      >
        {Object.entries(comparisonModes).map(([mode, { to, label }]) => (
          <calcite-segmented-control-item key={mode} value={mode} checked={activePath === to}>
            {label}
          </calcite-segmented-control-item>
        ))}
      </calcite-segmented-control>
      <Outlet />
    </>
  );
}

export function EditingInfo() {
  return (
    <p className="instructions">
      Drag the handles in the scene to move or rotate the comparison. Its real-world size is
      preserved. Select it again to continue editing. Press Delete or use Remove to clear it.
    </p>
  );
}
