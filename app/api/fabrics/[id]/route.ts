import dbConnect from "@/lib/dbConnect";
import Fabric from "@/models/Fabric";
import { type NextRequest } from "next/server";

// Simple in-memory cache for fabric data (5 minute TTL)
const fabricCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  try {
    console.log(`[${new Date().toISOString()}] GET fabric request for ID: ${id}`);
    
    // Check cache first
    const cached = fabricCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`[${new Date().toISOString()}] Returning cached fabric data for ID: ${id}`);
      return new Response(JSON.stringify({ 
        success: true, 
        data: cached.data,
        cached: true
      }), { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Connect to database with timeout
    const dbStartTime = Date.now();
    await dbConnect();
    const dbConnectTime = Date.now() - dbStartTime;
    console.log(`[${new Date().toISOString()}] Database connected in ${dbConnectTime}ms`);
    
    // First, get the fabric to find its quality code
    const queryStartTime = Date.now();
    const fabric = await Fabric.findById(id)
      .lean()
      .select('qualityCode qualityName')
      .maxTimeMS(3000);
    const queryTime = Date.now() - queryStartTime;
    console.log(`[${new Date().toISOString()}] Initial fabric query completed in ${queryTime}ms`);
    
    if (!fabric) {
      console.log(`[${new Date().toISOString()}] Fabric not found for ID: ${id}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Fabric not found" 
      }), { status: 404 });
    }
    
    // Now get ALL fabrics with the same quality code (all items)
    const allItemsQueryStart = Date.now();
    const allItems = await Fabric.find({ 
      qualityCode: fabric.qualityCode 
    })
      .lean()
      .select('qualityCode qualityName weaver weaverQualityName greighWidth finishWidth weight gsm danier reed pick greighRate images')
      .maxTimeMS(3000);
    const allItemsQueryTime = Date.now() - allItemsQueryStart;
    console.log(`[${new Date().toISOString()}] All items query completed in ${allItemsQueryTime}ms - Found ${allItems.length} items`);
    
    const totalTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] All items loaded successfully for quality code: ${fabric.qualityCode} (Total time: ${totalTime}ms)`);
    
    // Cache the data
    fabricCache.set(id, { data: allItems, timestamp: Date.now() });
    console.log(`[${new Date().toISOString()}] All items data cached for ID: ${id}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: allItems,
      totalItems: allItems.length,
      qualityCode: fabric.qualityCode
    }), { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Cache': 'MISS'
      }
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Fabric GET error after ${totalTime}ms:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to fetch fabric" 
    }), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  try {
    console.log(`[${new Date().toISOString()}] PUT fabric request for ID: ${id}`);
    await dbConnect();
    
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
      images
    } = await req.json();
    
    // Basic validation for required fields
    const errors: string[] = [];
    
    if (!qualityCode?.trim()) {
      errors.push("Quality code is required");
    }
    
    if (!qualityName?.trim()) {
      errors.push("Quality name is required");
    }
    
    if (!weaver?.trim()) {
      errors.push("Weaver is required");
    }
    
    if (!weaverQualityName?.trim()) {
      errors.push("Weaver quality name is required");
    }
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: errors.join(", ") 
      }), { status: 400 });
    }
    
    // For updates, we need to be more flexible with validation
    // Since this is an edit operation, we should allow the user to change any field
    // Only check for duplicates if the user is not changing the quality code/name
    
    const currentFabric = await Fabric.findById(id);
    if (!currentFabric) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Fabric not found" 
      }), { status: 404 });
    }
    
    // Check if this is a quality code/name change
    const isQualityChange = currentFabric.qualityCode !== qualityCode.trim() || 
                           currentFabric.qualityName !== qualityName.trim();
    
    if (isQualityChange) {
      // This is a quality code/name change - always allow it
      console.log('Quality code/name change detected - allowing update');
      
      // Check if other fabrics use the new quality code (for warning purposes only)
      const otherFabricsWithSameQuality = await Fabric.find({
        qualityCode: qualityCode.trim(),
        _id: { $ne: id }
      }).select('qualityName weaver weaverQualityName');
      
      if (otherFabricsWithSameQuality.length > 0) {
        // Show warning but proceed with update
        const warningMessage = `Quality code "${qualityCode.trim()}" is already used by ${otherFabricsWithSameQuality.length} other fabric(s). Proceeding with update.`;
        console.log('Quality change with existing fabrics - showing warning');
        
        // Update the fabric
        const fabric = await Fabric.findByIdAndUpdate(
          id,
          {
            qualityCode: qualityCode.trim(),
            qualityName: qualityName.trim(),
            weaver: weaver.trim(),
            weaverQualityName: weaverQualityName.trim(),
            greighWidth: greighWidth || 0,
            finishWidth: finishWidth || 0,
            weight: weight || 0,
            gsm: gsm || 0,
            danier: danier?.trim() || '',
            reed: reed || 0,
            pick: pick || 0,
            greighRate: greighRate || 0,
            images: images || []
          },
          { new: true, runValidators: true }
        );
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: warningMessage,
          warning: true,
          existingFabrics: otherFabricsWithSameQuality,
          data: fabric 
        }), { status: 200 });
      }
    } else {
      // No quality change - check for duplicate weaver combinations
      const existingFabric = await Fabric.findOne({ 
        qualityCode: qualityCode.trim(),
        weaver: weaver.trim(),
        weaverQualityName: weaverQualityName.trim(),
        _id: { $ne: id }
      });
      
      if (existingFabric) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "This exact fabric combination already exists" 
        }), { status: 400 });
      }
    }
    
    // If we reach here, proceed with the update
    // This handles cases where:
    // 1. Quality change with no conflicts
    // 2. No quality change and no duplicates
    console.log('Proceeding with fabric update');
    
    // Update fabric with flexible validation
    const fabric = await Fabric.findByIdAndUpdate(
      id,
      {
        qualityCode: qualityCode.trim(),
        qualityName: qualityName.trim(),
        weaver: weaver.trim(),
        weaverQualityName: weaverQualityName.trim(),
        greighWidth: greighWidth || 0,
        finishWidth: finishWidth || 0,
        weight: weight || 0,
        gsm: gsm || 0,
        danier: danier?.trim() || '',
        reed: reed || 0,
        pick: pick || 0,
        greighRate: greighRate || 0,
        images: images || []
      },
      { new: true, runValidators: true }
    );
    
    if (!fabric) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Fabric not found" 
      }), { status: 404 });
    }
    
    // Invalidate cache after update
    fabricCache.delete(id);
    console.log(`[${new Date().toISOString()}] Cache invalidated for updated fabric ID: ${id}`);
    
    const totalTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Fabric updated successfully in ${totalTime}ms`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Fabric updated successfully",
      data: fabric 
    }), { status: 200 });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Fabric PUT error after ${totalTime}ms:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to update fabric" 
    }), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    
    const fabric = await Fabric.findByIdAndDelete(id);
    
    if (!fabric) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Fabric not found" 
      }), { status: 404 });
    }
    
    // Invalidate cache after deletion
    fabricCache.delete(id);
    console.log(`[${new Date().toISOString()}] Cache invalidated for deleted fabric ID: ${id}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Fabric deleted successfully" 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Fabric DELETE error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to delete fabric" 
    }), { status: 500 });
  }
}
