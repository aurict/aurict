import { Fragment } from "react";

// Plus Jakarta's period and comma carry a wide left bearing; pull them in on tightly tracked headlines.
export function TightPeriods({ text }: { text: string }) {
  const parts = text.split(/([.,])/);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part === "." || part === "," ? <span style={{ marginLeft: "-0.07em" }}>{part}</span> : part}
        </Fragment>
      ))}
    </>
  );
}
