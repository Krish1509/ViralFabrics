import { NextRequest } from 'next/server';
import { logCreate, logUpdate, logDelete, logView, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Generate various test actions to populate logs
    const actions = [];
    
    // Test 1: Create order log
    await logCreate('order', 'test-order-123', {
      orderId: 'TEST-ORD-001',
      poNumber: 'PO-TEST-001',
      customerName: 'Test Customer'
    }, request);
    actions.push('order_create');
    
    // Test 2: Create user log
    await logCreate('user', 'test-user-456', {
      username: 'testuser',
      role: 'user',
      email: 'test@example.com'
    }, request);
    actions.push('user_create');
    
    // Test 3: Create lab log
    await logCreate('lab', 'test-lab-789', {
      labName: 'Test Lab',
      testType: 'Quality Test',
      orderId: 'TEST-ORD-001'
    }, request);
    actions.push('lab_create');
    
    // Test 4: Create party log
    await logCreate('party', 'test-party-101', {
      partyName: 'Test Party',
      contactPerson: 'John Doe',
      phone: '1234567890'
    }, request);
    actions.push('party_create');
    
    // Test 5: Create quality log
    await logCreate('quality', 'test-quality-202', {
      qualityName: 'Premium Quality',
      description: 'High quality standard'
    }, request);
    actions.push('quality_create');
    
    // Test 6: Update order log
    await logUpdate('order', 'test-order-123', {
      oldStatus: 'pending'
    }, {
      newStatus: 'completed',
      updatedBy: 'testuser'
    }, request);
    actions.push('order_update');
    
    // Test 7: Update user log
    await logUpdate('user', 'test-user-456', {
      oldRole: 'user'
    }, {
      newRole: 'superadmin',
      updatedBy: 'admin'
    }, request);
    actions.push('user_update');
    
    // Test 8: Update lab log
    await logUpdate('lab', 'test-lab-789', {
      oldStatus: 'pending'
    }, {
      newStatus: 'completed',
      updatedBy: 'labtech'
    }, request);
    actions.push('lab_update');
    
    // Test 9: Update party log
    await logUpdate('party', 'test-party-101', {
      oldContactPerson: 'John Doe'
    }, {
      newContactPerson: 'Jane Smith',
      updatedBy: 'admin'
    }, request);
    actions.push('party_update');
    
    // Test 10: Update quality log
    await logUpdate('quality', 'test-quality-202', {
      oldDescription: 'High quality standard'
    }, {
      newDescription: 'Premium quality standard with enhanced features',
      updatedBy: 'admin'
    }, request);
    actions.push('quality_update');
    
    // Test 11: Delete order log
    await logDelete('order', 'test-order-123', {
      orderId: 'TEST-ORD-001',
      reason: 'Test deletion'
    }, request);
    actions.push('order_delete');
    
    // Test 12: Delete user log
    await logDelete('user', 'test-user-456', {
      username: 'testuser',
      reason: 'Test deletion'
    }, request);
    actions.push('user_delete');
    
    // Test 13: Delete lab log
    await logDelete('lab', 'test-lab-789', {
      labName: 'Test Lab',
      reason: 'Test deletion'
    }, request);
    actions.push('lab_delete');
    
    // Test 14: Delete party log
    await logDelete('party', 'test-party-101', {
      partyName: 'Test Party',
      reason: 'Test deletion'
    }, request);
    actions.push('party_delete');
    
    // Test 15: Delete quality log
    await logDelete('quality', 'test-quality-202', {
      qualityName: 'Premium Quality',
      reason: 'Test deletion'
    }, request);
    actions.push('quality_delete');
    
    // Test 16: View dashboard log
    await logView('dashboard', undefined, request);
    actions.push('dashboard_view');
    
    // Test 17: View orders log
    await logView('order', undefined, request);
    actions.push('order_view');
    
    // Test 18: View users log
    await logView('user', undefined, request);
    actions.push('user_view');
    
    // Test 19: View labs log
    await logView('lab', undefined, request);
    actions.push('lab_view');
    
    // Test 20: View parties log
    await logView('party', undefined, request);
    actions.push('party_view');
    
    // Test 21: View qualities log
    await logView('quality', undefined, request);
    actions.push('quality_view');
    
    // Test 22: View logs page
    await logView('log', undefined, request);
    actions.push('log_view');
    
    // Test 23: Error log
    await logError('test_error', 'system', 'This is a test error message for demonstration');
    actions.push('test_error');
    
    // Test 24: Login failed log
    await logError('login_failed', 'auth', 'Invalid password attempt');
    actions.push('login_failed');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test actions generated successfully',
      actions: actions
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error generating test actions:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to generate test actions'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
