import { fetchEventById, mapTicketmasterEventToAppEvent } from "@/utils/api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch event from Ticketmaster API
    const tmEvent = await fetchEventById(id);

    if (!tmEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Convert to app event format
    const event = mapTicketmasterEventToAppEvent(tmEvent);

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch event";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
