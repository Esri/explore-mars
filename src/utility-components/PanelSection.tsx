import type { ReactNode } from "react";
import "./PanelSection.css";

interface PanelSectionProps {
  children: ReactNode;
  label?: string;
}

export function PanelSection({ children, label }: PanelSectionProps) {
  return (
    <section className="panel-section" aria-label={label}>
      {children}
    </section>
  );
}
