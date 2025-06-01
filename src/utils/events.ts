import { Event } from "@/types";
import axios from "axios";

/**
 * Create a new event
 * @param eventData The event data to create
 * @returns The created event
 */
export const createEvent = async (
  eventData: Partial<Event>
): Promise<Event> => {
  try {
    const response = await axios.post("/api/events/create", eventData);

    if (response.status !== 201) {
      throw new Error(response.data.error || "Failed to create event");
    }

    return response.data.event;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Failed to create event");
    }
    throw error;
  }
};

/**
 * Get available categories for events
 * @returns Array of event categories
 */
export const getEventCategories = async () => {
  try {
    const response = await axios.get("/api/categories");
    return response.data.categories || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};

interface Category {
  segment: {
    id: string;
    name: string;
  };
  genres: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Get genres for a specific category
 * @param categoryId The category ID to get genres for
 * @returns Array of genres for the category
 */
export const getCategoryGenres = async (categoryId: string) => {
  try {
    const categories = (await getEventCategories()) as Category[];
    const category = categories.find((cat) => cat.segment.id === categoryId);

    return category?.genres || [];
  } catch (error) {
    console.error("Failed to fetch genres:", error);
    return [];
  }
};
