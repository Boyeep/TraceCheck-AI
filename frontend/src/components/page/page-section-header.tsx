import type { ReactNode } from "react";

type PageSectionHeaderProps = {
  eyebrow: string;
  title?: string;
  aside?: ReactNode;
  className?: string;
};

export const PageSectionHeader = ({
  eyebrow,
  title,
  aside,
  className,
}: PageSectionHeaderProps) => (
  <div className={className ?? "section-header"}>
    <div>
      <p className="eyebrow">{eyebrow}</p>
      {title ? <h2 className="section-title">{title}</h2> : null}
    </div>
    {aside}
  </div>
);
