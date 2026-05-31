import { Providers } from "./providers";
import { GoogleAnalytics } from "../components/analytics/GoogleAnalytics";
import "./globals.css";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteName = "CYNAYD One";
const defaultTitle = "CYNAYD One — AI Workspace & Business Productivity Platform";
const defaultDescription =
  "CYNAYD One combines mail, drive, calendar, meetings, tasks and collaboration tools into one secure AI-powered workspace. Built for modern collaborative workflows with integrated AI.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "AI workspace",
    "business productivity platform",
    "team collaboration",
    "enterprise email",
    "cloud drive",
    "workflow automation",
    "SAML SSO",
    "self-hosted workspace",
    "task management",
    "video meetings",
    "secure vault",
    "forms automation",
    "enterprise security",
    "single sign-on",
    "SaaS platform",
    "REST API",
    "webhooks",
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
        alt: "CYNAYD One — AI Workspace & Business Productivity Platform",
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
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
