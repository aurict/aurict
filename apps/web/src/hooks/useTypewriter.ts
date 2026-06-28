"use client"
import { useState, useEffect, useRef } from "react"

export function useTypewriter(text: string, speed = 28, active = true) {
  const [displayed, setDisplayed] = useState("")
  const indexRef = useRef(0)

  useEffect(() => {
    if (!active) return
    indexRef.current = 0
    const reset = window.setTimeout(() => setDisplayed(""), 0)

    const interval = setInterval(() => {
      indexRef.current++
      setDisplayed(text.slice(0, indexRef.current))
      if (indexRef.current >= text.length) clearInterval(interval)
    }, speed)

    return () => {
      window.clearTimeout(reset)
      clearInterval(interval)
    }
  }, [text, speed, active])

  return { displayed, done: displayed.length === text.length }
}
