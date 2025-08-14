import mongoose from 'mongoose';

// Utility functions for ObjectId validation
export const isValidObjectId = (str: string): boolean => {
  return mongoose.Types.ObjectId.isValid(str);
};

export const validateObjectId = (str: string, fieldName: string = 'ID'): void => {
  if (!isValidObjectId(str)) {
    throw new Error(`${fieldName} must be a valid ObjectId`);
  }
};

// Helper to ensure order item exists in order
export const ensureOrderItemExists = async (orderId: string, orderItemId: string) => {
  const Order = mongoose.model('Order');
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  const itemExists = order.items.some((item: any) => 
    item._id.toString() === orderItemId
  );
  
  if (!itemExists) {
    throw new Error('Order item not found');
  }
  
  return order;
};
