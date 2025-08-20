import { NextRequest, NextResponse } from 'next/server';
import { logCreate, logUpdate, logDelete, logView, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const results = [];
    
    // Test 1: Create a simple log with user info
    try {
      await logCreate('order', 'test-123', {
        orderId: 'TEST-001',
        poNumber: 'PO-TEST-001'
      }, request);
      results.push('✅ Order create log - SUCCESS');
    } catch (error) {
      results.push(`❌ Order create log - FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Test 2: Create a log without user info (system log)
    try {
      await logError('test_error', 'system', 'This is a test error message');
      results.push('✅ System error log - SUCCESS');
    } catch (error) {
      results.push(`❌ System error log - FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Test 3: Create a view log
    try {
      await logView('dashboard', undefined, request);
      results.push('✅ Dashboard view log - SUCCESS');
    } catch (error) {
      results.push(`❌ Dashboard view log - FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Test 4: Create an update log
    try {
      await logUpdate('user', 'test-user-456', {
        oldRole: 'user'
      }, {
        newRole: 'superadmin'
      }, request);
      results.push('✅ User update log - SUCCESS');
    } catch (error) {
      results.push(`❌ User update log - FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Test 5: Create a delete log
    try {
      await logDelete('order', 'test-order-789', {
        orderId: 'TEST-002'
      }, request);
      results.push('✅ Order delete log - SUCCESS');
    } catch (error) {
      results.push(`❌ Order delete log - FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Log creation tests completed',
      results: results
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in test log creation:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to test log creation',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
