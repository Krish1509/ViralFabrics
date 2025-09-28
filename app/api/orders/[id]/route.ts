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

    // Fetch lab data and mill input process data for this order and attach to items
    if (order.items && order.items.length > 0) {
      try {
        const [Lab, { MillInput }, { MillOutput }, DispatchModule] = await Promise.all([
          import('@/models/Lab'),
          import('@/models/Mill'),
          import('@/models/MillOutput'),
          import('@/models/Dispatch')
        ]);
        
        const Dispatch = DispatchModule.default;
        
      const itemIds = order.items.map((item: any) => item._id);
      
        const [labs, millInputs, millOutputs, dispatches] = await Promise.all([
          Lab.default.find({ 
        order: id,
        orderItemId: { $in: itemIds },
        softDeleted: { $ne: true }
        })
        .select('orderItemId labSendDate labSendData labSendNumber status remarks')
        .lean()
          .maxTimeMS(3000),
          
          MillInput.find({ 
            order: id
          })
          .select('mill millDate chalanNo greighMtr pcs quality processName additionalMeters')
          .populate('mill', 'name')
          .populate('quality', 'name')
          .populate('additionalMeters.quality', 'name')
          .lean()
          .maxTimeMS(3000),
          
          MillOutput.find({ 
            order: id
          })
          .select('recdDate millBillNo finishedMtr millRate quality')
          .populate('quality', 'name')
          .lean()
          .maxTimeMS(3000),
          
          Dispatch.find({ 
            order: id
          })
          .select('dispatchDate billNo finishMtr saleRate totalValue quality')
          .populate('quality', 'name')
          .lean()
          .maxTimeMS(3000)
        ]);
      
      // Create a map of orderItemId to lab data
      const labMap = new Map();
      labs.forEach((lab: any) => {
        labMap.set(lab.orderItemId.toString(), lab);
      });
      
        // Attach lab data and process data to order items
      order.items.forEach((item: any) => {
          // Attach lab data
        const labData = labMap.get(item._id.toString());
          if (labData && labData.labSendData) {
          item.labData = {
              color: labData.labSendData.color || '',
              shade: labData.labSendData.shade || '',
              notes: labData.labSendData.notes || '',
            labSendDate: labData.labSendDate,
              approvalDate: labData.labSendData.approvalDate,
              sampleNumber: labData.labSendData.sampleNumber || '',
              imageUrl: labData.labSendData.imageUrl || '',
              labSendNumber: labData.labSendNumber || '',
              status: labData.status || 'sent',
              remarks: labData.remarks || ''
            };
          } else {
            // Initialize empty lab data structure for items without lab data
            item.labData = {
              color: '',
              shade: '',
              notes: '',
              labSendDate: null,
              approvalDate: null,
              sampleNumber: '',
              imageUrl: '',
              labSendNumber: '',
              status: 'not_sent',
              remarks: ''
          };
        }
          
          // Attach quality-specific process data from mill inputs
          if (millInputs.length > 0) {
            const itemQualityId = item.quality?._id?.toString() || item.quality?.toString();
            const itemQualityName = item.quality?.name || item.quality;
            
            // Find process data for this specific quality
            let qualityProcessData = null;
            
            // Check all mill inputs for this quality
            for (const millInputData of millInputs) {
              // Check main quality
              if (millInputData.quality?._id?.toString() === itemQualityId || 
                  millInputData.quality?.name === itemQualityName) {
                qualityProcessData = {
                  mainProcess: millInputData.processName || '',
                  additionalProcesses: []
                };
                break;
              }
              
              // Check additional meters for this quality
              if (millInputData.additionalMeters) {
                const matchingAdditional = millInputData.additionalMeters.find((additional: any) => 
                  additional.quality?._id?.toString() === itemQualityId || 
                  additional.quality?.name === itemQualityName
                );
                
                if (matchingAdditional) {
                  qualityProcessData = {
                    mainProcess: matchingAdditional.processName || '',
                    additionalProcesses: []
                  };
                  break;
                }
              }
            }
            
            // If no quality-specific data found, use the first mill input's main process data as fallback
            if (!qualityProcessData) {
              const firstMillInput = millInputs[0];
              qualityProcessData = {
                mainProcess: firstMillInput.processName || '',
                additionalProcesses: firstMillInput.additionalMeters?.map((additional: any) => additional.processName || '') || []
              };
            }
            
            item.processData = qualityProcessData;
          } else {
            // Initialize empty process data structure
            item.processData = {
              mainProcess: '',
              additionalProcesses: []
            };
          }
        });
        
        // Add mill inputs, mill outputs, and dispatches to the order object for PDF generation
        (order as any).millInputs = millInputs;
        (order as any).millOutputs = millOutputs;
        (order as any).dispatches = dispatches;
        
      } catch (error) {
        // Initialize empty lab data and process data for all items if there's an error
        order.items.forEach((item: any) => {
          item.labData = {
            color: '',
            shade: '',
            notes: '',
            labSendDate: null,
            approvalDate: null,
            sampleNumber: '',
            imageUrl: '',
            labSendNumber: '',
            status: 'not_sent',
            remarks: ''
          };
          item.processData = {
            mainProcess: '',
            additionalProcesses: []
          };
        });
        
        // Initialize empty mill inputs, mill outputs, and dispatches arrays
        (order as any).millInputs = [];
        (order as any).millOutputs = [];
        (order as any).dispatches = [];
      }
    } else {
      // Initialize empty mill inputs, mill outputs, and dispatches arrays if no items
      (order as any).millInputs = [];
      (order as any).millOutputs = [];
      (order as any).dispatches = [];
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
          
          // Validate millRate if provided
          if (item.millRate !== undefined && item.millRate !== null && item.millRate !== '') {
            if (typeof item.millRate !== 'number' || item.millRate < 0) {
              errors.push(`Mill rate must be a non-negative number in item ${index + 1}`);
            }
          }
          
          // Validate salesRate if provided
          if (item.salesRate !== undefined && item.salesRate !== null && item.salesRate !== '') {
            if (typeof item.salesRate !== 'number' || item.salesRate < 0) {
              errors.push(`Sales rate must be a non-negative number in item ${index + 1}`);
            }
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
        millRate: item.millRate !== undefined && item.millRate !== null && item.millRate !== '' ? 
          (() => {
            const rate = parseFloat(item.millRate);
            return isNaN(rate) ? undefined : rate;
          })() : undefined,
        salesRate: item.salesRate !== undefined && item.salesRate !== null && item.salesRate !== '' ? 
          (() => {
            const rate = parseFloat(item.salesRate);
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
        // Handle both populated and unpopulated party objects
        const oldPartyName = typeof existingOrder.party === 'object' && existingOrder.party !== null && 'name' in existingOrder.party 
          ? (existingOrder.party as any).name 
          : existingOrder.party || 'Not set';
        oldValues.party = oldPartyName;
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
        quality: item.quality, // Keep the original quality structure for proper comparison
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
      
      // Process all existing items for changes
      for (let index = 0; index < oldItems.length; index++) {
        const oldItem = oldItems[index];
        const newItem = newItems[index];
        if (!newItem) {
          itemChanges.push({ type: 'item_removed', index });
          continue;
        }
        
        const changes: any = {};
        let hasItemChanges = false;
        
        // Compare quality values properly with debugging
        const oldQualityValue = oldItem.quality;
        const newQualityValue = newItem.quality;
        
        // Check if quality actually changed
        let qualityChanged = false;
        let oldQualityName = 'Not set';
        let newQualityName = 'Not set';
        
        // Extract old quality name
        if (oldQualityValue) {
          if (typeof oldQualityValue === 'object' && oldQualityValue.name) {
            oldQualityName = oldQualityValue.name;
          } else if (typeof oldQualityValue === 'string') {
            oldQualityName = oldQualityValue;
          }
        }
        
        // Extract new quality name
        if (newQualityValue) {
          if (typeof newQualityValue === 'string' && newQualityValue.match(/^[0-9a-fA-F]{24}$/)) {
            // It's an ID, fetch the name
            try {
              const Quality = (await import('@/models/Quality')).default;
              const qualityDoc = await Quality.findById(newQualityValue).select('name');
              if (qualityDoc) {
                newQualityName = qualityDoc.name;
              } else {
                newQualityName = 'Unknown Quality';
              }
            } catch (error) {
              newQualityName = 'Unknown Quality';
            }
          } else if (typeof newQualityValue === 'string') {
            newQualityName = newQualityValue;
          }
        }
        
        // Compare the actual values
        const oldQualityId = oldQualityValue?._id?.toString() || oldQualityValue?.toString() || null;
        const newQualityId = newQualityValue?.toString() || null;
        
        qualityChanged = oldQualityId !== newQualityId;
        
        if (qualityChanged) {
          changes.quality = { old: oldQualityName, new: newQualityName };
          hasItemChanges = true;
        }
        
        // Compare quantity
        if (oldItem.quantity !== newItem.quantity) {
          changes.quantity = { old: oldItem.quantity, new: newItem.quantity };
          hasItemChanges = true;
        }
        
                 // Compare description
         const oldDesc = oldItem.description || '';
         const newDesc = newItem.description || '';
         if (oldDesc !== newDesc) {
           changes.description = { old: oldDesc, new: newDesc };
          hasItemChanges = true;
        }
        
                 // Compare weaver supplier name
         const oldWeaver = oldItem.weaverSupplierName || '';
         const newWeaver = newItem.weaverSupplierName || '';
         if (oldWeaver !== newWeaver) {
           changes.weaverSupplierName = { old: oldWeaver, new: newWeaver };
          hasItemChanges = true;
        }
        
                 // Compare purchase rate
         const oldRate = oldItem.purchaseRate || 0;
         const newRate = newItem.purchaseRate || 0;
         if (oldRate !== newRate) {
           changes.purchaseRate = { old: oldRate, new: newRate };
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
        }
      
      if (newItems.length > oldItems.length) {
        for (let i = oldItems.length; i < newItems.length; i++) {
          const newItem = newItems[i];
          
          // Fetch quality name for added items to show in logs
          let qualityName = newItem.quality;
          if (newItem.quality && newItem.quality !== 'Not set' && typeof newItem.quality === 'string') {
            try {
              const Quality = (await import('@/models/Quality')).default;
              const qualityDoc = await Quality.findById(newItem.quality).select('name');
              if (qualityDoc) {
                qualityName = qualityDoc.name;
              }
            } catch (error) {
              qualityName = newItem.quality; // Fallback to ID if fetch fails
            }
          }
          
          const itemDetail = {
            type: 'item_added',
            index: i,
            item: {
              quality: qualityName,
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
         // Store the itemChanges in both oldValues and newValues for the logger
         oldValues.itemChanges = itemChanges;
         newValues.itemChanges = itemChanges;
         changedFields.push('items');
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
      // Only pass the changed fields to the logger, not the entire order objects
      await logOrderChange('update', id, oldValues, newValues, req);
    } else {
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
    const requestData = await req.json();
    const { status, action, itemIndex } = requestData;

    // Handle item deletion
    if (action === 'deleteItem' && itemIndex !== undefined) {
      const order = await Order.findById(id);
      if (!order) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Order not found" 
          }), 
          { status: 404 }
        );
      }

      // Validate item index
      const index = parseInt(itemIndex);
      if (isNaN(index) || index < 0 || index >= order.items.length) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Invalid item index" 
          }), 
          { status: 400 }
        );
      }

      // Remove the item using $pull operator with the item's _id
      const itemToRemove = order.items[index];
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { $pull: { items: { _id: (itemToRemove as any)._id } } },
        { new: true }
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Item deleted successfully",
          data: updatedOrder 
        }), 
        { status: 200 }
      );
    }

    // Fast status change - minimal validation and no logging for speed
    if (status && ['pending', 'delivered'].includes(status)) {
      // Direct update without validation or logging for maximum speed
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: false, select: '_id orderId status' }
      );

      if (!updatedOrder) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Order not found" 
          }), 
          { status: 404 }
        );
      }

      // Return minimal response immediately
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Order status updated successfully", 
          data: {
            _id: updatedOrder._id,
            orderId: updatedOrder.orderId,
            status: updatedOrder.status
          }
        }), 
        { status: 200 }
      );
    }

    // Fallback for other status values
    const validStatuses = ['Not selected', 'pending', 'delivered'];
    if (status && !validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid status. Must be one of: Not selected, pending, delivered" 
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

    // Update the order - optimized for status change only
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

    // Log the status change (async, don't wait for it)
    logOrderChange('status_change', id, { status: oldStatus }, { status: updatedOrder.status }, req)
      .catch(error => {}); // Silent error handling

    // Return minimal response for faster performance
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order status updated successfully", 
        data: {
          _id: updatedOrder._id,
          orderId: updatedOrder.orderId,
          status: updatedOrder.status
        }
      }), 
      { status: 200 }
    );
  } catch (error: unknown) {
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

