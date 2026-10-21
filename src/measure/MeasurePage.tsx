import { measurementTools } from "../application/panels";
import { ToolPage } from "../utility-components/ToolPage";
import "./MeasurePage.css";

export function MeasurePage() {
  return <ToolPage label="Measurement tool" tools={Object.values(measurementTools)} />;
}
