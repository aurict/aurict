import Link from "next/link";

export function BrandMark() {
  return (
    <Link className="brand-lockup" href="/" aria-label="Aurict Mobile — home">
      <span className="brand-lockup-strong">aurict</span>
      <span className="brand-lockup-light">mobile</span>
    </Link>
  );
}
