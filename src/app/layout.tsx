import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CYNAYD One - Complete Business Ecosystem",
  description: "Transform your business with our comprehensive corporate platform.",
  icons: {
    icon: "/favicon.ico",
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
