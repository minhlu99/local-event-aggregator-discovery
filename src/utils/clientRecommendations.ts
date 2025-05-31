import { Event, UserPreferences } from "@/types";
import { isEventUpcoming } from "./date";

// Define a mapping of category IDs to their names
const categoryMap: Record<string, string> = {
  KZFzniwnSyZfZ7v7nJ: "Music",
  KZFzniwnSyZfZ7v7nE: "Sports",
  KZFzniwnSyZfZ7v7na: "Arts & Theatre",
  KZFzniwnSyZfZ7v7nn: "Film",
  KZFzniwnSyZfZ7v7n1: "Miscellaneous",
};

/**
 * Get the readable name for a category ID
 */
export const getCategoryName = (categoryId: string): string => {
  return categoryMap[categoryId] || categoryId;
};

/**
 * Check if an event's category or genre matches user preferences
 */
export const eventMatchesUserPreferences = (
  event: Event,
  userPreferences: UserPreferences | null
): boolean => {
  if (
    !userPreferences ||
    !userPreferences.categories ||
    userPreferences.categories.length === 0
  ) {
    return false;
  }

  // Check primary category match
  if (userPreferences.categories.includes(event.category.id)) {
    return true;
  }

  // Check genre match
  if (event.genre && userPreferences.categories.includes(event.genre.id)) {
    return true;
  }

  // Check subgenre match
  if (
    event.subGenre &&
    userPreferences.categories.includes(event.subGenre.id)
  ) {
    return true;
  }

  // For music category, match with all music-related genres if user selected music
  if (
    event.category.id === "KZFzniwnSyZfZ7v7nJ" &&
    userPreferences.categories.includes("KZFzniwnSyZfZ7v7nJ")
  ) {
    return true;
  }

  // For arts & theatre category, match with all arts-related genres if user selected arts
  if (
    event.category.id === "KZFzniwnSyZfZ7v7na" &&
    userPreferences.categories.includes("KZFzniwnSyZfZ7v7na")
  ) {
    return true;
  }

  // For film category, match with all film-related genres if user selected film
  if (
    event.category.id === "KZFzniwnSyZfZ7v7nn" &&
    userPreferences.categories.includes("KZFzniwnSyZfZ7v7nn")
  ) {
    return true;
  }

  return false;
};

/**
 * Client-side recommendation system
 * Recommends events based on user preferences from localStorage
 */
export const getClientRecommendations = (
  events: Event[],
  limit = 10,
  includeUserHistory = false
): Event[] => {
  // Get user preferences from localStorage
  let userPreferences: UserPreferences | null = null;
  try {
    const prefsData = localStorage.getItem("userPreferences");
    if (prefsData) {
      userPreferences = JSON.parse(prefsData);
    }
  } catch (error) {
    console.error("Error parsing user preferences:", error);
  }

  // Get saved events from localStorage
  let savedEvents: string[] = [];
  try {
    const savedData = localStorage.getItem("savedEvents");
    if (savedData) {
      savedEvents = JSON.parse(savedData);
    }
  } catch (error) {
    console.error("Error parsing saved events:", error);
  }

  // Filter to upcoming events only
  const upcomingEvents = events.filter((event) =>
    isEventUpcoming(event.startDate)
  );

  // Filter out events the user has already saved, unless includeUserHistory is true
  const filteredEvents = includeUserHistory
    ? upcomingEvents
    : upcomingEvents.filter((event) => !savedEvents.includes(event.id));

  // If we have user preferences, use them for scoring
  if (
    userPreferences &&
    userPreferences.categories &&
    userPreferences.categories.length > 0
  ) {
    // Get user preferred categories for debugging
    const preferredCategoryIds = userPreferences.categories;

    console.log(
      "User preferred categories:",
      preferredCategoryIds.map((id) => getCategoryName(id))
    );

    // Log all available categories in the events
    const availableCategories = new Set(
      filteredEvents.map((e) => e.category.id)
    );
    console.log(
      "Available event categories:",
      [...availableCategories].map((id) => `${id} (${getCategoryName(id)})`)
    );

    // Score each event based on user preferences
    const scoredEvents = filteredEvents.map((event) => {
      const score = calculateEventScore(event, userPreferences!);
      return { event, score };
    });

    // Log the highest scored events for debugging
    const topEvents = [...scoredEvents]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    console.log(
      "Top scored events:",
      topEvents.map((e) => ({
        name: e.event.name,
        category: e.event.category.name,
        categoryId: e.event.category.id,
        score: e.score,
      }))
    );

    // First ensure we have events that match the user's preferred categories
    const matchingCategoryEvents = scoredEvents.filter((item) =>
      eventMatchesUserPreferences(item.event, userPreferences)
    );

    // If we have enough matching events, return those
    if (matchingCategoryEvents.length >= limit) {
      return matchingCategoryEvents
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.event);
    }

    // If we don't have enough matching events, fill with other high-scoring events
    const matchingEventIds = new Set(
      matchingCategoryEvents.map((e) => e.event.id)
    );
    const otherEvents = scoredEvents.filter(
      (item) => !matchingEventIds.has(item.event.id)
    );

    // Combine the matching events with other high-scoring events
    return [
      ...matchingCategoryEvents.sort((a, b) => b.score - a.score),
      ...otherEvents.sort((a, b) => b.score - a.score),
    ]
      .slice(0, limit)
      .map((item) => item.event);
  }

  // Fallback: return events sorted by start date (nearest first)
  return filteredEvents
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, limit);
};

/**
 * Calculate a recommendation score for an event based on user preferences
 */
const calculateEventScore = (
  event: Event,
  preferences: UserPreferences
): number => {
  let score = 0;

  // Use the matching function to determine matches
  if (eventMatchesUserPreferences(event, preferences)) {
    score += 10; // High score for matching category
  }

  // Location match
  const locationMatch = preferences.locations.some(
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
    if (minPrice <= preferences.maxPrice) {
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
