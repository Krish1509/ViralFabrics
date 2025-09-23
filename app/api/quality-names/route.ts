import dbConnect from "@/lib/dbConnect";
import QualityName from "@/models/QualityName";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const qualityNames = await QualityName.find()
      .sort({ name: 1 });
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: qualityNames 
    }), { status: 200 });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to fetch quality names" 
    }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const { name } = await req.json();
    
    // Validation
    if (!name?.trim()) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Quality name is required" 
      }), { status: 400 });
    }
    
    // Check if quality name already exists
    const existingQualityName = await QualityName.findOne({ 
      name: name.trim() 
    });
    
    if (existingQualityName) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Quality name already exists" 
      }), { status: 400 });
    }
    
    // Create quality name
    const qualityName = new QualityName({
      name: name.trim()
    });
    
    await qualityName.save();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Quality name created successfully",
      data: qualityName 
    }), { status: 201 });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to create quality name" 
    }), { status: 500 });
  }
}
