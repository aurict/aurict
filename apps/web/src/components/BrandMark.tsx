import Image from "next/image"
import { Link } from "@/i18n/navigation"

type BrandMarkProps = {
  href?: string
  size?: "nav" | "auth"
}

export function BrandMark({ href = "/", size = "nav" }: BrandMarkProps) {
  const content = (
    <>
      <span className={`brand-logo-shell brand-logo-shell-${size}`} aria-hidden="true">
        <Image
          alt=""
          className="brand-logo"
          height={size === "auth" ? 58 : 30}
          priority
          src="/aurict-logo-v5.svg"
          width={size === "auth" ? 58 : 30}
        />
      </span>
      <span className={`brand-word brand-word-${size}`}>aurict</span>
    </>
  )

  if (!href) {
    return <span className="brand-lockup">{content}</span>
  }

  return (
    <Link className={`brand-lockup brand-lockup-${size}`} href={href}>
      {content}
    </Link>
  )
}
