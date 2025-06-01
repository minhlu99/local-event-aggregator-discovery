// Utility functions for calendar integration

/**
 * Generate a Google Calendar event URL with event details
 * Google Calendar URL API format documentation:
 * https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
 */
export const createGoogleCalendarUrl = (event: {
  name: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  timezone?: string;
}) => {
  // Create base URL
  const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";

  // Format event title
  const text = encodeURIComponent(event.name);

  // Format description - limit length and add URL if available
  let details = event.description || "";
  if (details.length > 1000) {
    details = details.substring(0, 997) + "...";
  }
  const description = encodeURIComponent(details);

  // Format date and time
  let startDateTime = "";
  let endDateTime = "";

  // If we have a valid start date
  if (event.startDate) {
    // Format: YYYYMMDDTHHMMSSZ
    const startDate = new Date(event.startDate);

    // If we have start time, add it
    if (event.startTime && /^\d{2}:\d{2}:\d{2}$/.test(event.startTime)) {
      const [hours, minutes, seconds] = event.startTime.split(":").map(Number);
      startDate.setHours(hours, minutes, seconds);
    }

    // Format start date for Google Calendar
    startDateTime = formatDateForCalendar(startDate);

    // If we have end date and time, use them
    if (event.endDate) {
      const endDate = new Date(event.endDate);

      if (event.endTime && /^\d{2}:\d{2}:\d{2}$/.test(event.endTime)) {
        const [hours, minutes, seconds] = event.endTime.split(":").map(Number);
        endDate.setHours(hours, minutes, seconds);
      } else if (event.startTime) {
        // If no end time but we have start time, set end time to start time + 1 hour
        const [hours, minutes, seconds] = event.startTime
          .split(":")
          .map(Number);
        endDate.setHours(hours + 1, minutes, seconds);
      }

      endDateTime = formatDateForCalendar(endDate);
    } else {
      // No end date, default to start date + 1 hour
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
      endDateTime = formatDateForCalendar(endDate);
    }
  }

  // Format location
  const location = event.location ? encodeURIComponent(event.location) : "";

  // Build full URL with all available parameters
  let calendarUrl = `${baseUrl}&text=${text}`;

  if (startDateTime) {
    calendarUrl += `&dates=${startDateTime}/${endDateTime}`;
  }

  if (description) {
    calendarUrl += `&details=${description}`;
  }

  if (location) {
    calendarUrl += `&location=${location}`;
  }

  // Add timezone if available
  if (event.timezone) {
    calendarUrl += `&ctz=${encodeURIComponent(event.timezone)}`;
  }

  return calendarUrl;
};

/**
 * Format a date object for Google Calendar URL
 * Format: YYYYMMDDTHHMMSSZ
 */
const formatDateForCalendar = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

/**
 * Get formatted event location from venue object
 */
export const getFormattedEventLocation = (venue?: {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
}): string => {
  if (!venue) return "";

  const parts = [
    venue.name,
    venue.address,
    venue.city && venue.state
      ? `${venue.city}, ${venue.state}`
      : venue.city || venue.state,
  ].filter(Boolean);

  return parts.join(", ");
};
