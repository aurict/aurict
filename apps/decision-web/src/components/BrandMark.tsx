import { Link } from "@/i18n/navigation";
import Image from "next/image";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-link">
      <div className="brand-logo-shell" aria-hidden="true">
        <Image src="/brand-mark.svg" alt="" width={27} height={27} priority />
      </div>
      {!compact && (
        <>
          <span className="brand-wordmark">aurict decision</span>
          <span className="brand-cursor" aria-hidden="true">&#x258A;</span>
        </>
      )}
    </Link>
  );
}
