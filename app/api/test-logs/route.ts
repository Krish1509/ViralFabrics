import { NextRequest } from 'next/server';
import { logCreate, logUpdate, logDelete, logView, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Generate sample logs
    await logCreate('order', 'test-order-123', { orderNumber: 'ORD-001' }, request);
    await logUpdate('user', 'test-user-456', { oldRole: 'user' }, { newRole: 'superadmin' }, request);
    await logView('dashboard', undefined, request);
    await logError('system', 'test', 'Sample error for testing', request);
    
    return new Response(JSON.stringify({ 
      message: 'Sample logs generated successfully',
      logs: [
        'order_create',
        'user_update', 
        'dashboard_view',
        'api_call_error'
      ]
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating test logs:', error);
    return new Response(JSON.stringify({ 
      message: 'Failed to generate test logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
