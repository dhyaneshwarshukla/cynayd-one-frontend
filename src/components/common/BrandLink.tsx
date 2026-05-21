"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

type BrandVariant = "default" | "light" | "compact";

export interface BrandLinkProps {
  /** Landing page (home). */
  href?: string;
  variant?: BrandVariant;
  /** Display "CYNAYD One" vs "CYNAYD". */
  name?: "CYNAYD" | "CYNAYD One";
  className?: string;
}

const variantStyles: Record<
  BrandVariant,
  { title: string; logo: string; icon?: string }
> = {
  default: {
    title: "text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors",
    logo: "w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0",
  },
  light: {
    title: "text-3xl font-bold text-white group-hover:text-blue-100 transition-colors",
    logo: "w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 shrink-0 glass-morphism glow-effect group-hover:bg-white/30 transition-colors",
    icon: "w-7 h-7 text-white",
  },
  compact: {
    title:
      "text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors",
    logo: "w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shrink-0 glow-effect group-hover:bg-blue-700 transition-colors",
    icon: "w-6 h-6 text-white",
  },
};

export const BrandLink: React.FC<BrandLinkProps> = ({
  href = "/",
  variant = "default",
  name = "CYNAYD One",
  className = "",
}) => {
  const styles = variantStyles[variant];
  const showShield = variant === "light" || variant === "compact";

  return (
    <Link
      href={href}
      className={`inline-flex items-center space-x-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
      aria-label="Go to home"
    >
      <div className={styles.logo}>
        {showShield ? (
          <Shield className={styles.icon} aria-hidden />
        ) : (
          <span className="text-white font-bold text-sm" aria-hidden>
            C
          </span>
        )}
      </div>
      <span className={styles.title}>{name}</span>
    </Link>
  );
};
