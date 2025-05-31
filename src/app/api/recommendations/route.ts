import { fetchEvents, mapTicketmasterEventToAppEvent } from "@/utils/api";
import { getPopularEvents } from "@/utils/recommendations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Fetch all events
    const eventsResponse = await fetchEvents({});

    if (!eventsResponse || !eventsResponse.events) {
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // Convert Ticketmaster events to app events
    const appEvents = eventsResponse.events.map(mapTicketmasterEventToAppEvent);

    // For a real application, this would fetch from a database
    // For now, we'll use localStorage on the client side instead
    // This is just a placeholder for the API route structure
    if (!userId) {
      // Return popular events if no user ID is provided
      const recommendations = getPopularEvents(appEvents, limit);
      return NextResponse.json({ recommendations });
    }

    // In a real application with a database:
    // const user = await db.users.findUnique({ where: { id: userId } });
    // const recommendations = getRecommendedEvents(appEvents, [user], { userId, limit, includeUserHistory: includeHistory });

    // For now, just return popular events as a fallback
    const recommendations = getPopularEvents(appEvents, limit);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error in recommendations API:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
