import { Suspense, useEffect, useRef } from "react";
import { Link, Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { errorMessage } from "../utilities/errors";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-loader";
import "@esri/calcite-components/components/calcite-notice";
import "@esri/calcite-components/components/calcite-panel";

export function ToolPanel() {
  const heading = useMatches({
    select: (matches) =>
      matches.findLast((match) => match.staticData.panelTitle)?.staticData.panelTitle,
  });
  const description = useMatches({
    select: (matches) =>
      matches.findLast((match) => match.staticData.panelDescription)?.staticData.panelDescription,
  });
  const panel = useRef<HTMLCalcitePanelElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void panel.current?.setFocus();
  }, [heading]);

  if (!heading) {
    throw new Error("Panel routes must provide a panel title.");
  }

  return (
    <calcite-panel
      key={heading}
      ref={panel}
      id="tool-panel"
      slot="top-right"
      className="tool-panel"
      heading={heading}
      description={description}
      closable
      oncalcitePanelClose={() => {
        void navigate({ to: "/" });
      }}
    >
      <Suspense fallback={<PanelLoading />}>
        <Outlet />
      </Suspense>
    </calcite-panel>
  );
}

export function PanelLoading() {
  return <calcite-loader label="Loading panel" text="Loading panel" />;
}

export function PanelError({ error }: ErrorComponentProps) {
  return (
    <calcite-notice open kind="danger">
      <span slot="title">Could not open this view</span>
      <span slot="message">{errorMessage(error)}</span>
      <calcite-button slot="link" appearance="transparent" onClick={() => window.location.reload()}>
        Reload app
      </calcite-button>
    </calcite-notice>
  );
}

export function NotFoundPanel() {
  return (
    <calcite-notice open kind="warning">
      <span slot="title">Page not found</span>
      <span slot="message">There is no Explore Mars panel at this address.</span>
      <Link slot="link" to="/">
        Return to Mars
      </Link>
    </calcite-notice>
  );
}
