import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Party from "@/models/Party";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";
import { logOrderChange, logView } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Remove authentication requirement for now
    // await requireAuth(req);

    await dbConnect();
    
    const { id } = await params;
    const order = await Order.findById(id)
      .populate('party', '_id name contactName contactPhone address')
      .populate('items.quality', '_id name description')
      .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items status labData createdAt updatedAt');

    if (!order) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

    // Fetch lab data for this order and attach to items
    if (order.items && order.items.length > 0) {
      const Lab = (await import('@/models/Lab')).default;
      const itemIds = order.items.map((item: any) => item._id);
      
      const labs = await Lab.find({ 
        order: id,
        orderItemId: { $in: itemIds },
        softDeleted: { $ne: true }
      }).lean().maxTimeMS(5000);
      
      // Create a map of orderItemId to lab data
      const labMap = new Map();
      labs.forEach(lab => {
        labMap.set(lab.orderItemId.toString(), lab);
      });
      
      // Attach lab data to order items
      order.items.forEach((item: any) => {
        const labData = labMap.get(item._id.toString());
        if (labData) {
          item.labData = {
            color: labData.labSendData?.color,
            shade: labData.labSendData?.shade,
            notes: labData.labSendData?.notes,
            labSendDate: labData.labSendDate,
            approvalDate: labData.labSendData?.approvalDate,
            sampleNumber: labData.labSendData?.sampleNumber,
            imageUrl: labData.labSendData?.imageUrl
          };
        }
      });
    }

    // Log the order view
    await logView('order', id, req);

    return new Response(JSON.stringify({ 
      success: true, 
      data: order 
    }), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Unauthorized" 
        }), { status: 401 });
      }
    }
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ 
      success: false, 
      message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Remove authentication requirement for now
    // await requireAuth(req);

    const requestData = await req.json();
    
    const {
      orderType,
      arrivalDate,
      party,
      contactName,
      contactPhone,
      poNumber,
      styleNo,
      poDate,
      deliveryDate,
      items,
      status
    } = requestData;

    // Validation
    const errors: string[] = [];
    
    if (orderType !== undefined && !['Dying', 'Printing'].includes(orderType)) {
      errors.push("Order type must be either 'Dying' or 'Printing'");
    }
    
    if (arrivalDate !== undefined) {
      const arrival = new Date(arrivalDate);
      if (isNaN(arrival.getTime())) {
        errors.push("Invalid arrival date format");
      }
    }
    
    if (party !== undefined && party !== null && party !== '' && party !== 'null' && party !== 'undefined') {
      if (!party.match(/^[0-9a-fA-F]{24}$/)) {
        errors.push("Invalid party ID format");
      }
    }
    
    if (contactName !== undefined && contactName && contactName.trim().length > 50) {
      errors.push("Contact name cannot exceed 50 characters");
    }
    
    if (contactPhone !== undefined && contactPhone && contactPhone.trim().length > 20) {
      errors.push("Contact phone cannot exceed 20 characters");
    }
    
    if (poNumber !== undefined && poNumber && poNumber.trim().length > 50) {
      errors.push("PO number cannot exceed 50 characters");
    }
    
    if (styleNo !== undefined && styleNo && styleNo.trim().length > 50) {
      errors.push("Style number cannot exceed 50 characters");
    }
    
    if (poDate !== undefined && poDate) {
      const po = new Date(poDate);
      if (isNaN(po.getTime())) {
        errors.push("Invalid PO date format");
      }
    }
    
    if (deliveryDate !== undefined && deliveryDate) {
      const delivery = new Date(deliveryDate);
      if (isNaN(delivery.getTime())) {
        errors.push("Invalid delivery date format");
      }
    }
    
    if (status !== undefined && !['pending', 'delivered'].includes(status)) {
      errors.push("Status must be one of: pending, delivered");
    }
    
    // Validate items if provided
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        errors.push("At least one order item is required");
      } else {
        items.forEach((item, index) => {
          // Quality is optional for each item
          if (item.quality && item.quality !== null && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined' && !item.quality.match(/^[0-9a-fA-F]{24}$/)) {
            errors.push(`Invalid quality ID format in item ${index + 1}`);
          }
          
          // Quantity is required for each item
          if (item.quantity === undefined || item.quantity === null) {
            errors.push(`Quantity is required for item ${index + 1}`);
          } else if (typeof item.quantity !== 'number' || item.quantity <= 0) {
            errors.push(`Quantity must be a positive number in item ${index + 1}`);
          }
          if (item.imageUrls && Array.isArray(item.imageUrls)) {
            item.imageUrls.forEach((url: string, urlIndex: number) => {
              if (url && url.trim().length > 500) {
                errors.push(`Image URL cannot exceed 500 characters in item ${index + 1}, image ${urlIndex + 1}`);
              }
            });
          }
          if (item.description && item.description.trim().length > 200) {
            errors.push(`Description cannot exceed 200 characters in item ${index + 1}`);
          }
        });
      }
    }
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ message: errors.join(", ") }), 
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if order exists
    const { id } = await params;
    const existingOrder = await Order.findById(id)
      .populate('party', '_id name')
      .populate('items.quality', '_id name');
    if (!existingOrder) {
      return new Response(
        JSON.stringify({ message: "Order not found" }), 
        { status: 404 }
      );
    }

    // Verify party exists if being updated and get party name for logging
    let newPartyName = null;
    if (party && party !== '' && party !== 'null' && party !== 'undefined') {
      const partyExists = await Party.findById(party);
      if (!partyExists) {
        return new Response(
          JSON.stringify({ message: "Party not found" }), 
          { status: 400 }
        );
      }
      newPartyName = partyExists.name;
    }

    // Verify qualities exist if being updated
    if (items && Array.isArray(items) && items.length > 0) {
      const Quality = (await import('@/models/Quality')).default;
      for (const item of items) {
        if (item && item.quality && typeof item.quality === 'string' && item.quality.trim() && item.quality !== 'null' && item.quality !== 'undefined') {
          const qualityExists = await Quality.findById(item.quality);
          if (!qualityExists) {
            return new Response(
              JSON.stringify({ message: `Quality not found for item` }), 
              { status: 400 }
            );
          }
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (orderType !== undefined) updateData.orderType = orderType;
    if (arrivalDate !== undefined) updateData.arrivalDate = new Date(arrivalDate);
    if (party !== undefined) {
      if (party && party !== '' && party !== 'null' && party !== 'undefined') {
        updateData.party = party;
      } else {
        updateData.party = null;
      }
    }
    if (contactName !== undefined) updateData.contactName = contactName !== null ? contactName.trim() : '';
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone !== null ? contactPhone.trim() : '';
    if (poNumber !== undefined) updateData.poNumber = poNumber !== null ? poNumber.trim() : '';
    if (styleNo !== undefined) updateData.styleNo = styleNo !== null ? styleNo.trim() : '';
    if (poDate !== undefined) updateData.poDate = poDate ? new Date(poDate) : undefined;
    if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : undefined;
    if (status !== undefined) updateData.status = status;
    if (items !== undefined) {
      updateData.items = items.map((item: any) => ({
        quality: item.quality && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined' ? item.quality : null,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : undefined,
        imageUrls: item.imageUrls && Array.isArray(item.imageUrls) ? item.imageUrls.map((url: string) => url.trim()) : [],
        description: item.description !== null ? item.description.trim() : '',
        weaverSupplierName: item.weaverSupplierName ? item.weaverSupplierName.trim() : undefined,
        purchaseRate: item.purchaseRate !== undefined && item.purchaseRate !== null && item.purchaseRate !== '' ? 
          (() => {
            const rate = parseFloat(item.purchaseRate);
            return isNaN(rate) ? undefined : rate;
          })() : undefined,
      }));
    }

    // Capture old values for logging
    const oldValues: any = {};
    const newValues: any = {};
    const changedFields: string[] = [];
    
    if (orderType !== undefined && orderType !== existingOrder.orderType) {
      oldValues.orderType = existingOrder.orderType;
      newValues.orderType = orderType;
      changedFields.push('orderType');
    }
    if (arrivalDate !== undefined) {
      const newArrivalDate = arrivalDate ? new Date(arrivalDate) : undefined;
      const existingArrivalDate = existingOrder.arrivalDate ? new Date(existingOrder.arrivalDate) : undefined;
      
      const normalizeDate = (date: Date | undefined) => {
        if (!date) return null;
        return date.toISOString().split('T')[0];
      };
      
      const existingDateStr = normalizeDate(existingArrivalDate);
      const newDateStr = normalizeDate(newArrivalDate);
      
      const arrivalDateChanged = existingDateStr !== newDateStr;
      
      if (arrivalDateChanged) {
        oldValues.arrivalDate = existingOrder.arrivalDate;
        newValues.arrivalDate = newArrivalDate;
        changedFields.push('arrivalDate');
      }
    }
    if (party !== undefined) {
      const currentPartyId = existingOrder.party?.toString() || null;
      const newPartyId = party && party !== '' && party !== 'null' && party !== 'undefined' ? party : null;
      
      if (currentPartyId !== newPartyId) {
        oldValues.party = existingOrder.party?.name || existingOrder.party || 'Not set';
        newValues.party = newPartyName || newPartyId || 'Not set';
        changedFields.push('party');
      }
    }
    if (contactName !== undefined) {
      const newContactName = contactName !== null && contactName !== '' ? contactName.trim() : '';
      if (existingOrder.contactName !== newContactName) {
        oldValues.contactName = existingOrder.contactName;
        newValues.contactName = newContactName;
        changedFields.push('contactName');
      }
    }
    if (contactPhone !== undefined) {
      const newContactPhone = contactPhone !== null && contactPhone !== '' ? contactPhone.trim() : '';
      if (existingOrder.contactPhone !== newContactPhone) {
        oldValues.contactPhone = existingOrder.contactPhone;
        newValues.contactPhone = newContactPhone;
        changedFields.push('contactPhone');
      }
    }
    if (poNumber !== undefined) {
      const newPoNumber = poNumber !== null && poNumber !== '' ? poNumber.trim() : '';
      if (existingOrder.poNumber !== newPoNumber) {
        oldValues.poNumber = existingOrder.poNumber;
        newValues.poNumber = newPoNumber;
        changedFields.push('poNumber');
      }
    }
    if (styleNo !== undefined) {
      const newStyleNo = styleNo !== null && styleNo !== '' ? styleNo.trim() : '';
      if (existingOrder.styleNo !== newStyleNo) {
        oldValues.styleNo = existingOrder.styleNo;
        newValues.styleNo = newStyleNo;
        changedFields.push('styleNo');
      }
    }
    if (poDate !== undefined) {
      const newPoDate = poDate ? new Date(poDate) : undefined;
      const existingPoDate = existingOrder.poDate ? new Date(existingOrder.poDate) : undefined;
      
      const normalizeDate = (date: Date | undefined) => {
        if (!date) return null;
        return date.toISOString().split('T')[0];
      };
      
      const existingDateStr = normalizeDate(existingPoDate);
      const newDateStr = normalizeDate(newPoDate);
      
      const poDateChanged = existingDateStr !== newDateStr;
      
      if (poDateChanged) {
        oldValues.poDate = existingOrder.poDate;
        newValues.poDate = newPoDate;
        changedFields.push('poDate');
      }
    }
    if (deliveryDate !== undefined) {
      const newDeliveryDate = deliveryDate ? new Date(deliveryDate) : undefined;
      const existingDeliveryDate = existingOrder.deliveryDate ? new Date(existingOrder.deliveryDate) : undefined;
      
      const normalizeDate = (date: Date | undefined) => {
        if (!date) return null;
        return date.toISOString().split('T')[0];
      };
      
      const existingDateStr = normalizeDate(existingDeliveryDate);
      const newDateStr = normalizeDate(newDeliveryDate);
      
      const deliveryDateChanged = existingDateStr !== newDateStr;
      
      if (deliveryDateChanged) {
        oldValues.deliveryDate = existingOrder.deliveryDate;
        newValues.deliveryDate = newDeliveryDate;
        changedFields.push('deliveryDate');
      }
    }
    if (status !== undefined && status !== existingOrder.status) {
      oldValues.status = existingOrder.status;
      newValues.status = status;
      changedFields.push('status');
    }
    if (items !== undefined) {
      const oldItems = existingOrder.items.map((item: any) => ({
        quality: item.quality?.name || item.quality?.toString() || 'Not set',
        quantity: item.quantity,
        imageUrls: item.imageUrls || [],
        description: item.description || '',
        weaverSupplierName: item.weaverSupplierName || '',
        purchaseRate: item.purchaseRate || 0
      }));
      
      const newItems = items.map((item: any) => ({
        quality: item.quality && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined' ? item.quality : 'Not set',
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : 0,
        imageUrls: item.imageUrls && Array.isArray(item.imageUrls) ? item.imageUrls.map((url: string) => url.trim()) : [],
        description: item.description !== null ? item.description.trim() : '',
        weaverSupplierName: item.weaverSupplierName ? item.weaverSupplierName.trim() : '',
        purchaseRate: item.purchaseRate !== undefined && item.purchaseRate !== null && item.purchaseRate !== '' ? 
          (() => {
            const rate = parseFloat(item.purchaseRate);
            return isNaN(rate) ? 0 : rate;
          })() : 0,
      }));
      
      const itemChanges: any[] = [];
      
      oldItems.some((oldItem: any, index: number) => {
        const newItem = newItems[index];
        if (!newItem) {
          itemChanges.push({ type: 'item_removed', index });
          return true;
        }
        
        const changes: any = {};
        let hasItemChanges = false;
        
        if (oldItem.quality !== newItem.quality) {
          changes.quality = { old: oldItem.quality, new: newItem.quality };
          hasItemChanges = true;
        }
        
        if (oldItem.quantity !== newItem.quantity) {
          changes.quantity = { old: oldItem.quantity, new: newItem.quantity };
          hasItemChanges = true;
        }
        
        if (oldItem.description !== newItem.description) {
          changes.description = { old: oldItem.description, new: newItem.description };
          hasItemChanges = true;
        }
        
        if (oldItem.weaverSupplierName !== newItem.weaverSupplierName) {
          changes.weaverSupplierName = { old: oldItem.weaverSupplierName, new: newItem.weaverSupplierName };
          hasItemChanges = true;
        }
        
        if (oldItem.purchaseRate !== newItem.purchaseRate) {
          changes.purchaseRate = { old: oldItem.purchaseRate, new: newItem.purchaseRate };
          hasItemChanges = true;
        }
        
        const oldImageUrls = oldItem.imageUrls || [];
        const newImageUrls = newItem.imageUrls || [];
        if (JSON.stringify(oldImageUrls) !== JSON.stringify(newImageUrls)) {
          const addedImages = newImageUrls.filter((url: string) => !oldImageUrls.includes(url));
          const removedImages = oldImageUrls.filter((url: string) => !newImageUrls.includes(url));
          
          changes.imageUrls = { 
            old: oldImageUrls, 
            new: newImageUrls,
            added: addedImages,
            removed: removedImages,
            addedCount: addedImages.length,
            removedCount: removedImages.length
          };
          hasItemChanges = true;
        }
        
        if (hasItemChanges) {
          itemChanges.push({ type: 'item_updated', index, changes });
        }
        
        return false;
      });
      
      if (newItems.length > oldItems.length) {
        for (let i = oldItems.length; i < newItems.length; i++) {
          const newItem = newItems[i];
          const itemDetail = {
            type: 'item_added',
            index: i,
            item: {
              quality: newItem.quality,
              quantity: newItem.quantity,
              description: newItem.description || '',
              weaverSupplierName: newItem.weaverSupplierName || '',
              purchaseRate: newItem.purchaseRate || 0,
              imageUrls: newItem.imageUrls || [],
              imageCount: (newItem.imageUrls || []).length
            }
          };
          itemChanges.push(itemDetail);
        }
      }
      
      if (itemChanges.length > 0) {
        oldValues.itemChanges = itemChanges.map(change => {
          if (change.type === 'item_updated') {
            const formattedChanges = Object.keys(change.changes).map(field => {
              if (field === 'imageUrls' && change.changes[field].addedCount !== undefined) {
                const imageChange = change.changes[field];
                if (imageChange.addedCount > 0 && imageChange.removedCount > 0) {
                  return {
                    field: 'imageUrls',
                    type: 'mixed',
                    added: imageChange.addedCount,
                    removed: imageChange.removedCount,
                    addedUrls: imageChange.added,
                    removedUrls: imageChange.removed,
                    oldUrls: imageChange.old,
                    newUrls: imageChange.new,
                    message: `Added ${imageChange.addedCount} image(s), Removed ${imageChange.removedCount} image(s)`
                  };
                } else if (imageChange.addedCount > 0) {
                  return {
                    field: 'imageUrls',
                    type: 'added',
                    count: imageChange.addedCount,
                    addedUrls: imageChange.added,
                    oldUrls: imageChange.old,
                    newUrls: imageChange.new,
                    message: `Added ${imageChange.addedCount} image(s)`
                  };
                } else if (imageChange.removedCount > 0) {
                  return {
                    field: 'imageUrls',
                    type: 'removed',
                    count: imageChange.removedCount,
                    removedUrls: imageChange.removed,
                    oldUrls: imageChange.old,
                    newUrls: imageChange.new,
                    message: `Removed ${imageChange.removedCount} image(s)`
                  };
                }
              }
              return {
                field,
                old: change.changes[field].old,
                new: change.changes[field].new
              };
            });
            
            return {
              item: change.index + 1,
              changes: formattedChanges
            };
          }
          return change;
        });
        newValues.itemChanges = oldValues.itemChanges;
        changedFields.push('itemChanges');
      }
    }

    // Update the order
    let updatedOrder;
    try {
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (updateError) {
      throw updateError;
    }

    if (!updatedOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to update order" 
        }), 
        { status: 500 }
      );
    }

    // Populate the updated order
    const populatedOrder = await Order.findById(id)
      .populate('party', '_id name')
      .populate('items.quality', '_id name');

    if (!populatedOrder) {
      console.error('Failed to populate order after update');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to retrieve updated order" 
        }), 
        { status: 500 }
      );
    }

    // Log changes if any
    if (changedFields.length > 0) {
      console.log('🔍 Logging order changes:', changedFields);
      await logOrderChange('update', id, oldValues, newValues, req);
    } else {
      console.log('🔍 No changes detected, skipping log');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order updated successfully", 
        data: updatedOrder 
      }), 
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      
      if (error.message.includes('E11000')) {
        console.error('🔍 Duplicate key error details:', error.message);
        
        if (error.message.includes('orderId')) {
          return new Response(
            JSON.stringify({ 
              message: "Order ID already exists - please use a different order ID" 
            }), 
            { status: 400 }
          );
        }
        
        if (error.message.includes('party') && error.message.includes('poNumber') && error.message.includes('styleNo')) {
          return new Response(
            JSON.stringify({ 
              message: "This combination of Party, PO Number, and Style Number already exists. Please use different values." 
            }), 
            { status: 400 }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            message: "Duplicate key error - please check your data and try again" 
          }), 
          { status: 400 }
        );
      }
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        return new Response(
          JSON.stringify({ message: validationErrors.join(", ") }), 
          { status: 400 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ message }), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Check if order exists
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

    // Store order details for logging before deletion
    const orderDetails = {
      orderId: existingOrder.orderId,
      orderType: existingOrder.orderType,
      poNumber: existingOrder.poNumber,
      styleNo: existingOrder.styleNo,
      party: existingOrder.party,
      status: existingOrder.status
    };

    // Delete the order
    const deletedOrder = await Order.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to delete order" 
        }), 
        { status: 500 }
      );
    }

    // Log the order deletion
    await logOrderChange('delete', id, orderDetails, {}, req);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order deleted successfully" 
      }), 
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('DELETE error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message 
      }), 
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const { status } = await req.json();

    // Validate status
    const validStatuses = ['pending', 'delivered'];
    if (status && !validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid status. Must be one of: pending, delivered" 
        }), 
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Order not found" 
        }), 
        { status: 404 }
      );
    }

    // Store old status for logging
    const oldStatus = existingOrder.status;

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: false }
    );

    if (!updatedOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to update order status" 
        }), 
        { status: 500 }
      );
    }

    // Populate the order
    try {
      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('party', '_id name contactName contactPhone address')
        .populate('items.quality', '_id name description')
        .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items status labData createdAt updatedAt');

      // Log the status change
      await logOrderChange('status_change', id, { status: oldStatus }, { status: updatedOrder.status }, req);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Order status updated successfully", 
          data: populatedOrder 
        }), 
        { status: 200 }
      );
    } catch (populateError) {
      console.error('Populate error:', populateError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Order status updated successfully (some data may not be fully populated)", 
          data: updatedOrder 
        }), 
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error('PATCH error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: validationErrors.join(", ") 
          }), 
          { status: 400 }
        );
      }
      
      if (error.message.includes('E11000')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Duplicate key error" 
          }), 
          { status: 400 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ 
      success: false, 
      message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


