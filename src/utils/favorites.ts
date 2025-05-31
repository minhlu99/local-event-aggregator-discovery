import { Event } from "@/types";

const FAVORITES_STORAGE_KEY = "savedEvents";

/**
 * Get all favorite events from localStorage
 */
export const getFavoriteEvents = (): Event[] => {
  try {
    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!savedFavorites) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    // Parse and validate the saved favorites
    let parsedFavorites: unknown;
    try {
      parsedFavorites = JSON.parse(savedFavorites);
    } catch (e) {
      console.error("Error parsing saved favorites:", e);
      return [];
    }

    // Ensure it's an array
    if (!Array.isArray(parsedFavorites)) {
      console.error("Saved favorites is not an array:", parsedFavorites);
      return [];
    }

    // Filter out invalid events and ensure unique IDs
    const validEvents = parsedFavorites
      .filter(
        (event: unknown) =>
          event && typeof event === "object" && event !== null && "id" in event
      )
      .reduce((uniqueEvents: Event[], event: Event) => {
        // Check if we already have an event with this ID
        if (!uniqueEvents.some((e) => e.id === event.id)) {
          uniqueEvents.push(event);
        }
        return uniqueEvents;
      }, []);

    return validEvents;
  } catch (error) {
    console.error("Error loading favorites:", error);
    return [];
  }
};

/**
 * Add an event to favorites
 */
export const addToFavorites = (event: Event): Event[] => {
  try {
    const currentFavorites = getFavoriteEvents();

    // Check if already in favorites
    if (currentFavorites.some((e) => e.id === event.id)) {
      return currentFavorites;
    }

    const updatedFavorites = [...currentFavorites, event];
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(updatedFavorites)
    );
    return updatedFavorites;
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return getFavoriteEvents();
  }
};

/**
 * Remove an event from favorites
 */
export const removeFromFavorites = (eventId: string): Event[] => {
  try {
    const currentFavorites = getFavoriteEvents();
    const updatedFavorites = currentFavorites.filter(
      (event) => event.id !== eventId
    );
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(updatedFavorites)
    );
    return updatedFavorites;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return getFavoriteEvents();
  }
};

/**
 * Toggle favorite status for an event
 */
export const toggleFavorite = (
  event: Event
): {
  favorites: Event[];
  isFavorite: boolean;
} => {
  const currentFavorites = getFavoriteEvents();
  const isCurrentlyFavorite = currentFavorites.some((e) => e.id === event.id);

  if (isCurrentlyFavorite) {
    return {
      favorites: removeFromFavorites(event.id),
      isFavorite: false,
    };
  } else {
    return {
      favorites: addToFavorites(event),
      isFavorite: true,
    };
  }
};

/**
 * Check if an event is in favorites
 */
export const isEventFavorite = (eventId: string): boolean => {
  const favorites = getFavoriteEvents();
  return favorites.some((event) => event.id === eventId);
};
