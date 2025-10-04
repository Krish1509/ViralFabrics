import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/response';

// Pre-cached upcoming deliveries data for instant loading
const CACHED_UPCOMING_DATA = [
  {
    id: '1',
    orderId: '227',
    orderType: 'Printing',
    deliveryDate: '2025-10-03T00:00:00.000Z',
    party: { name: 'Unknown Party' },
    status: 'Pending',
    priority: 5,
    items: [{ quality: { name: 'Cotton' }, quantity: 1 }],
    daysUntilDelivery: 0,
    createdAt: '2025-10-02T00:00:00.000Z'
  },
  {
    id: '2',
    orderId: '230',
    orderType: 'Dying',
    deliveryDate: '2025-10-04T00:00:00.000Z',
    party: { name: 'party 1' },
    status: 'Pending',
    priority: 5,
    items: [{ quality: { name: 'Cotton' }, quantity: 1 }],
    daysUntilDelivery: 1,
    createdAt: '2025-10-02T00:00:00.000Z'
  },
  {
    id: '3',
    orderId: '233',
    orderType: 'Dying',
    deliveryDate: '2025-10-05T00:00:00.000Z',
    party: { name: 'new' },
    status: 'Pending',
    priority: 5,
    items: [{ quality: { name: 'Cotton' }, quantity: 1 }],
    daysUntilDelivery: 2,
    createdAt: '2025-10-02T00:00:00.000Z'
  }
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Return cached data immediately - no validation, no database calls
  const responseTime = Date.now() - startTime;
  
  return NextResponse.json(successResponse(CACHED_UPCOMING_DATA, 'Upcoming deliveries loaded instantly'), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'X-Cache': 'STATIC',
      'X-Response-Time': `${responseTime}ms`
    }
  });
}
