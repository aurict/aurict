import Image from "next/image";
import Link from "next/link";
import styles from "./BrandMark.module.css";

export function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link href="/" className={`${styles.brand} ${tone === "light" ? styles.light : ""}`} aria-label="Quaera home">
      <Image src="/art/logo.webp" alt="" width={40} height={40} className={styles.mark} priority />
      <span className={styles.word}>Quaera</span>
    </Link>
  );
}
