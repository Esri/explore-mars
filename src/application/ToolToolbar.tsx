import { useMatches, useNavigate } from "@tanstack/react-router";
import { useScene } from "./SceneContext";
import { panels } from "./panels";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-action-bar";

export function ToolToolbar() {
  const { reportError } = useScene();
  const activePanel = useMatches({
    select: (matches) => matches.find((match) => match.staticData.panelTitle)?.fullPath,
  });
  const navigate = useNavigate();

  return (
    <calcite-action-bar
      slot="bottom-center"
      aria-label="Explore Mars tools"
      layout="horizontal"
      floating
      expandToggleDisabled
      selectionAppearance="highlight"
    >
      {Object.values(panels).map((panel) => {
        const active = activePanel === panel.to;
        return (
          <calcite-action
            key={panel.to}
            text={panel.label}
            icon={panel.icon}
            active={active}
            aria-pressed={active}
            aria-controls={active ? "tool-panel" : undefined}
            onClick={() => {
              void navigate({ to: active ? "/" : panel.to }).catch(reportError);
            }}
          />
        );
      })}
    </calcite-action-bar>
  );
}
