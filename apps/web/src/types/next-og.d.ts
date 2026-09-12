import type { ReactElement } from "react"

declare module "next/dist/compiled/@vercel/og" {
  export interface ImageResponseOptions {
    width?: number
    height?: number
    fonts?: Array<{
      name: string
      data: ArrayBuffer
      weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
      style?: "normal" | "italic"
      lang?: string
    }>
    emoji?: "twemoji" | "blobmoji" | "noto" | "openmoji" | "fluent" | "fluentFlat"
    debug?: boolean
    status?: number
    statusText?: string
    headers?: HeadersInit
  }

  export class ImageResponse extends Response {
    static displayName: string
    constructor(element: ReactElement, options?: ImageResponseOptions)
  }
}

declare module "next/og" {
  export interface ImageResponseOptions {
    width?: number
    height?: number
    fonts?: Array<{
      name: string
      data: ArrayBuffer
      weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
      style?: "normal" | "italic"
      lang?: string
    }>
    emoji?: "twemoji" | "blobmoji" | "noto" | "openmoji" | "fluent" | "fluentFlat"
    debug?: boolean
    status?: number
    statusText?: string
    headers?: HeadersInit
  }

  export class ImageResponse extends Response {
    static displayName: string
    constructor(element: ReactElement, options?: ImageResponseOptions)
  }
}
