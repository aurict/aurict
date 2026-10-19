"use client"

import { useState } from "react"
import { CopyCommand } from "@/components/CopyCommand"
import styles from "./Downloads.module.css"

export type InstallMethod = { id: string; label: string; command: string; note: string }

export function InstallTabs({ methods }: { methods: InstallMethod[] }) {
  const [active, setActive] = useState(methods[0].id)
  const method = methods.find((item) => item.id === active) ?? methods[0]

  return (
    <div className={styles.tabs}>
      <div className={styles.tabList} role="tablist">
        {methods.map((item) => (
          <button
            aria-controls={`install-${item.id}`}
            aria-selected={item.id === active}
            className={styles.tab}
            id={`tab-${item.id}`}
            key={item.id}
            onClick={() => setActive(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div aria-labelledby={`tab-${method.id}`} className={styles.tabPanel} id={`install-${method.id}`} role="tabpanel">
        <CopyCommand command={method.command} />
        <p>{method.note}</p>
      </div>
    </div>
  )
}
