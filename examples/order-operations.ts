import mongoose from 'mongoose';
import Order, { IOrder, IOrderItem } from '../models/Order';

// Example usage of the Order schema with various operations

// 1. CREATING ORDERS

// Create a new order with auto-generated order number
export const createOrder = async (orderData: Partial<IOrder>): Promise<IOrder> => {
  try {
    const order = new Order({
      date: new Date(),
      party: 'ABC123',
      name: 'John Doe',
      contactNumber: '+1234567890',
      poNo: 'PO2024001',
      styleNo: 'STYLE001',
      poDate: new Date('2024-01-15'),
      deliveryDate: new Date('2024-02-15'),
      items: [
        {
          quality: 'Cotton',
          quantity: 100,
          image: 'https://example.com/cotton-fabric.jpg'
        },
        {
          quality: 'Silk',
          quantity: 50,
          image: '/uploads/silk-fabric.jpg'
        }
      ]
    });

    const savedOrder = await order.save();
    console.log('Order created:', savedOrder.orderNo);
    return savedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Create order with custom order number
export const createOrderWithCustomNumber = async (orderNo: string, orderData: Partial<IOrder>): Promise<IOrder> => {
  try {
    const order = new Order({
      orderNo,
      ...orderData
    });

    const savedOrder = await order.save();
    return savedOrder;
  } catch (error) {
    console.error('Error creating order with custom number:', error);
    throw error;
  }
};

// 2. FINDING ORDERS

// Find order by order number
export const findOrderByNumber = async (orderNo: string): Promise<IOrder | null> => {
  try {
    const order = await Order.findByOrderNo(orderNo);
    return order;
  } catch (error) {
    console.error('Error finding order:', error);
    throw error;
  }
};

// Find orders by party
export const findOrdersByParty = async (party: string, limit = 50): Promise<IOrder[]> => {
  try {
    const orders = await Order.findByParty(party, limit);
    return orders;
  } catch (error) {
    console.error('Error finding orders by party:', error);
    throw error;
  }
};

// Find orders by date range
export const findOrdersByDateRange = async (startDate: Date, endDate: Date): Promise<IOrder[]> => {
  try {
    const orders = await Order.findByDateRange(startDate, endDate);
    return orders;
  } catch (error) {
    console.error('Error finding orders by date range:', error);
    throw error;
  }
};

// Find orders by status
export const findOrdersByStatus = async (status: string): Promise<IOrder[]> => {
  try {
    const orders = await Order.findByStatus(status);
    return orders;
  } catch (error) {
    console.error('Error finding orders by status:', error);
    throw error;
  }
};

// Find pending deliveries
export const findPendingDeliveries = async (): Promise<IOrder[]> => {
  try {
    const orders = await Order.findPendingDeliveries();
    return orders;
  } catch (error) {
    console.error('Error finding pending deliveries:', error);
    throw error;
  }
};

// 3. ADVANCED QUERIES

// Search orders using text index
export const searchOrders = async (searchTerm: string): Promise<IOrder[]> => {
  try {
    const orders = await Order.find(
      { $text: { $search: searchTerm } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
    
    return orders;
  } catch (error) {
    console.error('Error searching orders:', error);
    throw error;
  }
};

// Get order statistics
export const getOrderStats = async () => {
  try {
    const stats = await Order.getOrderStats();
    return stats;
  } catch (error) {
    console.error('Error getting order stats:', error);
    throw error;
  }
};

// Find overdue orders
export const findOverdueOrders = async (): Promise<IOrder[]> => {
  try {
    const orders = await Order.find({
      status: { $in: ['confirmed', 'in_production', 'ready'] },
      deliveryDate: { $lt: new Date() }
    }).sort({ deliveryDate: 1 });
    
    return orders;
  } catch (error) {
    console.error('Error finding overdue orders:', error);
    throw error;
  }
};

// 4. UPDATING ORDERS

// Update order status
export const updateOrderStatus = async (orderNo: string, newStatus: string): Promise<IOrder | null> => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderNo: orderNo.toUpperCase() },
      { status: newStatus },
      { new: true, runValidators: true }
    );
    
    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Add item to existing order
export const addItemToOrder = async (orderNo: string, item: IOrderItem): Promise<IOrder | null> => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderNo: orderNo.toUpperCase() },
      { $push: { items: item } },
      { new: true, runValidators: true }
    );
    
    return order;
  } catch (error) {
    console.error('Error adding item to order:', error);
    throw error;
  }
};

// Update specific item in order
export const updateOrderItem = async (orderNo: string, itemId: string, updates: Partial<IOrderItem>): Promise<IOrder | null> => {
  try {
    const order = await Order.findOneAndUpdate(
      { 
        orderNo: orderNo.toUpperCase(),
        'items._id': itemId 
      },
      { 
        $set: { 
          'items.$': { ...updates, _id: itemId } 
        } 
      },
      { new: true, runValidators: true }
    );
    
    return order;
  } catch (error) {
    console.error('Error updating order item:', error);
    throw error;
  }
};

