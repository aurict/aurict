import { Fragment } from "react"

// Plus Jakarta's period carries a wide left bearing; pull every period in on tightly tracked headlines.
export function TightPeriods({ text }: { text: string }) {
  const parts = text.split(".")
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <span style={{ marginLeft: "-0.07em" }}>.</span>}
        </Fragment>
      ))}
    </>
  )
}
