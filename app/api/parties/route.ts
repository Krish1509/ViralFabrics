import dbConnect from "@/lib/dbConnect";
import Party from "@/models/Party";
import { requireAuth } from "@/lib/session";
import { type NextRequest } from "next/server";
import { logCreate } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    // Remove authentication requirement for now
    // await requireAuth(req);

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

    // Get parties with search filter, limit to 20 results, sorted by name
    const parties = await Party.find(query)
      .sort({ name: 1 })
      .limit(20)
      .select('_id name contactName contactPhone address createdAt updatedAt');

    return new Response(JSON.stringify({ 
      success: true, 
      data: parties 
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
    // Remove authentication requirement for now
    // await requireAuth(req);

    const { name, contactName, contactPhone, address } = await req.json();

    // Validation
    const errors: string[] = [];
    
    if (!name || !name.trim()) {
      errors.push("Party name is required");
    } else if (name.trim().length < 2) {
      errors.push("Party name must be at least 2 characters long");
    } else if (name.trim().length > 100) {
      errors.push("Party name cannot exceed 100 characters");
    }
    
    if (contactName && contactName.trim().length > 50) {
      errors.push("Contact name cannot exceed 50 characters");
    }
    
    if (contactPhone && contactPhone.trim().length > 20) {
      errors.push("Contact phone cannot exceed 20 characters");
    }
    
    if (address && address.trim().length > 200) {
      errors.push("Address cannot exceed 200 characters");
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

    // Check if party with same name already exists (case-insensitive)
    const existingParty = await Party.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' } 
    });
    
    if (existingParty) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "A party with this name already exists" 
        }), 
        { status: 400 }
      );
    }

    // Create party data object
    const partyData = {
      name: name.trim(),
      contactName: contactName ? contactName.trim() : undefined,
      contactPhone: contactPhone ? contactPhone.trim() : undefined,
      address: address ? address.trim() : undefined,
    };
    
    const createdParty = await Party.create(partyData);

    // Log the party creation
    await logCreate('party', (createdParty as any)._id.toString(), { 
      name: createdParty.name,
      contactName: createdParty.contactName,
      contactPhone: createdParty.contactPhone
    }, req);

    // Return the created party without sensitive fields
    const partySafe = {
      _id: createdParty._id,
      name: createdParty.name,
      contactName: createdParty.contactName,
      contactPhone: createdParty.contactPhone,
      address: createdParty.address,
      createdAt: createdParty.createdAt,
      updatedAt: createdParty.updatedAt,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Party created successfully", 
        data: partySafe 
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
              message: "A party with this name already exists" 
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
