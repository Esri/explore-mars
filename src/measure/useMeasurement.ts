import { useEffect, useEffectEvent, useRef, useState } from "react";
import type Analysis from "@arcgis/core/analysis/Analysis";
import type { AnalysisView3DFor } from "@arcgis/core/views/3d/analysis/types";
import type { ResourceHandle } from "@arcgis/core/core/Handles";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { useScene } from "../application/SceneContext";
import { errorMessage, isAbortError } from "../utilities/errors";

type MeasurementAnalysis = Analysis & {
  readonly type: "area-measurement" | "direct-line-measurement" | "elevation-profile";
};
type MeasurementView = AnalysisView3DFor<MeasurementAnalysis>;

export function useMeasurement<A extends MeasurementAnalysis, R>(
  createAnalysis: () => A,
  readResults: (analysisView: AnalysisView3DFor<A>) => R,
  initialResults: R,
) {
  const { view } = useScene();
  const [analysisView, setAnalysisView] = useState<AnalysisView3DFor<A> | null>(null);
  const [results, setResults] = useState(initialResults);
  const [initializing, setInitializing] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operation = useRef<AbortController | null>(null);
  const create = useEffectEvent(() => {
    setResults(initialResults);
    return createAnalysis();
  });

  const place = async (current: MeasurementView) => {
    operation.current?.abort();
    const controller = new AbortController();
    operation.current = controller;
    setError(null);
    setPlacing(true);
    try {
      await current.place({ signal: controller.signal });
    } catch (cause) {
      if (operation.current === controller && !isAbortError(cause)) {
        console.error(cause);
        setError(errorMessage(cause));
      }
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setPlacing(false);
      }
    }
  };
  const placeOnReady = useEffectEvent(place);

  useEffect(() => {
    let disposed = false;
    let currentView: AnalysisView3DFor<A> | null = null;
    let handle: ResourceHandle | undefined;
    const analysis = create();
    view.analyses.add(analysis);
    setAnalysisView(null);
    setInitializing(true);
    setError(null);

    async function initialize() {
      try {
        const ready = await view.whenAnalysisView<A>(analysis);
        if (disposed) {
          return;
        }
        currentView = ready;
        ready.interactive = true;
        handle = reactiveUtils.watch(() => readResults(ready), setResults, { initial: true });
        setAnalysisView(ready);
        setInitializing(false);
        await placeOnReady(ready);
      } catch (cause) {
        if (!disposed) {
          console.error(cause);
          setError(errorMessage(cause));
          setInitializing(false);
        }
      }
    }

    void initialize();
    return () => {
      disposed = true;
      operation.current?.abort();
      operation.current = null;
      handle?.remove();
      if (currentView) {
        currentView.interactive = false;
      }
      view.analyses.remove(analysis);
      analysis.destroy();
    };
  }, [view, readResults]);

  return {
    analysisView,
    results,
    initializing,
    placing,
    error,
    start: analysisView ? () => void place(analysisView) : undefined,
    stop: () => operation.current?.abort(),
  };
}
