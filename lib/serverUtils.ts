import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from './dbConnect';
import { getSession, SessionUser } from './session';

// Server-side authentication check
export async function requireAuthServer(): Promise<SessionUser> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  if (!authHeader) {
    redirect('/login');
  }

  try {
    await dbConnect();
    // Create a mock request object for getSession
    const mockReq = {
      headers: new Map([['authorization', authHeader]])
    } as any;
    
    const session = await getSession(mockReq);
    
    if (!session) {
      redirect('/login');
    }

    return session;
  } catch (error) {
    console.error('Server auth error:', error);
    redirect('/login');
  }
}

// Server-side superadmin check
export async function requireSuperAdminServer() {
  const user = await requireAuthServer();
  
  if (user.role !== 'superadmin') {
    redirect('/access-denied');
  }

  return user;
}

// Type declaration for global cache
declare global {
  var __CACHE__: Record<string, { data: any; timestamp: number }> | undefined;
}

// Optimized server-side data fetching with caching
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  cacheTime: number = 300 // 5 minutes default
): Promise<T> {
  const cacheKey = `cache:${url}:${JSON.stringify(options)}`;
  
  // In a real implementation, you'd use Redis or similar
  // For now, we'll implement a simple in-memory cache
  const cached = globalThis.__CACHE__?.[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < cacheTime * 1000) {
    return cached.data;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Cache the result
  if (!globalThis.__CACHE__) {
    globalThis.__CACHE__ = {};
  }
  globalThis.__CACHE__[cacheKey] = {
    data,
    timestamp: Date.now(),
  };

  return data;
}

// Server-side props helper for better SSR
export async function getServerProps<T>(
  fetcher: () => Promise<T>,
  fallback?: T
): Promise<{ props: T | null; error?: string }> {
  try {
    const data = await fetcher();
    return { props: data };
  } catch (error) {
    console.error('Server props error:', error);
    return { 
      props: fallback || null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Optimized database query with connection pooling
export async function withDatabase<T>(
  query: () => Promise<T>
): Promise<T> {
  try {
    await dbConnect();
    return await query();
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Server-side validation helper
export function validateServerInput<T>(
  data: unknown,
  schema: any
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.errors?.[0]?.message || 'Validation failed' 
    };
  }
}

// Performance monitoring for server-side operations
export async function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - start;
    
    // Log performance metrics
    // Performance monitoring: ${operationName}: ${duration}ms
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[PERF] ${operationName} failed after ${duration}ms:`, error);
    throw error;
  }
}

// Type-safe server action wrapper
export function createServerAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>
) {
  return async (input: TInput): Promise<{ success: true; data: TOutput } | { success: false; error: string }> => {
    try {
      const result = await action(input);
      return { success: true, data: result };
    } catch (error) {
      console.error('Server action error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };
}
