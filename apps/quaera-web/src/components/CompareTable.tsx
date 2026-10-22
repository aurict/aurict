import { COMPARE_COLUMNS, COMPARE_ROWS } from "@/content/site";

export function CompareTable() {
  return (
    <div className="table-scroll" style={{ marginTop: 48 }} tabIndex={0} role="region" aria-label="Comparison table">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Capability</th>
            {COMPARE_COLUMNS.map((col) => (
              <th key={col} scope="col">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.cells.map((cell, i) => (
                <td key={i} className={i === 0 ? "ours" : undefined}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