// Remove item from order
export const removeItemFromOrder = async (orderNo: string, itemId: string): Promise<IOrder | null> => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderNo: orderNo.toUpperCase() },
      { $pull: { items: { _id: itemId } } },
      { new: true, runValidators: true }
    );
    
    return order;
  } catch (error) {
    console.error('Error removing item from order:', error);
    throw error;
  }
};

// 5. BULK OPERATIONS

// Bulk insert orders (for data migration)
export const bulkInsertOrders = async (ordersData: Partial<IOrder>[]): Promise<IOrder[]> => {
  try {
    const orders = await Order.insertMany(ordersData, { 
      ordered: false, // Continue on errors
      rawResult: false 
    });
    
    console.log(`Successfully inserted ${orders.length} orders`);
    return orders;
  } catch (error) {
    console.error('Error bulk inserting orders:', error);
    throw error;
  }
};

// Bulk update order statuses
export const bulkUpdateOrderStatuses = async (orderNumbers: string[], newStatus: string): Promise<any> => {
  try {
    const result = await Order.updateMany(
      { orderNo: { $in: orderNumbers.map(no => no.toUpperCase()) } },
      { status: newStatus }
    );
    
    console.log(`Updated ${result.modifiedCount} orders`);
    return result;
  } catch (error) {
    console.error('Error bulk updating order statuses:', error);
    throw error;
  }
};

// 6. AGGREGATION QUERIES

// Get orders by quality type
export const getOrdersByQuality = async (): Promise<any[]> => {
  try {
    const result = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.quality',
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          quality: '$_id',
          totalQuantity: 1,
          orderCount: { $size: '$orderCount' }
        }
      }
    ]);
    
    return result;
  } catch (error) {
    console.error('Error getting orders by quality:', error);
    throw error;
  }
};

// Get monthly order statistics
export const getMonthlyOrderStats = async (year: number): Promise<any[]> => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: '$totalQuantity' },
          totalValue: { $sum: '$totalQuantity' } // Assuming value = quantity for demo
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return result;
  } catch (error) {
    console.error('Error getting monthly order stats:', error);
    throw error;
  }
};

// 7. PERFORMANCE OPTIMIZED QUERIES

// Paginated orders with lean queries for better performance
export const getPaginatedOrders = async (page = 1, limit = 20, filters: any = {}): Promise<{ orders: IOrder[], total: number, page: number, totalPages: number }> => {
  try {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      Order.find(filters)
        .lean() // Better performance for read-only operations
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('orderNo party name status deliveryDate totalQuantity'), // Select only needed fields
      Order.countDocuments(filters)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      orders,
      total,
      page,
      totalPages
    };
  } catch (error) {
    console.error('Error getting paginated orders:', error);
    throw error;
  }
};

// 8. DATA VALIDATION AND CLEANUP

// Validate order data before saving
export const validateOrderData = (orderData: Partial<IOrder>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!orderData.party || orderData.party.length < 2) {
    errors.push('Party code must be at least 2 characters');
  }
  
  if (!orderData.name || orderData.name.length < 2) {
    errors.push('Contact person name must be at least 2 characters');
  }
  
  if (!orderData.contactNumber) {
    errors.push('Contact number is required');
  }
  
  if (!orderData.items || orderData.items.length === 0) {
    errors.push('At least one item is required');
  }
  
  if (orderData.deliveryDate && orderData.date && orderData.deliveryDate <= orderData.date) {
    errors.push('Delivery date must be after order date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 9. EXAMPLE USAGE

export const exampleUsage = async () => {
  try {
    // Create a new order
    const newOrder = await createOrder({
      party: 'XYZ789',
      name: 'Jane Smith',
      contactNumber: '+1987654321',
      poNo: 'PO2024002',
      styleNo: 'STYLE002',
      poDate: new Date('2024-01-20'),
      deliveryDate: new Date('2024-02-20'),
      items: [
        {
          quality: 'Polyester',
          quantity: 200,
          image: 'https://example.com/polyester-fabric.jpg'
        }
      ]
    });
    
    console.log('Created order:', newOrder.orderNo);
    
    // Find orders by party
    const partyOrders = await findOrdersByParty('XYZ789');
    console.log(`Found ${partyOrders.length} orders for party XYZ789`);
    
    // Update order status
    const updatedOrder = await updateOrderStatus(newOrder.orderNo, 'confirmed');
    console.log('Updated order status to:', updatedOrder?.status);
    
    // Get order statistics
    const stats = await getOrderStats();
    console.log('Order statistics:', stats);
    
  } catch (error) {
    console.error('Example usage error:', error);
  }
};

export default {
  createOrder,
  createOrderWithCustomNumber,
  findOrderByNumber,
  findOrdersByParty,
  findOrdersByDateRange,
  findOrdersByStatus,
  findPendingDeliveries,
  searchOrders,
  getOrderStats,
  findOverdueOrders,
  updateOrderStatus,
  addItemToOrder,
  updateOrderItem,
  removeItemFromOrder,
  bulkInsertOrders,
  bulkUpdateOrderStatuses,
  getOrdersByQuality,
  getMonthlyOrderStats,
  getPaginatedOrders,
  validateOrderData,
  exampleUsage
};
