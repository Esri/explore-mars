import { comparisonModes } from "../application/panels";
import { ToolPage } from "../utility-components/ToolPage";

export function ComparePage() {
  return <ToolPage label="Comparison type" tools={Object.values(comparisonModes)} />;
}

export function EditingInfo() {
  return (
    <p className="instructions">
      Drag the handles in the scene to move or rotate the comparison. Its real-world size is
      preserved. Select it again to continue editing. Press Delete to clear it.
    </p>
  );
}
