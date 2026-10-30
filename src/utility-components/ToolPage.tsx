import { Outlet, useMatches, useNavigate, type LinkProps } from "@tanstack/react-router";
import { useScene } from "../application/SceneContext";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";
import "./ToolPage.css";

interface ToolPageProps {
  label: string;
  tools: readonly { to: NonNullable<LinkProps["to"]>; label: string }[];
}

export function ToolPage({ label, tools }: ToolPageProps) {
  const { reportError } = useScene();
  const activePath = useMatches({ select: (matches) => matches.at(-1)?.fullPath });
  const navigate = useNavigate();

  return (
    <div className="tool-page">
      <calcite-segmented-control
        label={label}
        width="full"
        oncalciteSegmentedControlChange={(event) => {
          const tool = tools.find(({ to }) => to === event.currentTarget.value);
          if (tool) {
            void navigate({ to: tool.to }).catch(reportError);
          }
        }}
      >
        {tools.map(({ to, label }) => (
          <calcite-segmented-control-item key={to} value={to} checked={activePath === to}>
            {label}
          </calcite-segmented-control-item>
        ))}
      </calcite-segmented-control>
      <Outlet />
    </div>
  );
}
