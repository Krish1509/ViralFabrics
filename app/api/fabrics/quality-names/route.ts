import dbConnect from "@/lib/dbConnect";
import Fabric from "@/models/Fabric";
import QualityName from "@/models/QualityName";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // First try to get from QualityName collection
    const qualityNames = await QualityName.find().sort({ name: 1 });
    
    if (qualityNames.length > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        data: qualityNames.map(qn => qn.name).sort() 
      }), { status: 200 });
    }
    
    // Fallback to Fabric collection
    const fabricQualityNames = await Fabric.distinct('qualityName');
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: fabricQualityNames.sort() 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Quality names GET error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to fetch quality names" 
    }), { status: 500 });
  }
}
