import { Event, RecommendationParams, User } from "@/types";
import { isEventUpcoming } from "./date";

/**
 * Builds API query parameters for filtered event recommendations
 * @returns An object with query parameters for the API
 */
export const buildRecommendationQueryParams = (
  user: User | null,
  limit = 10
): Record<string, string> => {
  const params: Record<string, string> = {
    size: limit.toString(),
    sort: "relevance,desc", // Sort by date ascending (closest events first)
    includeTBA: "no", // Exclude events with no announced date
    includeTBD: "no", // Exclude events with date to be defined
  };

  // Set date range to only show future events (next 3 months)
  const today = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(today.getMonth() + 3);

  // If we have a user with preferences, add filters
  if (user?.preferences) {
    // Add category filter using classificationId
    if (user.preferences.categories && user.preferences.categories.length > 0) {
      params.classificationId = user.preferences.categories.join(",");
    }

    // Add location filters
    if (user.preferences.locations && user.preferences.locations.length > 0) {
      // Get location data from localStorage if available
      try {
        const locationDetail = localStorage.getItem("userLocationsDetail");
        if (locationDetail) {
          const locations = JSON.parse(locationDetail);

          // If we have coordinates for the first location, use geoPoint filter
          if (locations[0]?.latitude && locations[0]?.longitude) {
            params.geoPoint = `${locations[0].latitude},${locations[0].longitude}`;
            params.radius = "50"; // Default to 50 miles radius
            params.unit = "miles";

            // Store coordinates for reuse
            localStorage.setItem(
              "currentLocationCoords",
              JSON.stringify({
                lat: locations[0].latitude,
                lon: locations[0].longitude,
              })
            );
          } else {
            // Fallback to city filter
            params.city = user.preferences.locations[0];
          }
        } else {
          // Fallback to city filter if no coordinates available
          params.city = user.preferences.locations[0];
        }
      } catch (error) {
        console.error("Error parsing location data:", error);
        // Fallback to city filter
        params.city = user.preferences.locations[0];
      }
    }

    // Get current location coordinates if available and we don't already have coordinates
    try {
      const currentLocationCoords = localStorage.getItem(
        "currentLocationCoords"
      );
      if (currentLocationCoords && !params.geoPoint) {
        const coords = JSON.parse(currentLocationCoords);
        if (coords.lat && coords.lon) {
          params.geoPoint = `${coords.lat},${coords.lon}`;
          params.radius = "50"; // Default to 50 miles radius
          params.unit = "miles";
        }
      }
    } catch (error) {
      console.error("Error parsing current location coordinates:", error);
    }

    // Add price filter (if API supports it)
    if (user.preferences.maxPrice) {
      // Note: The API doesn't directly support price filtering
      // This would require post-filtering on the client side
    }
  }

  return params;
};

/**
 * Convert query params object to URL query string
 */
export const queryParamsToString = (params: Record<string, string>): string => {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
};

/**
 * Makes API call to fetch recommended events with server-side filtering
 * Now uses a tiered approach: full preferences first, then location-only, then categories, then fallback
 * @returns An object containing the events and the strategy used to find them
 */
