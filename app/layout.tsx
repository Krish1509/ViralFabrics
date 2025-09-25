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
        {/* Hydration-safe dark mode script - Enhanced to prevent white flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Set initial background to prevent white flash
                  document.documentElement.style.backgroundColor = 'rgb(30 41 59)'; // slate-800
                  
                  // Check localStorage for saved preference
                  var savedTheme = localStorage.getItem('darkMode');
                  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // Determine initial theme
                  var isDark = savedTheme !== null ? savedTheme === 'true' : systemPrefersDark;
                  
                  // Apply theme immediately to prevent flash
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.backgroundColor = 'rgb(30 41 59)'; // slate-800
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.backgroundColor = 'rgb(248 250 252)'; // slate-50
                  }
                  
                  // Store initial theme state
                  window.__INITIAL_THEME__ = isDark;
                  
                  // Remove inline style after a short delay to let CSS take over
                  setTimeout(function() {
                    document.documentElement.style.backgroundColor = '';
                  }, 100);
                } catch (e) {
                  // Silent fallback - let CSS handle default
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
