import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND_NAME, BRAND_DESCRIPTION } from '@/lib/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: `${BRAND_NAME} - ${BRAND_DESCRIPTION}`,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Optimized dark mode script - prevents flash and improves performance */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Use a more efficient approach to prevent flash
                  var darkMode = localStorage.getItem('darkMode');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var shouldBeDark = darkMode !== null ? darkMode === 'true' : prefersDark;
                  
                  // Apply theme immediately
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                    document.body.style.backgroundColor = '#111827';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.body.style.backgroundColor = '#f9fafb';
                  }
                  
                  // Store the initial state for components
                  window.__INITIAL_THEME__ = shouldBeDark;
                } catch (e) {
                  // Fallback to system preference
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (prefersDark) {
                    document.documentElement.classList.add('dark');
                    document.body.style.backgroundColor = '#111827';
                  }
                  window.__INITIAL_THEME__ = prefersDark;
                }
              })();
            `,
          }}
        />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Optimized styles for better performance */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Prevent layout shift during theme transition */
              body {
                background-color: #111827;
                transition: background-color 0.2s ease;
                margin: 0;
                padding: 0;
              }
              body:not(.dark) {
                background-color: #f9fafb;
              }
              
              /* Optimize font rendering */
              * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              
              /* Reduce layout shift */
              html {
                scroll-behavior: smooth;
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
