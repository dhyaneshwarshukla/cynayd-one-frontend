import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteName = "CYNAYD One";
const defaultTitle = "CYNAYD One - Complete Business Ecosystem";
const defaultDescription = "Transform your business with our comprehensive corporate platform. Manage your entire organization with built-in HR, secure communication, cloud storage, video conferencing, custom app integration, and business website generation - all secured with enterprise-grade SSO, advanced security, and seamless payment processing.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "business platform",
    "enterprise software",
    "SAML SSO",
    "HR management",
    "cloud storage",
    "video conferencing",
    "business website builder",
    "enterprise security",
    "single sign-on",
    "business ecosystem",
    "corporate platform",
    "SaaS platform",
    "business management",
    "enterprise authentication",
    "device trust",
    "risk-based authentication",
    "audit logging",
    "Razorpay integration",
    "business apps",
    "custom app integration",
  ],
  authors: [{ name: "CYNAYD" }],
  creator: "CYNAYD",
  publisher: "CYNAYD",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "CYNAYD One - Complete Business Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [`${siteUrl}/og-image.jpg`],
    creator: "@cynayd",
    site: "@cynayd",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-12DLY7H986"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-12DLY7H986');
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                  const compactMode = localStorage.getItem('compactMode') === 'true';
                  const animations = localStorage.getItem('animations') !== 'false';
                  
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'auto') {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                  
                  if (compactMode) {
                    document.body.classList.add('compact-mode');
                  }
                  
                  if (!animations) {
                    document.body.classList.add('no-animations');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
