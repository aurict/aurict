"use client"
import { useState, useEffect, useRef } from "react"

interface AnimatedCounterProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
}

function AnimatedCounter({ end, duration = 2000, suffix = "", prefix = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = performance.now()

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(easeOut * end))

            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              setCount(end)
            }
          }

          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  )
}

interface Stat {
  value: number
  label: string
  detail: string
  suffix?: string
  prefix?: string
}

interface AnimatedStatsProps {
  stats: Stat[]
}

export function AnimatedStats({ stats }: AnimatedStatsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 1,
        background: "var(--border)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            background: "var(--bg-subtle)",
            padding: "40px 36px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              marginBottom: 10,
              background: "linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <AnimatedCounter
              end={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
            />
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 10,
              letterSpacing: "-0.01em",
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-dim)",
              lineHeight: 1.6,
            }}
          >
            {stat.detail}
          </div>
        </div>
      ))}
    </div>
  )
}
