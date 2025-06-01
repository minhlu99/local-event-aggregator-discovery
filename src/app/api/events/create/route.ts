import { Event } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();

    // Generate a unique ID for the event
    const id = crypto.randomUUID();

    // Create a new event with the submitted data
    const newEvent: Event = {
      id,
      ...eventData,
      status: "active",
      url: `/events/${id}`,
      images: eventData.images || [],
      subGenre: eventData.subGenre || { id: "", name: "" },
      priceRanges: eventData.priceRanges || [],
      attractions: eventData.attractions || [],
    };

    // In a real application, this is where you would save to a database
    // For this example, we'll just return success with the created event

    return NextResponse.json(
      {
        success: true,
        event: newEvent,
        message: "Event created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      {
        error: "Failed to create event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
