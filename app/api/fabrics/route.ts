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
    const limit = parseInt(searchParams.get('limit') || '50'); // Default limit for performance
    
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
    
    // Optimized query with limits and timeout
    const fabrics = await Fabric.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .maxTimeMS(10000); // 10 second timeout - increased from 3s
    
    // Add cache headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    };
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: fabrics 
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
      
      // No validation required - all fields are optional and can be any value
      
      // Quality code validation - must be unique across all fabrics
      let finalQualityCode = qualityCode?.trim() || '';
      if (!finalQualityCode) {
        // Generate unique code if empty
        finalQualityCode = `FAB_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      } else {
        // Check if quality code exists in database
        const existingFabric = await Fabric.findOne({ qualityCode: finalQualityCode });
        if (existingFabric) {
          errors.push(`Item ${i + 1}: Quality code "${finalQualityCode}" already exists. Please use a different code.`);
          continue;
        }
      }
      
      // Create fabric
      const fabric = new Fabric({
        qualityCode: finalQualityCode,
        qualityName: qualityName?.trim() || '',
        weaver: weaver?.trim() || '',
        weaverQualityName: weaverQualityName?.trim() || '',
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

// DELETE /api/fabrics - Delete multiple fabrics by quality code
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const qualityCode = searchParams.get('qualityCode');
    
    if (!qualityCode) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Quality code is required for bulk deletion" 
      }), { status: 400 });
    }
    
    // Find all fabrics with the specified quality code
    const fabricsToDelete = await Fabric.find({
      qualityCode: qualityCode
    });
    
    if (fabricsToDelete.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No fabrics found with the specified quality code" 
      }), { status: 404 });
    }
    
    // Delete all matching fabrics
    const deleteResult = await Fabric.deleteMany({
      qualityCode: qualityCode
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
