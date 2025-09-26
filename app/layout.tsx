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
        {/* Hydration-safe dark mode script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Check localStorage for saved preference
                  var savedTheme = localStorage.getItem('darkMode');
                  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // Determine initial theme
                  var isDark = savedTheme !== null ? savedTheme === 'true' : systemPrefersDark;
                  
                  // Apply theme class only (no inline styles to prevent hydration issues)
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  // Store initial theme state for React components
                  window.__INITIAL_THEME__ = isDark;
                } catch (e) {
                  // Silent fallback - let CSS handle default
                  window.__INITIAL_THEME__ = false;
                }
              })();
            `,
          }}
        />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Hydration-safe styles */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Prevent layout shift during theme transition */
              body {
                transition: background-color 0.2s ease;
                margin: 0;
                padding: 0;
                background-color: rgb(30 41 59) !important; /* Default to dark */
                color: rgb(255 255 255) !important; /* Default to white text */
              }
              
              /* Optimize font rendering */
              * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
              }
              
              /* Reduce layout shift */
              html {
                scroll-behavior: smooth;
                background-color: rgb(30 41 59) !important; /* Default to dark */
                color: rgb(255 255 255) !important; /* Default to white text */
              }
              
              /* Light theme override */
              html:not(.dark) {
                background-color: rgb(248 250 252) !important; /* Light mode */
                color: rgb(15 23 42) !important; /* Dark text */
              }
              
              html:not(.dark) body {
                background-color: rgb(248 250 252) !important; /* Light mode */
                color: rgb(15 23 42) !important; /* Dark text */
              }
              
              /* Dark theme */
              .dark body {
                background-color: rgb(30 41 59) !important; /* Dark mode */
                color: rgb(255 255 255) !important; /* White text */
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
