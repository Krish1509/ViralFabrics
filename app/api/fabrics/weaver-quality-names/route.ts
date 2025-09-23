import dbConnect from "@/lib/dbConnect";
import Fabric from "@/models/Fabric";
import Weaver from "@/models/Weaver";
import WeaverQualityName from "@/models/WeaverQualityName";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const weaver = searchParams.get('weaver');
    const limit = parseInt(searchParams.get('limit') || '100'); // Default limit for performance
    
    // If no weaver provided, return all weaver quality names or empty array
    if (!weaver) {
      // Return all weaver quality names from WeaverQualityName collection
      const allWeaverQualityNames = await WeaverQualityName.find()
        .sort({ name: 1 })
        .limit(limit)
        .lean()
        .maxTimeMS(3000); // 3 second timeout
      
      const weaverQualityNameNames = allWeaverQualityNames.map(wqn => wqn.name).sort();
      
      // Add cache headers
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      };
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: weaverQualityNameNames 
      }), { status: 200, headers });
    }
    
    // First try to get from WeaverQualityName collection
    const weaverDoc = await Weaver.findOne({ name: weaver });
    if (weaverDoc) {
      const weaverQualityNames = await WeaverQualityName.find({ weaverId: weaverDoc._id })
        .sort({ name: 1 })
        .limit(limit)
        .lean()
        .maxTimeMS(3000); // 3 second timeout
      
      if (weaverQualityNames.length > 0) {
        const weaverQualityNameNames = weaverQualityNames.map(wqn => wqn.name).sort();
        
        // Add cache headers
        const headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        };
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: weaverQualityNameNames 
        }), { status: 200, headers });
      }
    }
    
    // Fallback to Fabric collection
    const fabricWeaverQualityNames = await Fabric.distinct('weaverQualityName', { weaver })
      .maxTimeMS(3000); // 3 second timeout
    
    // Add cache headers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    };
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: fabricWeaverQualityNames.sort() 
    }), { status: 200, headers });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to fetch weaver quality names" 
    }), { status: 500 });
  }
}
