import dbConnect from "@/lib/dbConnect";
import Fabric from "@/models/Fabric";
import { type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    
    const fabric = await Fabric.findById(id);
    
    if (!fabric) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Fabric not found" 
      }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: fabric 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Fabric GET error:', error);
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
    
    // Check if this exact combination already exists (excluding current fabric)
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
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Fabric updated successfully",
      data: fabric 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Fabric PUT error:', error);
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
