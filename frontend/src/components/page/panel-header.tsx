import type { ReactNode } from "react";

type PanelHeaderProps = {
  label: string;
  title: string;
  aside?: ReactNode;
};

export const PanelHeader = ({
  label,
  title,
  aside,
}: PanelHeaderProps) => (
  <div className="section-heading">
    <div>
      <p className="panel-label">{label}</p>
      <h2>{title}</h2>
    </div>
    {aside}
  </div>
);
