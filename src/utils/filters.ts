import { Event, EventFilters } from "@/types";
import { isEventUpcoming } from "./date";

export const filterEvents = (
  events: Event[],
  filters: EventFilters
): Event[] => {
  return events.filter((event) => {
    // Filter by search term
    if (filters.search && !matchesSearchTerm(event, filters.search)) {
      return false;
    }

    // Filter by category
    if (
      filters.category &&
      event.category.name.toLowerCase() !== filters.category.toLowerCase()
    ) {
      return false;
    }

    // Filter by date (today, this-week, this-month, all)
    if (filters.date && filters.date !== "") {
      if (!matchesDateFilter(event, filters.date)) {
        return false;
      }
    }

    // Filter by location
    if (filters.location && filters.location.trim() !== "") {
      const locationMatches =
        event.venue.address
          .toLowerCase()
          .includes(filters.location.toLowerCase()) ||
        event.venue.name
          .toLowerCase()
          .includes(filters.location.toLowerCase()) ||
        event.venue.city.toLowerCase().includes(filters.location.toLowerCase());

      if (!locationMatches) {
        return false;
      }
    }

    // Filter by price
    if (filters.price && filters.price !== "all") {
      if (filters.price === "free") {
        // Free events have no price ranges or min price is 0
        if (!event.priceRanges || event.priceRanges.length === 0) {
          return true; // Assume free if no price info
        }
        return event.priceRanges.some((range) => range.min === 0);
      }

      if (filters.price === "paid") {
        // Paid events have price ranges with min price > 0
        if (!event.priceRanges || event.priceRanges.length === 0) {
          return false; // No price info means not explicitly paid
        }
        return event.priceRanges.some((range) => range.min > 0);
      }
    }

    return true;
  });
};

export const matchesSearchTerm = (
  event: Event,
  searchTerm: string
): boolean => {
  const search = searchTerm.toLowerCase();
  return (
    event.name.toLowerCase().includes(search) ||
    event.description.toLowerCase().includes(search) ||
    event.venue.name.toLowerCase().includes(search) ||
    event.venue.address.toLowerCase().includes(search) ||
    event.category.name.toLowerCase().includes(search) ||
    event.genre.name.toLowerCase().includes(search) ||
    event.subGenre.name.toLowerCase().includes(search)
  );
};

export const matchesDateFilter = (
  event: Event,
  dateFilter: string
): boolean => {
  if (dateFilter === "") return true;

  const eventDate = new Date(event.startDate);
  const today = new Date();

  // Reset hours to start of day for consistent comparison
  today.setHours(0, 0, 0, 0);

  // Create date for comparison - we do this calculation on both server and client
  // so it needs to be deterministic
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  switch (dateFilter) {
    case "today":
      return eventDate >= today && eventDate < tomorrow;
    case "this-week":
      return eventDate >= today && eventDate < nextWeek;
    case "this-month":
      return eventDate >= today && eventDate < nextMonth;
    case "upcoming":
      return isEventUpcoming(event.startDate);
    case "all":
    default:
      return true;
  }
};

// Helper to check if a date is in the future
export const isDateUpcoming = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date >= now;
};
