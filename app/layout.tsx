import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND_NAME, BRAND_DESCRIPTION } from '@/lib/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: `${BRAND_NAME} - ${BRAND_DESCRIPTION}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent white flash with immediate dark mode application */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Immediately check for dark mode preference
                  var darkMode = localStorage.getItem('darkMode');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var shouldBeDark = darkMode ? darkMode === 'true' : prefersDark;
                  
                  // Apply dark mode immediately to prevent flash
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                    document.body.style.backgroundColor = '#111827';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.body.style.backgroundColor = '#f9fafb';
                  }
                } catch (e) {
                  // Fallback to system preference
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                    document.body.style.backgroundColor = '#111827';
                  }
                }
              })();
            `,
          }}
        />
        {/* Additional style to prevent flash */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body {
                background-color: #111827;
                transition: background-color 0.2s ease;
              }
              body:not(.dark) {
                background-color: #f9fafb;
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
