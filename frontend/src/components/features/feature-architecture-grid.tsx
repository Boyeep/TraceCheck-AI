import type { FeatureArchitectureColumn } from "../../features";

export const FeatureArchitectureGrid = ({
  columns,
}: {
  columns: FeatureArchitectureColumn[];
}) => (
  <div className="architecture-grid">
    {columns.map((column) => (
      <article className="architecture-card" key={column.title}>
        <h3>{column.title}</h3>
        <ul className="feature-list">
          {column.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    ))}
  </div>
);
