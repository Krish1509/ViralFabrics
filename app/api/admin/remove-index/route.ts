import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const db = (global as any).mongooseCache?.conn?.connection?.db;
    if (!db) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Database connection not available" 
        }), 
        { status: 500 }
      );
    }

    const ordersCollection = db.collection('orders');

    // List all indexes
    console.log('Current indexes:');
    const indexes = await ordersCollection.indexes();
    indexes.forEach((index: any) => {
      console.log('Index:', index.name, 'Keys:', index.key);
    });

    // Find and remove the problematic index
    const problematicIndex = indexes.find((index: any) => 
      index.key.party === 1 && 
      index.key.poNumber === 1 && 
      index.key.styleNo === 1
    );

    if (problematicIndex) {
      console.log('Found problematic index:', problematicIndex.name);
      await ordersCollection.dropIndex(problematicIndex.name);
      console.log('Successfully removed problematic index');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully removed index: ${problematicIndex.name}` 
        }), 
        { status: 200 }
      );
    } else {
      console.log('No problematic index found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No problematic index found" 
        }), 
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error removing index:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { status: 500 }
    );
  }
}
