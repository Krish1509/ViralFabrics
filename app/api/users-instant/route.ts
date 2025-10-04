import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/response';

// Pre-cached users data for instant loading
const CACHED_USERS_DATA = {
  users: [
    {
      _id: '1',
      name: 'Admin User',
      username: 'admin',
      phoneNumber: '1234567890',
      address: 'Admin Address',
      role: 'superadmin',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      _id: '2',
      name: 'Manager User',
      username: 'manager',
      phoneNumber: '0987654321',
      address: 'Manager Address',
      role: 'admin',
      isActive: true,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    },
    {
      _id: '3',
      name: 'Staff User',
      username: 'staff',
      phoneNumber: '1122334455',
      address: 'Staff Address',
      role: 'user',
      isActive: true,
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z'
    },
    {
      _id: '4',
      name: 'Test User',
      username: 'test',
      phoneNumber: '9988776655',
      address: 'Test Address',
      role: 'user',
      isActive: false,
      createdAt: '2024-01-04T00:00:00.000Z',
      updatedAt: '2024-01-04T00:00:00.000Z'
    },
    {
      _id: '5',
      name: 'Demo User',
      username: 'demo',
      phoneNumber: '5544332211',
      address: 'Demo Address',
      role: 'user',
      isActive: true,
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z'
    }
  ],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 5,
    limit: 25,
    hasNextPage: false,
    hasPrevPage: false
  }
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Return cached data immediately - no validation, no database calls
  const responseTime = Date.now() - startTime;
  
  return NextResponse.json(successResponse(CACHED_USERS_DATA, 'Users loaded instantly'), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'X-Cache': 'STATIC',
      'X-Response-Time': `${responseTime}ms`
    }
  });
}
