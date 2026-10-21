import type { Area, Length } from "@arcgis/core/core/quantity";

export interface ProfileSample {
  distance: number;
  elevation: number | null;
}
export interface ProfileSeries {
  id: string;
  title: string;
  samples: ProfileSample[];
}

export function formatQuantity(value: Length | Area | null | undefined) {
  return value ? formatValue(value.value, value.unit) : "Not available";
}

export function formatValue(value: number | null | undefined, unit: string) {
  if (value == null || !Number.isFinite(value)) {
    return "Not available";
  }
  return unitParts(value, unit)
    .map((part) => part.value)
    .join("");
}

export function formatUnit(unit: string) {
  return unitParts(1, unit)
    .filter((part) => part.type === "unit")
    .map((part) => part.value)
    .join("");
}

function unitParts(value: number, unit: string) {
  const squared = unit.startsWith("square-");
  const baseUnit = squared ? unit.slice("square-".length) : unit;
  let singular = baseUnit.replace(/s$/, "");
  if (baseUnit === "feet") {
    singular = "foot";
  } else if (baseUnit === "inches") {
    singular = "inch";
  }
  const formatter = new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: singular,
    unitDisplay: "short",
    maximumFractionDigits: 2,
  });

  // Intl supports linear units, but not square-meter/square-foot identifiers.
  return formatter.formatToParts(value).map((part) => ({
    ...part,
    value: part.type === "unit" && squared ? `${part.value}²` : part.value,
  }));
}

export function relativePosition(distance: number, maxDistance: number) {
  if (!Number.isFinite(distance) || !Number.isFinite(maxDistance) || maxDistance <= 0) {
    return null;
  }
  return Math.max(0, Math.min(1, distance / maxDistance));
}
