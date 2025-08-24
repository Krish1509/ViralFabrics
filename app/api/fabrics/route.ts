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
      .maxTimeMS(3000); // 3 second timeout
    
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
      label
    } = await req.json();
    
    // Validation
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
    
    // Only validate numeric fields if they have values
    if (greighWidth && parseFloat(greighWidth) <= 0) {
      errors.push("Greigh width must be a positive number");
    }
    
    if (finishWidth && parseFloat(finishWidth) <= 0) {
      errors.push("Finish width must be a positive number");
    }
    
    if (weight && parseFloat(weight) <= 0) {
      errors.push("Weight must be a positive number");
    }
    
    if (gsm && parseFloat(gsm) <= 0) {
      errors.push("GSM must be a positive number");
    }
    
    if (reed && parseFloat(reed) <= 0) {
      errors.push("Reed must be a positive number");
    }
    
    if (pick && parseFloat(pick) <= 0) {
      errors.push("Pick must be a positive number");
    }
    
    if (greighRate && parseFloat(greighRate) <= 0) {
      errors.push("Greigh rate must be a positive number");
    }
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: errors.join(", ") 
      }), { status: 400 });
    }
    
    // Check if quality code already exists
    const existingFabric = await Fabric.findOne({ qualityCode: qualityCode.trim() });
    if (existingFabric) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Quality code already exists" 
      }), { status: 400 });
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
      label: label?.trim() || ''
    });
    
    await fabric.save();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Fabric created successfully",
      data: fabric 
    }), { status: 201 });
    
  } catch (error) {
    console.error('Fabrics POST error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to create fabric" 
    }), { status: 500 });
  }
}
