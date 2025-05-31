import { fetchEvents, mapTicketmasterEventToAppEvent } from "@/utils/api";
import { isEventUpcoming } from "@/utils/date";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    console.log(
      "API route called with searchParams:",
      Object.fromEntries(searchParams.entries())
    );

    // Extract filter parameters
    const keyword =
      searchParams.get("search") || searchParams.get("keyword") || undefined;
    const category = searchParams.get("category") || undefined;
    const date = searchParams.get("date");
    const location = searchParams.get("location") || undefined;
    const price =
      (searchParams.get("price") as "free" | "paid" | "all") || "all";
    const includePast = searchParams.get("includePast") === "true"; // Default is false
    const sort = "relevance,desc"; // Default sort
    const size = parseInt(searchParams.get("size") || "50", 10); // Default size
    const page = parseInt(searchParams.get("page") || "0", 10); // Default page
    const radius = searchParams.get("radius") || undefined;
    const unit = (searchParams.get("unit") as "miles" | "km") || undefined;
    const venueId = searchParams.get("venueId") || undefined;
    const attractionId = searchParams.get("attractionId") || undefined;
    const genreId = searchParams.get("genreId") || undefined;
    const segmentId = searchParams.get("segmentId") || undefined;
    const countryCode = searchParams.get("countryCode") || undefined;
    const stateCode = searchParams.get("stateCode") || undefined;
    const city = searchParams.get("city") || location; // Use location as city if provided
    const postalCode = searchParams.get("postalCode") || undefined;
    const includeTBA =
      (searchParams.get("includeTBA") as "yes" | "no" | "only") || undefined;
    const includeTBD =
      (searchParams.get("includeTBD") as "yes" | "no" | "only") || undefined;
    const includeFamily =
      (searchParams.get("includeFamily") as "yes" | "no" | "only") || undefined;

    // Additional parameters we now support
    const classificationId = searchParams.get("classificationId") || undefined;
    const classificationName =
      searchParams.get("classificationName") || category; // Use category as classificationName if provided
    const geoPoint = searchParams.get("geoPoint") || undefined;
    const locale = searchParams.get("locale") || undefined;
    const latlong = searchParams.get("latlong") || undefined;
    const startDateTime = searchParams.get("startDateTime") || undefined;
    const endDateTime = searchParams.get("endDateTime") || undefined;

    // Format date to Ticketmaster's required format: YYYY-MM-DDTHH:mm:ssZ
    const formatDateForAPI = (date: Date): string => {
      // Manually format the date to match exactly what Ticketmaster expects
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
      const seconds = String(date.getUTCSeconds()).padStart(2, "0");

      // Format: YYYY-MM-DDTHH:mm:ssZ - exactly as required by Ticketmaster
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    };

    // Prepare start/end datetime params based on date filter if not explicitly provided
    let computedStartDateTime: string | undefined = startDateTime;
    let computedEndDateTime: string | undefined = endDateTime;

    const now = new Date();

    // Log the formatted dates for debugging
    console.log("Date debugging:", {
      now: formatDateForAPI(now),
      rawNow: now.toISOString(),
      providedStartDateTime: startDateTime,
      providedEndDateTime: endDateTime,
    });

    // If start/end dates are not explicitly provided, compute them from date filter
    if (!startDateTime && !endDateTime) {
      // If not explicitly including past events, always set the start date to now
      // unless a specific date filter is selected
      if (!includePast && !date) {
        computedStartDateTime = formatDateForAPI(now);
      }

      if (date) {
        if (date === "today") {
          // Set to today's date with time range for the full day
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(now);
          todayEnd.setHours(23, 59, 59, 999);

          computedStartDateTime = formatDateForAPI(todayStart);
          computedEndDateTime = formatDateForAPI(todayEnd);
        } else if (date === "this-week") {
          // Set start to today, end to 7 days from now
          computedStartDateTime = formatDateForAPI(now);
          const endDate = new Date(now);
          endDate.setDate(now.getDate() + 7);
          computedEndDateTime = formatDateForAPI(endDate);
        } else if (date === "this-month") {
          // Use the same approach as this-week but with 30 days
          computedStartDateTime = formatDateForAPI(now);
          const endDate = new Date(now);
          endDate.setDate(now.getDate() + 30); // Set to 30 days from now

          // Log the calculated dates for debugging
          console.log("This-month date range (30 days from now):", {
            start: now.toISOString(),
            formattedStart: formatDateForAPI(now),
            end: endDate.toISOString(),
            formattedEnd: formatDateForAPI(endDate),
          });

          computedEndDateTime = formatDateForAPI(endDate);
        } else if (date === "upcoming") {
          // Just set start to now for all future events
          computedStartDateTime = formatDateForAPI(now);
        } else if (date === "all" && includePast) {
          // If "all" dates are requested and includePast is true, don't set startDateTime
          computedStartDateTime = undefined;
        }
      }
    }

    // Validate date format before sending to API
    const validateDateFormat = (dateStr?: string): string | undefined => {
      if (!dateStr) return undefined;

      // Check if the date already matches the required format YYYY-MM-DDTHH:mm:ssZ
      const validFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(
        dateStr
      );

      if (!validFormat) {
        console.warn(
          `Invalid date format detected: ${dateStr}, attempting to fix`
        );
        try {
          // Try to parse and reformat the date
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return formatDateForAPI(date);
          } else {
            console.error(`Could not parse date: ${dateStr}`);
            return undefined;
          }
        } catch (err) {
          console.error(`Error formatting date: ${dateStr}`, err);
          return undefined;
        }
      }

      return dateStr;
    };

    // Prepare API parameters with validated dates
    const apiParams = {
      keyword,
      // Handle both classification name and ID
      ...(classificationName && { classificationName }),
      ...(classificationId && { classificationId }),
      startDateTime: validateDateFormat(computedStartDateTime),
      endDateTime: validateDateFormat(computedEndDateTime),
      size,
      sort,
      // Include location parameters based on what's provided
      ...(city && { city }),
      ...(stateCode && { stateCode }),
      ...(countryCode && { countryCode }),
      ...(postalCode && { postalCode }),
      ...(radius && { radius }),
      ...(unit && { unit }),
      // Support for geolocation
      ...(geoPoint && { geoPoint }),
      ...(latlong && { latlong }),
      // Include additional filters if provided
      ...(venueId && { venueId }),
      ...(attractionId && { attractionId }),
      ...(genreId && { genreId }),
      ...(segmentId && { segmentId }),
      ...(includeTBA && { includeTBA }),
      ...(includeTBD && { includeTBD }),
      ...(includeFamily && { includeFamily }),
      ...(locale && { locale }),
      page,
    };

    console.log("Calling Ticketmaster API with params:", apiParams);

    // Add detailed date range logging
    if (apiParams.startDateTime || apiParams.endDateTime) {
      console.log("Date range being sent to API:", {
        startDateTime: apiParams.startDateTime,
        endDateTime: apiParams.endDateTime,
        dateFilter: date,
      });
    }

    try {
      // Call Ticketmaster API
      const result = await fetchEvents(apiParams);

      if (!result || !result.events) {
        return NextResponse.json(
          {
            error: "No events returned from Ticketmaster API",
            events: [],
            count: 0,
            total: 0,
            page: { number: page, size, totalPages: 0, totalElements: 0 },
          },
          { status: 404 }
        );
      }

      // Log API response for debugging
      console.log(
        `Fetched ${result.events?.length || 0} events from Ticketmaster API`
      );

      // Sample the first event to check price ranges
      if (result.events && result.events.length > 0) {
        const sampleEvent = result.events[0];
        console.log(`Sample event: ${sampleEvent.name} (${sampleEvent.id})`);
        console.log(
          `Has price ranges: ${sampleEvent.priceRanges ? "Yes" : "No"}`
        );
        if (sampleEvent.priceRanges) {
          console.log(`Price ranges count: ${sampleEvent.priceRanges.length}`);
          console.log(
            `Price ranges data:`,
            JSON.stringify(sampleEvent.priceRanges)
          );
        }
      }

      // Map Ticketmaster events to our app format
      let events = result.events.map(mapTicketmasterEventToAppEvent);

      console.log(`Received ${events.length} events from Ticketmaster API`);

      // Filter out invalid dates and ensure future events if not includePast
      events = events.filter((event) => {
        // Must have a valid start date
        if (!event.startDate) return false;

        // Skip events with invalid dates
        const eventDate = new Date(event.startDate);
        if (isNaN(eventDate.getTime())) return false;

        // Unless includePast is true, only show upcoming events or today's events
        if (!includePast && !isEventUpcoming(event.startDate)) {
          return false;
        }

        return true;
      });

      console.log(`After filtering, ${events.length} events remain`);

      // Debug price data in our transformed events
      if (events.length > 0) {
        const sampleTransformedEvent = events[0];
        console.log(`Sample transformed event: ${sampleTransformedEvent.name}`);
        const hasPriceRanges =
          (sampleTransformedEvent.priceRanges ?? []).length > 0;
        console.log(`Has price ranges: ${hasPriceRanges ? "Yes" : "No"}`);

        if (hasPriceRanges) {
          console.log(
            `Transformed price data:`,
            JSON.stringify(sampleTransformedEvent.priceRanges)
          );
        }
      }

      // Apply price filter (since Ticketmaster API doesn't support this directly)
      if (price && price !== "all") {
        events = events.filter((event) => {
          // If no price ranges, assume it's free if price filter is "free"
          if (!event.priceRanges || event.priceRanges.length === 0) {
            return price === "free";
          }

          // If there are price ranges and filter is "free", only show events with 0 min price
          if (price === "free") {
            return event.priceRanges.some((range) => range.min === 0);
          }

          // If filter is "paid", show events with price > 0
          if (price === "paid") {
            return event.priceRanges.some((range) => range.min > 0);
          }

          return true;
        });
      }

      return NextResponse.json({
        events,
        count: events.length,
        total: result.page?.totalElements || events.length,
        page: result.page,
      });
    } catch (error) {
      console.error("Error calling Ticketmaster API:", error);

      // Provide detailed error information
      let errorMessage = "Error calling Ticketmaster API";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Special handling for date format errors
        if (
          errorMessage.includes("date") &&
          (errorMessage.toLowerCase().includes("format") ||
            errorMessage.toLowerCase().includes("invalid"))
        ) {
          console.error("Date format error detected:", {
            startDateTime,
            endDateTime,
            errorDetails: errorMessage,
          });

          errorMessage =
            "Query param with date must be of valid format YYYY-MM-DDTHH:mm:ssZ {example: 2020-08-01T14:00:00Z }";

          // Try to return helpful response with fallback content
          return NextResponse.json(
            {
              error: errorMessage,
              source: "ticketmaster_api_date_format",
              events: [],
              count: 0,
              total: 0,
              page: { number: page, size, totalPages: 0, totalElements: 0 },
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          source: "ticketmaster_api",
          params: apiParams,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in API route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json(
      {
        error: errorMessage,
        source: "api_route",
      },
      { status: 500 }
    );
  }
}
