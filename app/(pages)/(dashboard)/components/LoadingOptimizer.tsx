'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Global cache for API responses
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Preload critical data
const preloadCriticalData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Preload essential data in background
    const preloadPromises = [
      fetch('/api/orders?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=30'
        }
      }).catch(() => null),
      fetch('/api/parties?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=60'
        }
      }).catch(() => null),
      fetch('/api/qualities?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=60'
        }
      }).catch(() => null)
    ];

    // Don't await - let them load in background
    Promise.allSettled(preloadPromises);
  } catch (error) {
    // Silent fail for preloading
    console.log('Preload failed:', error);
  }
};

export default function LoadingOptimizer() {
  const router = useRouter();
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    // Start preloading when component mounts
    setIsOptimizing(true);
    preloadCriticalData().finally(() => {
      setIsOptimizing(false);
    });

    // For App Router, we can't listen to route changes easily
    // Just preload on mount for now
  }, [router]);

  // Don't render anything visible
  return null;
}

// Utility functions for caching
export const getCachedData = (key: string) => {
  const cached = globalCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
};

export const setCachedData = (key: string, data: any, ttl: number = 30000) => {
  globalCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

export const clearCache = () => {
  globalCache.clear();
};
