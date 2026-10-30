import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import "@esri/calcite-components/main.css";
import "@arcgis/map-components/main.css";
import "./general.css";
import { router } from "./router";

const container = document.getElementById("application");
if (!container) {
  throw new Error("The application mount point is missing.");
}

const queryClient = new QueryClient();

createRoot(container).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
