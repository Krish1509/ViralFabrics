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
    // Check cache first
    const cached = fabricCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
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
    // First, get the fabric to find its quality code
    const queryStartTime = Date.now();
    const fabric = await Fabric.findById(id)
      .lean()
      .select('qualityCode qualityName')
      .maxTimeMS(3000);
    const queryTime = Date.now() - queryStartTime;
    if (!fabric) {
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
    const totalTime = Date.now() - startTime;
    // Cache the data
    fabricCache.set(id, { data: allItems, timestamp: Date.now() });
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
      images,
      updateAllItems,
      allItems,
      updateAllWithQualityCode,
      originalQualityCode
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
    
    const currentFabric = await Fabric.findById(id);
    if (!currentFabric) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Fabric not found" 
      }), { status: 404 });
    }
    
         // Handle quality code change updates
     if (updateAllWithQualityCode && originalQualityCode) {
       // IMPORTANT: Check if the new quality code already exists
       const existingFabricsWithNewQuality = await Fabric.find({
         qualityCode: qualityCode.trim()
       }).select('qualityName weaver weaverQualityName');
       
       if (existingFabricsWithNewQuality.length > 0) {
         // Quality code already exists - prevent the change
         return new Response(JSON.stringify({ 
           success: false, 
           message: `Quality code "${qualityCode.trim()}" already exists and cannot be used. Please choose a different quality code.`,
           existingFabrics: existingFabricsWithNewQuality
         }), { status: 400 });
       }
       
       // Quality code is unique - proceed with update
       // Update ALL fabrics that share the original quality code
       const updateResult = await Fabric.updateMany(
         { qualityCode: originalQualityCode },
         { 
           qualityCode: qualityCode.trim(),
           qualityName: qualityName.trim()
         }
       );
       
       // Return success
       return new Response(JSON.stringify({ 
         success: true, 
         message: `Successfully updated ${updateResult.modifiedCount} fabric(s) with new quality code`,
         updatedCount: updateResult.modifiedCount
       }), { status: 200 });
     }
    
    // Handle updating all items in a quality code group
    if (updateAllItems && allItems && Array.isArray(allItems)) {
      // First, get all existing fabrics with this quality code
      const existingFabrics = await Fabric.find({ 
        qualityCode: currentFabric.qualityCode 
      }).sort({ createdAt: 1 });
      
      // Update each existing fabric with the new data
      const updatePromises = existingFabrics.map(async (existingFabric, index) => {
        const newData = allItems[index] || allItems[0]; // Use corresponding item or fallback to first
        
        if (newData) {
          return Fabric.findByIdAndUpdate(
            existingFabric._id,
            {
              qualityCode: newData.qualityCode.trim(),
              qualityName: newData.qualityName.trim(),
              weaver: newData.weaver.trim(),
              weaverQualityName: newData.weaverQualityName.trim(),
              greighWidth: newData.greighWidth || 0,
              finishWidth: newData.finishWidth || 0,
              weight: newData.weight || 0,
              gsm: newData.gsm || 0,
              danier: newData.danier?.trim() || '',
              reed: newData.reed || 0,
              pick: newData.pick || 0,
              greighRate: newData.greighRate || 0,
              images: newData.images || []
            },
            { new: true, runValidators: true }
          );
        }
      });
      
      // Wait for all updates to complete
      const updatedFabrics = await Promise.all(updatePromises.filter(Boolean));
      
      // Invalidate cache after update
      fabricCache.delete(id);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Successfully updated ${updatedFabrics.length} fabric(s)`,
        updatedCount: updatedFabrics.length,
        originalItemCount: existingFabrics.length, // Return original count for frontend logic
        data: updatedFabrics[0] // Return first updated fabric for reference
      }), { status: 200 });
    }
    
    // Check if this is a quality code/name change
    const isQualityChange = currentFabric.qualityCode !== qualityCode.trim() || 
                           currentFabric.qualityName !== qualityName.trim();
    
    if (isQualityChange) {
      // This is a quality code/name change - always allow it
      // Check if other fabrics use the new quality code (for warning purposes only)
      const otherFabricsWithSameQuality = await Fabric.find({
        qualityCode: qualityCode.trim(),
        _id: { $ne: id }
      }).select('qualityName weaver weaverQualityName');
      
      if (otherFabricsWithSameQuality.length > 0) {
        // Show warning but proceed with update
        const warningMessage = `Quality code "${qualityCode.trim()}" is already used by ${otherFabricsWithSameQuality.length} other fabric(s). Proceeding with update.`;
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
    const totalTime = Date.now() - startTime;
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Fabric updated successfully",
      data: fabric 
    }), { status: 200 });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
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
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Fabric deleted successfully" 
    }), { status: 200 });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to delete fabric" 
    }), { status: 500 });
  }
}
