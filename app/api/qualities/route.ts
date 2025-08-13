import dbConnect from "@/lib/dbConnect";
import Quality from "@/models/Quality";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    await requireAuth(req);

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let query = {};
    
    // If search parameter is provided, search by name with case-insensitive partial match
    if (search && search.trim()) {
      query = {
        name: { $regex: search.trim(), $options: 'i' }
      };
    }

    // Get qualities with search filter, limit to 20 results, sorted by name
    const qualities = await Quality.find(query)
      .sort({ name: 1 })
      .limit(20)
      .select('_id name description createdAt updatedAt');

    return new Response(JSON.stringify({ 
      success: true, 
      data: qualities 
    }), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Unauthorized" 
        }), { status: 401 });
      }
    }
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ 
      success: false, 
      message 
    }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    await requireAuth(req);

    const { name, description } = await req.json();

    // Validation
    const errors: string[] = [];
    
    if (!name || !name.trim()) {
      errors.push("Quality name is required");
    } else if (name.trim().length < 2) {
      errors.push("Quality name must be at least 2 characters long");
    } else if (name.trim().length > 100) {
      errors.push("Quality name cannot exceed 100 characters");
    }
    
    if (description && description.trim().length > 500) {
      errors.push("Description cannot exceed 500 characters");
    }
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errors.join(", ") 
        }), 
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if quality with same name already exists (case-insensitive)
    const existingQuality = await Quality.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' } 
    });
    
    if (existingQuality) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "A quality with this name already exists" 
        }), 
        { status: 400 }
      );
    }

    // Create quality data object
    const qualityData = {
      name: name.trim(),
      description: description ? description.trim() : undefined,
    };
    
    const createdQuality = await Quality.create(qualityData);

    // Return the created quality without sensitive fields
    const qualitySafe = {
      _id: createdQuality._id,
      name: createdQuality.name,
      description: createdQuality.description,
      createdAt: createdQuality.createdAt,
      updatedAt: createdQuality.updatedAt,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Quality created successfully", 
        data: qualitySafe 
      }), 
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Unauthorized" 
        }), { status: 401 });
      }
      
      // Handle MongoDB duplicate key errors
      if (error.message.includes('E11000')) {
        if (error.message.includes('name')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "A quality with this name already exists" 
            }), 
            { status: 400 }
          );
        }
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: validationErrors.join(", ") 
          }), 
          { status: 400 }
        );
      }
    }
    
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ 
      success: false, 
      message 
    }), { status: 500 });
  }
}
