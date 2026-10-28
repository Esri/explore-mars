export const panels = {
  locations: {
    to: "/locations",
    label: "Locations",
    icon: "map-pin",
  },
  measure: {
    to: "/measure",
    label: "Measure",
    icon: "measure",
  },
  compare: {
    to: "/compare",
    label: "Compare",
    icon: "compare",
  },
  about: {
    to: "/about",
    label: "Credits",
    icon: "information",
  },
} as const;

export const measurementTools = {
  line: { to: "/measure/line", label: "Line" },
  area: { to: "/measure/area", label: "Area" },
  elevation: { to: "/measure/elevation", label: "Elevation" },
} as const;

export const comparisonModes = {
  models: { to: "/compare/models", label: "Models" },
  regions: { to: "/compare/regions", label: "Regions" },
} as const;