export const fetchRecommendedEvents = async (
  user: User | null,
  limit = 10
): Promise<{
  events: Event[];
  strategy: "full" | "location" | "category" | "popular";
}> => {
  try {
    // Common parameters to exclude off-sale events
    const commonParams = {
      size: limit.toString(),
      sort: "relevance,desc",
      includeTBA: "no", // Exclude events with no announced date
      includeTBD: "no", // Exclude events with date to be defined
    };

    // Strategy 1: Try with full user preferences (location + categories)
    const queryParams = buildRecommendationQueryParams(user, limit);
    console.log("Trying full preference-based recommendations:", queryParams);
    const queryString = queryParamsToString(queryParams);
    const response = await fetch(`/api/events?${queryString}`);

    if (response.ok) {
      const data = await response.json();
      let events = data.events || [];

      // Filter out off-sale events
      events = events.filter(
        (event: Event) => event.status.toLowerCase() !== "offsale"
      );

      // If we have events, return them
      if (events.length > 0) {
        console.log(`Found ${events.length} preference-based events`);
        return { events, strategy: "full" };
      }
    }

    // Strategy 2: Try location-only if user has location preferences
    if (user?.preferences?.locations && user.preferences.locations.length > 0) {
      // Build location-only query parameters
      const locationParams: Record<string, string> = {
        ...commonParams,
      };

      // Add location from user preferences
      try {
        const locationDetail = localStorage.getItem("userLocationsDetail");
        if (locationDetail) {
          const locations = JSON.parse(locationDetail);
          if (locations[0]?.latitude && locations[0]?.longitude) {
            locationParams.geoPoint = `${locations[0].latitude},${locations[0].longitude}`;
            locationParams.radius = "50";
            locationParams.unit = "miles";
          } else {
            locationParams.city = user.preferences.locations[0];
          }
        } else {
          // Try current location if stored
          const currentLocationCoords = localStorage.getItem(
            "currentLocationCoords"
          );
          if (currentLocationCoords) {
            const coords = JSON.parse(currentLocationCoords);
            if (coords.lat && coords.lon) {
              locationParams.geoPoint = `${coords.lat},${coords.lon}`;
              locationParams.radius = "50";
              locationParams.unit = "miles";
            } else {
              locationParams.city = user.preferences.locations[0];
            }
          } else {
            locationParams.city = user.preferences.locations[0];
          }
        }
      } catch (error) {
        console.error("Error parsing location data:", error);
        locationParams.city = user.preferences.locations[0];
      }

      // Make location-based API call
      console.log("Trying location-only recommendations:", locationParams);
      const locationQueryString = queryParamsToString(locationParams);
      const locationResponse = await fetch(
        `/api/events?${locationQueryString}`
      );

      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        let locationEvents = locationData.events || [];

        // Filter out off-sale events
        locationEvents = locationEvents.filter(
          (event: Event) => event.status.toLowerCase() !== "offsale"
        );

        // If we have enough events, return them
        if (locationEvents.length >= Math.min(5, limit)) {
          console.log(`Found ${locationEvents.length} location-based events`);
          return { events: locationEvents, strategy: "location" };
        }
      }
    }

    // Strategy 3: Fallback to category-only if no results and user has categories
    if (
      user?.preferences?.categories &&
      user.preferences.categories.length > 0
    ) {
      const categoryParams: Record<string, string> = {
        ...commonParams,
        classificationId: user.preferences.categories.join(","),
      };

      console.log("Trying category-only recommendations:", categoryParams);
      const categoryQueryString = queryParamsToString(categoryParams);
      const categoryResponse = await fetch(
        `/api/events?${categoryQueryString}`
      );

      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        let categoryEvents = categoryData.events || [];

        // Filter out off-sale events
        categoryEvents = categoryEvents.filter(
          (event: Event) => event.status.toLowerCase() !== "offsale"
        );

        if (categoryEvents.length > 0) {
          console.log(`Found ${categoryEvents.length} category-based events`);
          return { events: categoryEvents, strategy: "category" };
        }
      }
    }

    // Strategy 4: Final fallback - get popular upcoming events with no filters
    console.log("Falling back to popular upcoming events");
    const fallbackParams = {
      ...commonParams,
      sort: "date,asc", // Get closest upcoming events
    };

    const fallbackQueryString = queryParamsToString(fallbackParams);
    const fallbackResponse = await fetch(`/api/events?${fallbackQueryString}`);

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      let fallbackEvents = fallbackData.events || [];

      // Filter out off-sale events
      fallbackEvents = fallbackEvents.filter(
        (event: Event) => event.status.toLowerCase() !== "offsale"
      );

      return { events: fallbackEvents, strategy: "popular" };
    }

    return { events: [], strategy: "popular" };
  } catch (error) {
    console.error("Error fetching recommended events:", error);
    return { events: [], strategy: "popular" };
  }
};

/**
 * Simple content-based recommendation system
 * Now acts as a wrapper around the API-based filtering
 */
export const getRecommendedEvents = async (
  events: Event[],
  users: User[],
  params: RecommendationParams
): Promise<Event[]> => {
  const { userId, limit = 5, includeUserHistory = false } = params;

  // Find the user
  const user = users.find((u) => u.id === userId);
  if (!user) {
    // If user not found, return popular events from the provided events
    return getPopularEvents(events, limit);
  }

  // In a real implementation, we would directly call the API here
  // For backward compatibility, we'll post-process the provided events

  // Filter to upcoming events only
  const upcomingEvents = events.filter((event) =>
    isEventUpcoming(event.startDate)
  );

  // Filter out events the user has already saved or attended, unless includeUserHistory is true
  const filteredEvents = includeUserHistory
    ? upcomingEvents
    : upcomingEvents.filter(
        (event) =>
          !user.savedEvents.includes(event.id) &&
          !user.attendedEvents.includes(event.id)
      );

  // Score each event based on user preferences
  const scoredEvents = filteredEvents.map((event) => ({
    event,
    score: calculateEventScore(event, user),
  }));

  // Sort by score (descending) and return top N events
  return scoredEvents
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.event);
};

/**
 * Calculate a recommendation score for an event based on user preferences
 */
const calculateEventScore = (event: Event, user: User): number => {
  let score = 0;

  // Category match (highest weight)
  if (user.preferences.categories.includes(event.category.id)) {
    score += 10; // Increased weight for category matches
  }

  // Genre match if available
  if (event.genre && user.preferences.categories.includes(event.genre.id)) {
    score += 5;
  }

  // Location match
  const locationMatch = user.preferences.locations.some(
    (loc) =>
      event.venue.address.toLowerCase().includes(loc.toLowerCase()) ||
      event.venue.city.toLowerCase().includes(loc.toLowerCase())
  );
  if (locationMatch) {
    score += 3;
  }

  // Price preference
  if (event.priceRanges && event.priceRanges.length > 0) {
    const minPrice = event.priceRanges[0].min;
    if (minPrice <= user.preferences.maxPrice) {
      score += 2;
    }
  } else {
    // No price info - assume free
    score += 2;
  }

  // Special status boost
  if (event.status === "onsale") {
    score += 1;
  }

  return score;
};

/**
 * Fallback recommendation: popular events
 */
export const getPopularEvents = (events: Event[], limit = 5): Event[] => {
  // Just return the most recent events since we don't have attendee count
  return events
    .filter((event) => isEventUpcoming(event.startDate))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, limit);
};
