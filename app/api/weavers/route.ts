import dbConnect from "@/lib/dbConnect";
import Weaver from "@/models/Weaver";
import QualityName from "@/models/QualityName";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const qualityNameId = searchParams.get('qualityNameId');
    
    const query: any = {};
    if (qualityNameId) {
      query.qualityNameId = qualityNameId;
    }
    
    const weavers = await Weaver.find(query)
      .sort({ name: 1 });
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: weavers 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Weavers GET error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to fetch weavers" 
    }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const { name, qualityName } = await req.json();
    
    // Validation
    if (!name?.trim()) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Weaver name is required" 
      }), { status: 400 });
    }
    
    if (!qualityName) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Quality name is required" 
      }), { status: 400 });
    }
    
    // Find or create quality name
    let qualityNameDoc = await QualityName.findOne({ name: qualityName });
    if (!qualityNameDoc) {
      qualityNameDoc = new QualityName({ name: qualityName });
      await qualityNameDoc.save();
    }
    
    // Check if weaver already exists for this quality name
    const existingWeaver = await Weaver.findOne({ 
      name: name.trim(),
      qualityNameId: qualityNameDoc._id
    });
    
    if (existingWeaver) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Weaver already exists for this quality name" 
      }), { status: 400 });
    }
    
    // Create weaver
    const weaver = new Weaver({
      name: name.trim(),
      qualityNameId: qualityNameDoc._id
    });
    
    await weaver.save();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Weaver created successfully",
      data: weaver 
    }), { status: 201 });
    
  } catch (error) {
    console.error('Weavers POST error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Failed to create weaver" 
    }), { status: 500 });
  }
}
