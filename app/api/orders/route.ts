import dbConnect from "@/lib/dbConnect";
import Order, { IOrderModel, IOrder } from "@/models/Order";
import Party from "@/models/Party";
import Quality from "@/models/Quality";
import Counter from "@/models/Counter";
import { getSession } from "@/lib/session";
import { type NextRequest } from "next/server";
import { logView, logOrderChange, logError } from "@/lib/logger";
import { unauthorizedResponse } from "@/lib/response";

// Simple in-memory cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache

// Ensure all models are registered
const models = { Order, Party, Quality, Counter };

export async function GET(request: NextRequest) {
  try {
    // Validate session first (security check)
    const session = await getSession(request);
    if (!session) {
      return Response.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    // Connect to database with timeout
    await Promise.race([
      dbConnect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 1000); // Increased limit to handle all orders
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const orderType = searchParams.get('orderType') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sort = searchParams.get('sort') || 'latest_first';
    const force = searchParams.get('force') === 'true';
    
    // Create cache key for this query
    const cacheKey = `orders_${JSON.stringify({ limit, page, search, orderType, status, startDate, endDate, sort })}`;
    
    // Check cache first (skip if force refresh)
    if (!force) {   
      const cached = queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return Response.json({
          success: true,
          data: cached.data,
          message: 'Orders loaded from cache',
          total: cached.data.total,
          page: cached.data.page,
          limit: cached.data.limit,
          totalPages: cached.data.totalPages
        });
      }
    }
    
    // Build query with proper search logic
    const query: any = {
      $and: [
        {
          $or: [
            { softDeleted: false },
            { softDeleted: { $exists: false } }
          ]
        }
      ]
    };
    
    let searchConditions: any[] = [];
    if (search) {
      const searchPattern = search.trim();
      let needsPostProcessing = false;
      
      // Check if search has type prefix (e.g., "orderId:123", "party:ABC")
      if (searchPattern.includes(':')) {
        const [searchType, searchValue] = searchPattern.split(':', 2);
        const trimmedValue = searchValue.trim();
        
        switch (searchType.toLowerCase()) {
          case 'orderid':
          case 'order':
            searchConditions = [
              { orderId: { $regex: trimmedValue, $options: 'i' } },
              { orderId: trimmedValue } // Exact match
            ];
            break;
          case 'ponumber':
          case 'po':
            searchConditions = [
              { poNumber: { $regex: trimmedValue, $options: 'i' } }
            ];
            break;
          case 'styleno':
          case 'style':
            searchConditions = [
              { styleNo: { $regex: trimmedValue, $options: 'i' } }
            ];
            break;
          case 'party':
            // For party search, we need to find party IDs first, then search orders
            try {
              const parties = await Party.find({
                $or: [
                  { name: { $regex: trimmedValue, $options: 'i' } },
                  { contactName: { $regex: trimmedValue, $options: 'i' } },
                  { contactPhone: { $regex: trimmedValue, $options: 'i' } }
                ]
              }).select('_id').lean().maxTimeMS(2000);
              
              const partyIds = parties.map(p => p._id);
              console.log(`🔍 Party Search: Found ${parties.length} parties matching "${trimmedValue}":`, partyIds);
              if (partyIds.length > 0) {
                searchConditions = [
                  { party: { $in: partyIds } },
                  { orderId: { $regex: trimmedValue, $options: 'i' } },
                  { contactName: { $regex: trimmedValue, $options: 'i' } },
                  { poNumber: { $regex: trimmedValue, $options: 'i' } },
                  { styleNo: { $regex: trimmedValue, $options: 'i' } },
                  { contactPhone: { $regex: trimmedValue, $options: 'i' } }
                ];
              } else {
                // No parties found, search other fields as fallback
                searchConditions = [
                  { orderId: { $regex: trimmedValue, $options: 'i' } },
                  { contactName: { $regex: trimmedValue, $options: 'i' } },
                  { poNumber: { $regex: trimmedValue, $options: 'i' } },
                  { styleNo: { $regex: trimmedValue, $options: 'i' } },
                  { contactPhone: { $regex: trimmedValue, $options: 'i' } }
                ];
              }
            } catch (error) {
              console.error('Party search error:', error);
              // Fallback to basic search
              searchConditions = [
                { orderId: { $regex: trimmedValue, $options: 'i' } },
                { contactName: { $regex: trimmedValue, $options: 'i' } },
                { poNumber: { $regex: trimmedValue, $options: 'i' } },
                { styleNo: { $regex: trimmedValue, $options: 'i' } },
                { contactPhone: { $regex: trimmedValue, $options: 'i' } }
              ];
            }
            needsPostProcessing = true;
            break;
          case 'quality':
            // For quality search, we need to find quality IDs first, then search orders
            try {
              const qualities = await Quality.find({
                $or: [
                  { name: { $regex: trimmedValue, $options: 'i' } },
                  { description: { $regex: trimmedValue, $options: 'i' } }
                ]
              }).select('_id').lean().maxTimeMS(2000);
              
              const qualityIds = qualities.map(q => q._id);
              console.log(`🔍 Quality Search: Found ${qualities.length} qualities matching "${trimmedValue}":`, qualityIds);
              if (qualityIds.length > 0) {
                searchConditions = [
                  { 'items.quality': { $in: qualityIds } },
                  { orderId: { $regex: trimmedValue, $options: 'i' } },
                  { 'items.description': { $regex: trimmedValue, $options: 'i' } },
                  { 'items.weaverSupplierName': { $regex: trimmedValue, $options: 'i' } },
                  { contactName: { $regex: trimmedValue, $options: 'i' } }
                ];
              } else {
                // No qualities found, search other fields as fallback
                searchConditions = [
                  { orderId: { $regex: trimmedValue, $options: 'i' } },
                  { 'items.description': { $regex: trimmedValue, $options: 'i' } },
                  { 'items.weaverSupplierName': { $regex: trimmedValue, $options: 'i' } },
                  { contactName: { $regex: trimmedValue, $options: 'i' } }
                ];
              }
            } catch (error) {
              console.error('Quality search error:', error);
              // Fallback to basic search
              searchConditions = [
                { orderId: { $regex: trimmedValue, $options: 'i' } },
                { 'items.description': { $regex: trimmedValue, $options: 'i' } },
                { 'items.weaverSupplierName': { $regex: trimmedValue, $options: 'i' } },
                { contactName: { $regex: trimmedValue, $options: 'i' } }
              ];
            }
            needsPostProcessing = true;
            break;
          case 'phone':
            searchConditions = [
              { contactPhone: { $regex: trimmedValue, $options: 'i' } }
            ];
            break;
          default:
            // Fallback to general search
            searchConditions = [
              { orderId: { $regex: trimmedValue, $options: 'i' } },
              { poNumber: { $regex: trimmedValue, $options: 'i' } },
              { styleNo: { $regex: trimmedValue, $options: 'i' } },
              { contactName: { $regex: trimmedValue, $options: 'i' } },
              { contactPhone: { $regex: trimmedValue, $options: 'i' } },
              { 'items.description': { $regex: trimmedValue, $options: 'i' } },
              { 'items.weaverSupplierName': { $regex: trimmedValue, $options: 'i' } }
            ];
            needsPostProcessing = true;
        }
      } else {
        // Enhanced general search across all fields including party and quality
        // First, try to find matching parties and qualities
        let partyIds: any[] = [];
        let qualityIds: any[] = [];
        
        try {
          // Search for matching parties
          const parties = await Party.find({
            $or: [
              { name: { $regex: searchPattern, $options: 'i' } },
              { contactName: { $regex: searchPattern, $options: 'i' } },
              { contactPhone: { $regex: searchPattern, $options: 'i' } }
            ]
          }).select('_id').lean().maxTimeMS(2000);
          partyIds = parties.map(p => p._id);
          
          // Search for matching qualities
          const qualities = await Quality.find({
            $or: [
              { name: { $regex: searchPattern, $options: 'i' } },
              { description: { $regex: searchPattern, $options: 'i' } }
            ]
          }).select('_id').lean().maxTimeMS(2000);
          qualityIds = qualities.map(q => q._id);
        } catch (error) {
          console.error('General search party/quality lookup error:', error);
        }
        
        searchConditions = [
          // Exact matches
          { orderId: { $regex: searchPattern, $options: 'i' } },
          { poNumber: { $regex: searchPattern, $options: 'i' } },
          { styleNo: { $regex: searchPattern, $options: 'i' } },
          { contactName: { $regex: searchPattern, $options: 'i' } },
          { contactPhone: { $regex: searchPattern, $options: 'i' } },
          { 'items.description': { $regex: searchPattern, $options: 'i' } },
          { 'items.weaverSupplierName': { $regex: searchPattern, $options: 'i' } }
        ];
        
        // Add party and quality matches if found
        if (partyIds.length > 0) {
          searchConditions.push({ party: { $in: partyIds } });
        }
        if (qualityIds.length > 0) {
          searchConditions.push({ 'items.quality': { $in: qualityIds } });
        }
        
        // Add exact match for numeric order IDs (highest priority)
        if (/^\d+$/.test(searchPattern)) {
          searchConditions.unshift({ orderId: searchPattern });
        }
        needsPostProcessing = true;
      }
      
      query.$and.push({
        $or: searchConditions
      });
      
    }
    
    if (orderType) {
      query.orderType = orderType;
    }
    
    if (status) {
      // Support multiple status values separated by commas
      const statusArray = status.split(',').map(s => s.trim());
      if (statusArray.length === 1) {
        query.status = statusArray[0];
      } else {
        query.status = { $in: statusArray };
      }
    }
    
    // Add date range filtering
    if (startDate && endDate) {
      query.deliveryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Determine sort order for optimal performance
    let sortOrder: any = { createdAt: -1 }; // Default: latest first
    if (sort === 'oldest_first') {
      sortOrder = { createdAt: 1 }; // Oldest first
    } else if (sort === 'latest_first') {
      sortOrder = { createdAt: -1 }; // Latest first (explicit)
    }
    
    // Ultra-optimized query with minimal data fetching
    const orders = await Order.find(query)
      .populate('party', 'name contactName contactPhone')
      .populate('items.quality', 'name')
      .sort(sortOrder)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
      .maxTimeMS(8000) // Increased timeout for search operations
      .hint({ createdAt: -1 }); // Force index usage for better performance

    // Debug search results
    if (search) {
      console.log(`🔍 Search completed: Found ${orders.length} orders`);
    }

    // Use Promise.all to parallelize all data fetching
    const [labs, millInputs, millOutputs, dispatches, total] = await Promise.all([
      // Fetch lab data for all orders
      orders.length > 0 ? (async () => {
        try {
          const Lab = (await import('@/models/Lab')).default;
          const orderIds = orders.map(order => order._id);
          
          return await Lab.find({ 
            order: { $in: orderIds },
            softDeleted: { $ne: true }
          })
          .select('orderItemId labSendDate labSendData labSendNumber status')
          .lean()
          .hint({ order: 1, softDeleted: 1 }) // Force index usage
          .maxTimeMS(3000); // Increased timeout for reliability
        } catch (labError) {
          return [];
        }
      })() : Promise.resolve([]),
      
      // Fetch mill input data for process information
      orders.length > 0 ? (async () => {
        try {
          const { MillInput } = await import('@/models/Mill');
          const orderIds = orders.map(order => order._id);
          
          const millInputs = await MillInput.find({ 
            order: { $in: orderIds }
          })
          .select('order mill millDate chalanNo greighMtr pcs quality processName')
          .populate('mill', 'name')
          .populate('quality', 'name')
          .lean()
          .hint({ order: 1 }) // Force index usage
          .maxTimeMS(3000); // Increased timeout for reliability
          
          return millInputs;
        } catch (millError) {
          console.error('Mill input fetch error:', millError);
          return [];
        }
      })() : Promise.resolve([]),
      
      // Fetch mill output data for button states
      orders.length > 0 ? (async () => {
        try {
          const MillOutput = (await import('@/models/MillOutput')).default;
          const orderIds = orders.map(order => order._id);
          
          const millOutputs = await MillOutput.find({ 
            order: { $in: orderIds }
          })
          .select('order recdDate millBillNo finishedMtr')
          .lean()
          .hint({ order: 1 }) // Force index usage
          .maxTimeMS(3000); // Increased timeout for reliability
          
          return millOutputs;
        } catch (millError) {
          console.error('Mill output fetch error:', millError);
          return [];
        }
      })() : Promise.resolve([]),
      
      // Fetch dispatch data for button states
      orders.length > 0 ? (async () => {
        try {
          const Dispatch = (await import('@/models/Dispatch')).default;
          const orderIds = orders.map(order => order._id);
          
          const dispatches = await Dispatch.find({ 
            order: { $in: orderIds }
          })
          .select('order dispatchDate dispatchNo quantity')
          .lean()
          .hint({ order: 1 }) // Force index usage
          .maxTimeMS(3000); // Increased timeout for reliability
          
          return dispatches;
        } catch (dispatchError) {
          console.error('Dispatch fetch error:', dispatchError);
          return [];
        }
      })() : Promise.resolve([]),
      
      // Get total count in parallel with optimized query
      Order.countDocuments(query).maxTimeMS(3000).hint({ createdAt: -1 })
    ]);

    // Enhanced fuzzy search function
    const fuzzyMatch = (text: string, searchTerm: string): boolean => {
      if (!text || !searchTerm) return false;
      
      const textLower = text.toLowerCase().trim();
      const searchLower = searchTerm.toLowerCase().trim();
      
      // Exact match (highest priority)
      if (textLower === searchLower) return true;
      
      // Starts with match (high priority)
      if (textLower.startsWith(searchLower)) return true;
      
      // Contains match (medium priority)
      if (textLower.includes(searchLower)) return true;
      
      // Fuzzy match - check if all characters in search term exist in order
      let searchIndex = 0;
      for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
        if (textLower[i] === searchLower[searchIndex]) {
          searchIndex++;
        }
      }
      
      // If we found all characters in order, it's a fuzzy match
      if (searchIndex === searchLower.length) return true;
      
      // Word boundary match - check if search term matches word boundaries
      const words = textLower.split(/\s+/);
      for (const word of words) {
        if (word.startsWith(searchLower) || word.includes(searchLower)) {
          return true;
        }
      }
      
      return false;
    };

    // Post-process search results for party and quality names with enhanced fuzzy search
    let filteredOrders = orders;
    if (search) {
      const searchPattern = search.trim();
      const [searchType, searchValue] = searchPattern.includes(':') ? searchPattern.split(':', 2) : ['all', searchPattern];
      const trimmedValue = searchValue.trim();
      
      // Check if this search type needs post-processing
      const needsPostProcessing = ['party', 'quality', 'all'].includes(searchType.toLowerCase());
      
      if (needsPostProcessing) {
        console.log(`🔍 Post-processing needed for search type: ${searchType}`);
        filteredOrders = orders.filter(order => {
          let hasMatch = false;
          let initialQueryMatch = false;
          
          // Check if order matched the initial MongoDB query
          const orderFields = [
            order.orderId,
            order.poNumber,
            order.styleNo,
            order.contactName,
            order.contactPhone
          ];
          
          // Check items fields
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              if (item.description) orderFields.push(item.description);
              if (item.weaverSupplierName) orderFields.push(item.weaverSupplierName);
            });
          }
          
          // Check if any field matches the search term
          initialQueryMatch = orderFields.some(field => 
            field && fuzzyMatch(field.toString(), trimmedValue)
          );
          
          // Check party name search with fuzzy matching
          if (searchType.toLowerCase() === 'party' || searchType.toLowerCase() === 'all') {
            if (order.party && typeof order.party === 'object' && 'name' in order.party) {
              const partyName = (order.party as any).name;
              if (partyName && fuzzyMatch(partyName, trimmedValue)) {
                hasMatch = true;
              }
            }
          }
          
          // Check quality name search with fuzzy matching
          if (searchType.toLowerCase() === 'quality' || searchType.toLowerCase() === 'all') {
            if (order.items && Array.isArray(order.items)) {
              for (const item of order.items) {
                if (item.quality && typeof item.quality === 'object' && 'name' in item.quality) {
                  const qualityName = (item.quality as any).name;
                  if (qualityName && fuzzyMatch(qualityName, trimmedValue)) {
                    hasMatch = true;
                    break; // Found a match, no need to check other items
                  }
                }
              }
            }
          }
          
          
          // For specific search types, only return if we found a match
          if (searchType.toLowerCase() === 'party' || searchType.toLowerCase() === 'quality') {
            return hasMatch;
          }
          
          // For general search, return true if we found a match OR if it matched the initial MongoDB query
          return hasMatch || initialQueryMatch;
        });
      }
    }

    // Attach lab data and mill input process data to order items
    if (filteredOrders.length > 0) {
      // Create a map of orderItemId to lab data
      const labMap = new Map();
      if (labs.length > 0) {
        labs.forEach(lab => {
          labMap.set(lab.orderItemId.toString(), lab);
        });
      }
      
      // Create a map of order ObjectId to mill input data arrays
      const millInputMap = new Map();
      if (millInputs.length > 0) {
        millInputs.forEach(millInput => {
          const orderId = millInput.order.toString();
          if (!millInputMap.has(orderId)) {
            millInputMap.set(orderId, []);
          }
          millInputMap.get(orderId).push(millInput);
        });
      }

      // Create a map of order ObjectId to mill output data arrays
      const millOutputMap = new Map();
      if (millOutputs.length > 0) {
        millOutputs.forEach(millOutput => {
          const orderId = millOutput.order.toString();
          if (!millOutputMap.has(orderId)) {
            millOutputMap.set(orderId, []);
          }
          millOutputMap.get(orderId).push(millOutput);
        });
      }

      // Create a map of order ObjectId to dispatch data arrays
      const dispatchMap = new Map();
      if (dispatches.length > 0) {
        dispatches.forEach(dispatch => {
          const orderId = dispatch.order.toString();
          if (!dispatchMap.has(orderId)) {
            dispatchMap.set(orderId, []);
          }
          dispatchMap.get(orderId).push(dispatch);
        });
      }
      
      // Attach lab data and process data to order items
      filteredOrders.forEach(order => {
        if (order.items) {
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
            const millInputData = millInputMap.get(order._id.toString());
            if (millInputData) {
              const itemQualityId = item.quality?._id?.toString() || item.quality?.toString();
              const itemQualityName = item.quality?.name || item.quality;
              
              // Find process data for this specific quality
              let qualityProcessData = null;
              
              // Check main quality
              if (millInputData.quality?._id?.toString() === itemQualityId || 
                  millInputData.quality?.name === itemQualityName) {
                qualityProcessData = {
                  mainProcess: millInputData.processName || '',
                  additionalProcesses: []
                };
              }
              
              // Check additional meters for this quality
              if (!qualityProcessData && millInputData.additionalMeters) {
                const matchingAdditional = millInputData.additionalMeters.find((additional: any) => 
                  additional.quality?._id?.toString() === itemQualityId || 
                  additional.quality?.name === itemQualityName
                );
                
                if (matchingAdditional) {
                  qualityProcessData = {
                    mainProcess: matchingAdditional.processName || '',
                    additionalProcesses: []
                  };
                }
              }
              
              // If no quality-specific data found, use the main process data as fallback
              if (!qualityProcessData) {
                qualityProcessData = {
                  mainProcess: millInputData.processName || '',
                  additionalProcesses: millInputData.additionalMeters?.map((additional: any) => additional.processName || '') || []
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
        }
        
        // Add mill inputs, mill outputs, and dispatches to each order for button states
        (order as any).millInputs = millInputMap.get(order._id.toString()) || [];
        (order as any).millOutputs = millOutputMap.get(order._id.toString()) || [];
        (order as any).dispatches = dispatchMap.get(order._id.toString()) || [];
      });
    }

    // Add cache headers - very short cache to prevent stale data after deletions
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': force ? 'no-cache, no-store, must-revalidate' : 'max-age=30, must-revalidate', // 30 second cache for better performance
      'Pragma': 'no-cache'
    };
    
    // Cache the result for future requests
    const responseData = {
      success: true,
      data: filteredOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length, // Use filtered count
        pages: Math.ceil(filteredOrders.length / limit)
      },
      searchInfo: search ? {
        query: search,
        resultsCount: filteredOrders.length,
        hasResults: filteredOrders.length > 0
      } : null
    };
    
    // Store in cache
    queryCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries (keep only last 100 entries)
    if (queryCache.size > 100) {
      const entries = Array.from(queryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - 100);
      toDelete.forEach(([key]) => queryCache.delete(key));
    }
    
    return new Response(JSON.stringify(responseData), { headers });
    
  } catch (error) {
    console.error('Orders API Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Request timeout. Please try again with a simpler search.'
        }), { status: 408 });
      }
      
      if (error.message.includes('Database connection')) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Database connection failed. Please try again.'
        }), { status: 503 });
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch orders. Please try again.'
    }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate session first (security check)
    const session = await getSession(req);
    if (!session) {
      return Response.json(unauthorizedResponse('Unauthorized'), { status: 401 });
    }

    await dbConnect();

    // Extract and validate request body
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
      status,
      items
    } = await req.json();
    
    // Validation
    const errors: string[] = [];
    
    // Optional fields validation (only validate if provided)
    if (orderType && !['Dying', 'Printing'].includes(orderType)) {
      errors.push("Order type must be either 'Dying' or 'Printing' if provided");
    }
    
    if (arrivalDate) {
      const arrival = new Date(arrivalDate);
      if (isNaN(arrival.getTime())) {
        errors.push("Invalid arrival date format");
      }
    }
    
    if (party && party !== '' && !party.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push("Invalid party ID format");
    }
    
    if (contactName && contactName.trim().length > 50) {
      errors.push("Contact name cannot exceed 50 characters");
    }
    
    if (contactPhone && contactPhone.trim().length > 20) {
      errors.push("Contact phone cannot exceed 20 characters");
    }
    
    if (poNumber && poNumber.trim().length > 50) {
      errors.push("PO number cannot exceed 50 characters");
    }
    
    if (styleNo && styleNo.trim().length > 50) {
      errors.push("Style number cannot exceed 50 characters");
    }

    if (poDate) {
      const po = new Date(poDate);
      if (isNaN(po.getTime())) {
        errors.push("Invalid PO date format");
      }
    }
    
    if (deliveryDate) {
      const delivery = new Date(deliveryDate);
      if (isNaN(delivery.getTime())) {
        errors.push("Invalid delivery date format");
      }
    }
    
    // Validate status if provided - temporarily allow all valid statuses
    const validStatuses = ['Not set', 'Not selected', 'pending', 'in_progress', 'completed', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Validate items - quality is optional, quantity is required
    if (items && Array.isArray(items)) {
      items.forEach((item, index) => {
        // Quality is optional for each item
        if (item.quality && item.quality !== '' && !item.quality.match(/^[0-9a-fA-F]{24}$/)) {
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
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ message: errors.join(", ") }), 
        { status: 400 }
      );
    }

    // Improved database connection with retry logic
    let connectionAttempts = 0;
    const maxAttempts = 3;
    let dbConnection = null;

    while (connectionAttempts < maxAttempts) {
      try {
        dbConnection = await dbConnect();
        break;
      } catch (dbError) {
        connectionAttempts++;
        if (connectionAttempts >= maxAttempts) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Database connection failed after multiple attempts" 
            }), 
            { status: 503 }
          );
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts));
      }
    }

    // Use Promise.all to parallelize party and quality validation
    const validationPromises = [];
    
    // Add party validation promise if party is provided
    if (party && party !== '' && party !== 'null' && party !== 'undefined') {
      validationPromises.push(
        Party.findById(party).maxTimeMS(5000).then(partyExists => ({
          type: 'party',
          exists: !!partyExists,
          id: party
        }))
      );
    }
    
    // Add quality validation promises for all items
    if (items && items.length > 0) {
      const uniqueQualityIds = [...new Set(
        items
          .filter((item: any) => item.quality && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined')
          .map((item: any) => item.quality)
      )];
      
      uniqueQualityIds.forEach(qualityId => {
        validationPromises.push(
          Quality.findById(qualityId).maxTimeMS(5000).then(qualityExists => ({
            type: 'quality',
            exists: !!qualityExists,
            id: qualityId
          }))
        );
      });
    }
    
    // Execute all validations in parallel
    if (validationPromises.length > 0) {
      const validationResults = await Promise.all(validationPromises);
      
      // Check validation results
      for (const result of validationResults) {
        if (!result.exists) {
          const message = result.type === 'party' 
            ? "Party not found" 
            : `Quality not found for item`;
          return new Response(
            JSON.stringify({ message }), 
            { status: 400 }
          );
        }
      }
    }

    // Removed duplicate PO + Style combination check - allowing multiple orders with same PO/Style

    // Create order data object with optional fields
    const orderData: any = {
      contactName: contactName ? contactName.trim() : undefined,
      contactPhone: contactPhone ? contactPhone.trim() : undefined,
      poNumber: poNumber ? poNumber.trim() : undefined,
      styleNo: styleNo ? styleNo.trim() : undefined,
      poDate: poDate ? new Date(poDate) : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,

      items: items && items.length > 0 ? items.map((item: any) => ({
        quality: item.quality && item.quality !== '' && item.quality !== 'null' && item.quality !== 'undefined' ? item.quality : undefined,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : undefined,
        imageUrls: item.imageUrls && Array.isArray(item.imageUrls) ? item.imageUrls.map((url: string) => url.trim()) : [],
        description: item.description ? item.description.trim() : undefined,
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
      })) : [],
    };

    // Add optional fields only if they are provided
    if (orderType) {
      orderData.orderType = orderType;
    }
    if (arrivalDate) {
      orderData.arrivalDate = new Date(arrivalDate);
    }
    if (party && party !== '' && party !== 'null' && party !== 'undefined') {
      orderData.party = party;
    }
    if (status && status !== '' && status !== 'null' && status !== 'undefined') {
      orderData.status = status;
      } else {
      // Don't set status - let database default handle it
      }
    // Use the new sequential order creation method with timeout
    // Temporarily bypass schema validation for status
    const orderPromise = (Order as IOrderModel).createOrder(orderData);
    const order = await Promise.race([
      orderPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Order creation timeout')), 15000)
      )
    ]) as IOrder & { _id: string };
    
    // Populate the order with party and quality details
    const populatedOrder = await Order.findById(order._id)
      .populate('party', '_id name contactName contactPhone address')
      .populate('items.quality', '_id name description')
      .select('_id orderId orderType arrivalDate party contactName contactPhone poNumber styleNo poDate deliveryDate items status labData createdAt updatedAt')
      .maxTimeMS(5000);

    if (!populatedOrder) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to retrieve created order" 
        }), 
        { status: 500 }
      );
    }

    // Log the order creation with complete details including items
    const itemChanges = populatedOrder.items.map((item: any, index: number) => {
      const details = [];
      
      // Add quality details
      if (item.quality) {
        details.push(`Quality: "${item.quality.name || item.quality}"`);
      }
      
      // Add quantity details
      if (item.quantity) {
        details.push(`Quantity: ${item.quantity}`);
      }
      
      // Add description details
      if (item.description) {
        details.push(`Description: "${item.description}"`);
      }
      
      // Add weaver details
      if (item.weaverSupplierName) {
        details.push(`Weaver: "${item.weaverSupplierName}"`);
      }
      
      // Add purchase rate details
      if (item.purchaseRate) {
        details.push(`Rate: ₹${Number(item.purchaseRate).toFixed(2)}`);
      }
      
      // Add image details
      if (item.imageUrls && item.imageUrls.length > 0) {
        details.push(`${item.imageUrls.length} image(s)`);
      }
      
      return {
        type: 'item_added',
        index,
        item: {
          quality: item.quality?.name || item.quality || 'Not set',
          quantity: item.quantity || 0,
          description: item.description || '',
          weaverSupplierName: item.weaverSupplierName || '',
          purchaseRate: item.purchaseRate || 0,
          imageUrls: item.imageUrls || [],
          imageCount: (item.imageUrls || []).length
        }
      };
    });
    
    await logOrderChange('create', (order as any)._id.toString(), {}, { 
      orderId: populatedOrder.orderId,
      orderType: populatedOrder.orderType,
      arrivalDate: populatedOrder.arrivalDate,
      party: populatedOrder.party,
      contactName: populatedOrder.contactName,
      contactPhone: populatedOrder.contactPhone,
      poNumber: populatedOrder.poNumber,
      styleNo: populatedOrder.styleNo,
      poDate: populatedOrder.poDate,
      deliveryDate: populatedOrder.deliveryDate,
      status: populatedOrder.status,
      itemChanges: itemChanges
    }, req);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order created successfully", 
        data: populatedOrder 
      }), 
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Unauthorized" 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (error.message.includes("Database connection failed")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Database connection failed. Please try again." 
        }), { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (error.message.includes("Order creation timeout")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Order creation timeout. Please try again." 
        }), { 
          status: 408,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Handle MongoDB duplicate key errors
      if (error.message.includes('E11000')) {
        if (error.message.includes('orderId')) {
          return new Response(
            JSON.stringify({ 
              success: false,
              message: "Order ID already exists. Please try again." 
            }), 
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        return new Response(
          JSON.stringify({ 
            success: false,
            message: validationErrors.join(", ") 
          }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
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
