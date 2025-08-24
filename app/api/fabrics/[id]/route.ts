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
      greighRate
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
    
    if (!greighWidth || greighWidth <= 0) {
      errors.push("Greigh width must be a positive number");
    }
    
    if (!finishWidth || finishWidth <= 0) {
      errors.push("Finish width must be a positive number");
    }
    
    if (!weight || weight <= 0) {
      errors.push("Weight must be a positive number");
    }
    
    if (!gsm || gsm <= 0) {
      errors.push("GSM must be a positive number");
    }
    
    if (!danier?.trim()) {
      errors.push("Danier is required");
    }
    
    if (!reed || reed <= 0) {
      errors.push("Reed must be a positive number");
    }
    
    if (!pick || pick <= 0) {
      errors.push("Pick must be a positive number");
    }
    
    if (!greighRate || greighRate <= 0) {
      errors.push("Greigh rate must be a positive number");
    }
    
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: errors.join(", ") 
      }), { status: 400 });
    }
    
    // Check if quality code already exists (excluding current fabric)
    const existingFabric = await Fabric.findOne({ 
      qualityCode: qualityCode.trim(),
      _id: { $ne: id }
    });
    
    if (existingFabric) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Quality code already exists" 
      }), { status: 400 });
    }
    
    // Update fabric
    const fabric = await Fabric.findByIdAndUpdate(
      id,
      {
        qualityCode: qualityCode.trim(),
        qualityName: qualityName.trim(),
        weaver: weaver.trim(),
        weaverQualityName: weaverQualityName.trim(),
        greighWidth: parseFloat(greighWidth),
        finishWidth: parseFloat(finishWidth),
        weight: parseFloat(weight),
        gsm: parseFloat(gsm),
        danier: danier.trim(),
        reed: parseFloat(reed),
        pick: parseFloat(pick),
        greighRate: parseFloat(greighRate)
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
