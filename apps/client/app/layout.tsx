import type { Metadata } from "next";
import "./globals.css";
import { ConnectionBanner } from "@/components/ConnectionBanner";

export const metadata: Metadata = {
  title: "HeatMatch",
  description: "Talk to strangers. No names. No traces.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

// Runs before React hydrates — prevents flash of wrong theme
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('heatmatch-theme');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.classList.add(theme);
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inline script — no defer/async so it runs synchronously before paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg antialiased">
        <ConnectionBanner />
        {children}
      </body>
    </html>
  );
}
