import { comparisonModes } from "../application/panels";
import { ToolPage } from "../utility-components/ToolPage";

export function ComparePage() {
  return <ToolPage label="Comparison type" tools={Object.values(comparisonModes)} />;
}

export function EditingInfo() {
  return (
    <p className="instructions">
      Move the object in the view using the handles. Press "delete" to remove the object.
    </p>
  );
}
