"use client";

import Image from "next/image";
import Link from "next/link";

type BrandVariant = "default" | "light" | "compact";

export interface BrandLinkProps {
  /** Landing page (home). */
  href?: string;
  variant?: BrandVariant;
  /** Display "CYNAYD One" vs "CYNAYD". */
  name?: "CYNAYD" | "CYNAYD One";
  className?: string;
}

const LOGO_ICON = "/cynayd-logo-icon-only.png";
const LOGO_FULL = "/cynayd-logo.png";

const variantStyles: Record<
  BrandVariant,
  {
    title: string;
    iconSize: number;
    showText: boolean;
    useFullLogo: boolean;
    fullLogoWidth: number;
    fullLogoHeight: number;
  }
> = {
  default: {
    title: "text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors",
    iconSize: 32,
    showText: true,
    useFullLogo: false,
    fullLogoWidth: 160,
    fullLogoHeight: 36,
  },
  light: {
    title: "text-3xl font-bold text-white group-hover:text-blue-100 transition-colors",
    iconSize: 48,
    showText: false,
    useFullLogo: true,
    fullLogoWidth: 200,
    fullLogoHeight: 44,
  },
  compact: {
    title:
      "text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors",
    iconSize: 40,
    showText: true,
    useFullLogo: false,
    fullLogoWidth: 180,
    fullLogoHeight: 40,
  },
};

export const BrandLink: React.FC<BrandLinkProps> = ({
  href = "/",
  variant = "default",
  name = "CYNAYD One",
  className = "",
}) => {
  const styles = variantStyles[variant];

  return (
    <Link
      href={href}
      className={`inline-flex items-center space-x-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
      aria-label="Go to home"
    >
      {styles.useFullLogo ? (
        <Image
          src={LOGO_FULL}
          alt="CYNAYD"
          width={styles.fullLogoWidth}
          height={styles.fullLogoHeight}
          className="h-10 w-auto shrink-0 object-contain"
          priority
        />
      ) : (
        <>
          <Image
            src={LOGO_ICON}
            alt=""
            width={styles.iconSize}
            height={styles.iconSize}
            className="shrink-0 rounded-lg object-contain"
            aria-hidden
          />
          {styles.showText ? (
            <span className={styles.title}>{name}</span>
          ) : null}
        </>
      )}
    </Link>
  );
};
