import { Link } from "@/i18n/navigation";

export function BrandMark() {
  return (
    <Link href="/" className="brand-link" aria-label="Aurict Decision — home">
      <span className="brand-wordmark">
        <b>aurict</b> decision
      </span>
    </Link>
  );
}
