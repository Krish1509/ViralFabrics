'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageVisitLogger() {
  const pathname = usePathname();

  useEffect(() => {
    const logPageVisit = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Don't log login page visits or logs page visits
        if (pathname === '/login' || pathname === '/dashboard/logs') return;

        const response = await fetch('/api/logs/page-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            pathname,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          console.error('Failed to log page visit');
        }
      } catch (error) {
        console.error('Error logging page visit:', error);
      }
    };

    // Log page visit when component mounts (page loads)
    logPageVisit();
  }, [pathname]);

  return null; // This component doesn't render anything
}
