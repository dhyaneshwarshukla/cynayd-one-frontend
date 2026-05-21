import { LEGAL_LINKS } from "@/lib/legal/links";

type LegalFooterLinksProps = {
  variant?: "inline" | "stacked";
  className?: string;
};

export function LegalFooterLinks({ variant = "inline", className = "" }: LegalFooterLinksProps) {
  if (variant === "stacked") {
    return (
      <nav className={`flex flex-col gap-2 text-center ${className}`} aria-label="Legal policies">
        {LEGAL_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className={`flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-500 ${className}`}
      aria-label="Legal policies"
    >
      {LEGAL_LINKS.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-3">
          {index > 0 && <span className="text-gray-300" aria-hidden>|</span>}
          <a href={link.href} className="hover:text-blue-600 transition-colors">
            {link.label}
          </a>
        </span>
      ))}
    </nav>
  );
}
