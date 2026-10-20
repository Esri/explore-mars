import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@esri/calcite-components/main.css";
import "@arcgis/map-components/main.css";
import "./general.css";
import Application from "./application/Application";

const container = document.getElementById("application");
if (!container) {
  throw new Error("The application mount point is missing.");
}

const queryClient = new QueryClient();

createRoot(container).render(
  <QueryClientProvider client={queryClient}>
    <Application />
  </QueryClientProvider>,
);
