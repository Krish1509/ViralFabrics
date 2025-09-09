import dbConnect from "@/lib/dbConnect";
import Fabric from "@/models/Fabric";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const qualityName = searchParams.get('qualityName') || '';
    const weaver = searchParams.get('weaver') || '';
    const weaverQualityName = searchParams.get('weaverQualityName') || '';
    const qualityCode = searchParams.get('qualityCode') || '';
    const exact = searchParams.get('exact') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50'); // Default limit for performance
    const page = parseInt(searchParams.get('page') || '1'); // Default page 1
    const skip = (page - 1) * limit; // Calculate skip value for pagination
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // Default sort field
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // Default sort order
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { qualityCode: { $regex: search, $options: 'i' } },
        { qualityName: { $regex: search, $options: 'i' } },
        { weaver: { $regex: search, $options: 'i' } },
        { weaverQualityName: { $regex: search, $options: 'i' } },
        { danier: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (qualityName) {
      query.qualityName = qualityName;
    }
    
    if (weaver) {
      query.weaver = weaver;
    }
    
    if (weaverQualityName) {
      query.weaverQualityName = weaverQualityName;
    }
    
    // Handle exact quality code check
    if (qualityCode) {
      if (exact) {
        // Exact match for quality code checking
        query.qualityCode = qualityCode.trim();
      } else {
        // Partial match for search
        query.qualityCode = { $regex: qualityCode, $options: 'i' };
      }
    }
    
    // Get total count for pagination info
    const totalCount = await Fabric.countDocuments(query).maxTimeMS(5000);
    
    // Build sort object dynamically
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    console.log('Fabrics API - Sorting parameters:', { sortBy, sortOrder, sortObj });
    
    // Optimized query with pagination, limits and timeout
    const fabrics = await Fabric.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(5000); // 5 second timeout for reliable loading
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Add cache headers for super fast loading
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    };
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: fabrics,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    }), { status: 200, headers });
    
  } catch (error) {
    console.error('Fabrics GET error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to fetch fabrics" 
    }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const requestData = await req.json();
    
    // Handle both single fabric and array of fabrics
    const fabricsData = Array.isArray(requestData) ? requestData : [requestData];
    
    const createdFabrics = [];
    const errors: string[] = [];
    const qualityCodesInRequest = new Set(); // Track quality codes in this request
    
    for (let i = 0; i < fabricsData.length; i++) {
      const fabricData = fabricsData[i];
      const {
        qualityCode,
        qualityName,
        weaver,
        weaverQualityName,
        greighWidth,
        finishWidth,
        weight,
        gsm,
        danier,
        reed,
        pick,
        greighRate,
        label,
        images
      } = fabricData;
      
      // Validation for each fabric
      const fabricErrors: string[] = [];
      
      if (!qualityCode?.trim()) {
        fabricErrors.push("Quality code is required");
      }
      
      if (!qualityName?.trim()) {
        fabricErrors.push("Quality name is required");
      }
      
      if (!weaver?.trim()) {
        fabricErrors.push("Weaver is required");
      }
      
      if (!weaverQualityName?.trim()) {
        fabricErrors.push("Weaver quality name is required");
      }
      
      // Only validate numeric fields if they have values
      if (greighWidth && parseFloat(greighWidth) <= 0) {
        fabricErrors.push("Greigh width must be a positive number");
      }
      
      if (finishWidth && parseFloat(finishWidth) <= 0) {
        fabricErrors.push("Finish width must be a positive number");
      }
      
      if (weight && parseFloat(weight) <= 0) {
        fabricErrors.push("Weight must be a positive number");
      }
      
      if (gsm && parseFloat(gsm) <= 0) {
        fabricErrors.push("GSM must be a positive number");
      }
      
      if (reed && parseFloat(reed) <= 0) {
        fabricErrors.push("Reed must be a positive number");
      }
      
      if (pick && parseFloat(pick) <= 0) {
        fabricErrors.push("Pick must be a positive number");
      }
      
      if (greighRate && parseFloat(greighRate) <= 0) {
        fabricErrors.push("Greigh rate must be a positive number");
      }
      
      if (fabricErrors.length > 0) {
        errors.push(`Item ${i + 1}: ${fabricErrors.join(", ")}`);
        continue;
      }
      
       // Check if this exact combination already exists
       const existingFabric = await Fabric.findOne({ 
         qualityCode: qualityCode.trim(),
         weaver: weaver.trim(),
         weaverQualityName: weaverQualityName.trim()
       });
       if (existingFabric) {
         errors.push(`Item ${i + 1}: A fabric with quality code "${qualityCode.trim()}", weaver "${weaver.trim()}", and weaver quality "${weaverQualityName.trim()}" already exists`);
         continue;
       }
      
      // Create fabric
      const fabric = new Fabric({
        qualityCode: qualityCode.trim(),
        qualityName: qualityName.trim(),
        weaver: weaver.trim(),
        weaverQualityName: weaverQualityName.trim(),
        greighWidth: greighWidth ? parseFloat(greighWidth) : 0,
        finishWidth: finishWidth ? parseFloat(finishWidth) : 0,
        weight: weight ? parseFloat(weight) : 0,
        gsm: gsm ? parseFloat(gsm) : 0,
        danier: danier?.trim() || '',
        reed: reed ? parseFloat(reed) : 0,
        pick: pick ? parseFloat(pick) : 0,
        greighRate: greighRate ? parseFloat(greighRate) : 0,
        label: label?.trim() || '',
        images: images || []
      });
      
      await fabric.save();
      createdFabrics.push(fabric);
    }
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: errors.join("; ") 
      }), { status: 400 });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: fabricsData.length === 1 ? "Fabric created successfully" : `${fabricsData.length} fabrics created successfully`,
      data: createdFabrics 
    }), { status: 201 });
    
  } catch (error) {
    console.error('Fabrics POST error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to create fabric" 
    }), { status: 500 });
  }
}

// DELETE /api/fabrics - Delete multiple fabrics by quality code and quality name OR by fabric IDs
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const qualityCode = searchParams.get('qualityCode');
    const qualityName = searchParams.get('qualityName');
    
    // Check if we're deleting by fabric IDs (from request body)
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const body = await req.json();
        const { fabricIds } = body;
        
        if (fabricIds && Array.isArray(fabricIds) && fabricIds.length > 0) {
          // Delete by fabric IDs
          const deleteResult = await Fabric.deleteMany({
            _id: { $in: fabricIds }
          });
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: `Successfully deleted ${deleteResult.deletedCount} fabric(s)`,
            deletedCount: deleteResult.deletedCount
          }), { status: 200 });
        }
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
      }
    }
    
    // Fallback to quality code and quality name deletion
    if (!qualityCode || !qualityName) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Quality code and quality name are required for bulk deletion, or fabric IDs must be provided in request body" 
      }), { status: 400 });
    }
    
    // Find all fabrics with the specified quality code and quality name
    const fabricsToDelete = await Fabric.find({
      qualityCode: qualityCode,
      qualityName: qualityName
    });
    
    if (fabricsToDelete.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No fabrics found with the specified quality code and quality name" 
      }), { status: 404 });
    }
    
    // Delete all matching fabrics
    const deleteResult = await Fabric.deleteMany({
      qualityCode: qualityCode,
      qualityName: qualityName
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully deleted ${deleteResult.deletedCount} fabric(s)`,
      deletedCount: deleteResult.deletedCount
    }), { status: 200 });
    
  } catch (error) {
    console.error('Fabrics DELETE error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to delete fabrics" 
    }), { status: 500 });
  }
}
