import { Event } from "@/types";
import axios, { AxiosError } from "axios";

// Define interfaces for Ticketmaster API responses
interface TicketmasterEvent {
  id: string;
  name: string;
  type?: string;
  url?: string;
  locale?: string;
  description?: string;
  info?: string;
  pleaseNote?: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
      dateTBD?: boolean;
      dateTBA?: boolean;
      timeTBA?: boolean;
      noSpecificTime?: boolean;
    };
    end?: {
      localDate?: string;
      localTime?: string;
    };
    timezone?: string;
    status?: {
      code?: string;
    };
    spanMultipleDays?: boolean;
  };
  sales?: {
    public?: {
      startDateTime?: string;
      endDateTime?: string;
      startTBD?: boolean;
      startTBA?: boolean;
    };
    presales?: Array<{
      startDateTime?: string;
      endDateTime?: string;
      name?: string;
    }>;
  };
  _embedded?: {
    venues?: Array<{
      id?: string;
      name?: string;
      type?: string;
      url?: string;
      locale?: string;
      postalCode?: string;
      timezone?: string;
      city?: {
        name?: string;
      };
      state?: {
        name?: string;
        stateCode?: string;
      };
      country?: {
        name?: string;
        countryCode?: string;
      };
      address?: {
        line1?: string;
      };
      location?: {
        latitude?: string;
        longitude?: string;
      };
      markets?: Array<{
        name?: string;
        id?: string;
      }>;
      images?: TicketmasterImage[];
    }>;
    attractions?: Array<{
      name?: string;
      type?: string;
      id?: string;
      url?: string;
      locale?: string;
      images?: TicketmasterImage[];
      classifications?: Array<{
        primary?: boolean;
        segment?: {
          id?: string;
          name?: string;
        };
        genre?: {
          id?: string;
          name?: string;
        };
        subGenre?: {
          id?: string;
          name?: string;
        };
        type?: {
          id?: string;
          name?: string;
        };
        subType?: {
          id?: string;
          name?: string;
        };
      }>;
      externalLinks?: {
        [key: string]: Array<{ url: string }>;
      };
    }>;
  };
  classifications?: Array<{
    primary?: boolean;
    segment?: {
      id?: string;
      name?: string;
    };
    genre?: {
      id?: string;
      name?: string;
    };
    subGenre?: {
      id?: string;
      name?: string;
    };
    type?: {
      id?: string;
      name?: string;
    };
    subType?: {
      id?: string;
      name?: string;
    };
    family?: boolean;
  }>;
  promoter?: {
    id?: string;
    name?: string;
    description?: string;
  };
  promoters?: Array<{
    id?: string;
    name?: string;
    description?: string;
  }>;
  priceRanges?: TicketmasterPriceRange[];
  seatmap?: {
    staticUrl?: string;
  };
  accessibility?: {
    info?: string;
    ticketLimit?: number;
  };
  ticketLimit?: {
    info?: string;
  };
  ageRestrictions?: {
    legalAgeEnforced?: boolean;
  };
  ticketing?: {
    safeTix?: {
      enabled?: boolean;
    };
    allInclusivePricing?: {
      enabled?: boolean;
    };
  };
  _links?: {
    self: {
      href: string;
    };
    attractions?: Array<{
      href: string;
    }>;
    venues?: Array<{
      href: string;
    }>;
  };
}

interface TicketmasterPriceRange {
  type?: string;
  currency?: string;
  min: number;
  max: number;
}

interface TicketmasterImage {
  url: string;
  width: number;
  height: number;
  ratio?: string;
  fallback?: boolean;
  attribution?: string;
}

// Ticketmaster Classification interfaces
interface TicketmasterLink {
  href: string;
}

interface TicketmasterLinks {
  self: {
    href: string;
  };
  [key: string]: TicketmasterLink | TicketmasterLink[];
}

interface TicketmasterGenre {
  id: string;
  name: string;
  locale?: string;
  _links?: TicketmasterLinks;
  _embedded?: {
    subgenres?: TicketmasterSubgenre[];
  };
}

interface TicketmasterSubgenre {
  id: string;
  name: string;
  locale?: string;
  _links?: TicketmasterLinks;
}

interface TicketmasterSegment {
  id: string;
  name: string;
  locale?: string;
  primaryId?: string;
  _links?: TicketmasterLinks;
  _embedded?: {
    genres?: TicketmasterGenre[];
  };
}

interface TicketmasterClassification {
  family: boolean;
  _links?: TicketmasterLinks;
  segment: TicketmasterSegment;
}

// Ticketmaster API configuration
const TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2";
const TICKETMASTER_API_KEY =
  process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY || "demo-key"; // Use environment variable

// Error handling wrapper for API calls
const handleApiError = (error: AxiosError): never => {
  console.error("API Error:", error);

  // Get a more detailed error message
  let errorMessage = "An error occurred while fetching data";

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (error.response.status === 401) {
      errorMessage = "Unauthorized: Invalid API key";
    } else if (error.response.status === 429) {
      errorMessage = "Rate limit exceeded. Please try again later.";
    } else if (error.response.data) {
      // Try to extract detailed error message from response
      try {
        if (
          typeof error.response.data === "object" &&
          error.response.data !== null
        ) {
          // Type guard for the fault object
          if (
            "fault" in error.response.data &&
            typeof error.response.data.fault === "object" &&
            error.response.data.fault !== null &&
            "faultstring" in error.response.data.fault
          ) {
            // Ticketmaster API often returns errors in a 'fault' object
            errorMessage =
              String(error.response.data.fault.faultstring) || errorMessage;
          } else if (
            "errors" in error.response.data &&
            Array.isArray(error.response.data.errors) &&
            error.response.data.errors.length > 0
          ) {
            // Sometimes errors are in an array
            const firstError = error.response.data.errors[0];
            if (
              typeof firstError === "object" &&
              firstError !== null &&
              "detail" in firstError
            ) {
              errorMessage = String(firstError.detail) || errorMessage;
            }
          } else if ("message" in error.response.data) {
            // Simple message property
            errorMessage = String(error.response.data.message);
          } else if ("error" in error.response.data) {
            // Simple error property
            errorMessage = String(error.response.data.error);
          }
        } else if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        }
      } catch (parseError) {
        console.error("Error parsing API error response:", parseError);
      }

      errorMessage += ` (Status: ${error.response.status})`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage =
      "No response received from API. Please check your network connection.";
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message || errorMessage;
  }

  throw new Error(errorMessage);
};

/**
 * Parameters for Ticketmaster API events endpoint
 * @see https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#search-events-v2
 */
interface TicketmasterEventParams {
  keyword?: string; // Keyword to search on
  attractionId?: string; // Filter by attraction id
  venueId?: string; // Filter by venue id
  postalCode?: string; // Filter by postal code / zipcode
  city?: string; // Filter by city
  stateCode?: string; // Filter by state code
  countryCode?: string; // Filter by country code
  classificationName?: string; // Filter by classification name (segment, genre, etc.)
  classificationId?: string; // Filter by classification id
  latlong?: string; // Filter by latitude and longitude
  radius?: string; // Radius of the area to search for events
  unit?: "miles" | "km"; // Unit of the radius
  startDateTime?: string; // Filter with a start date after this date
  endDateTime?: string; // Filter with a start date before this date
  localStartDateTime?: string; // Filter with event local start date time
  includeTBA?: "yes" | "no" | "only"; // Include events with date to be announced
  includeTBD?: "yes" | "no" | "only"; // Include events with date to be defined
  includeTest?: "yes" | "no" | "only"; // Include test events
  size?: number; // Page size (default: 20)
  page?: number; // Page number (default: 0)
  sort?: string; // Sorting order (e.g., 'relevance,desc', 'relevance,desc')
  onsaleStartDateTime?: string; // Filter by onsale start date
  onsaleEndDateTime?: string; // Filter by onsale end date
  segmentId?: string; // Filter by segment id
  segmentName?: string; // Filter by segment name
  genreId?: string; // Filter by genre id
  subGenreId?: string; // Filter by subGenre id
  promoterId?: string; // Filter by promoter id
  dmaId?: string; // Filter by designated market area
  includeFamily?: "yes" | "no" | "only"; // Filter by family-friendly events
  includeSpellcheck?: "yes" | "no"; // Include spell check suggestions
  geoPoint?: string; // Filter events by geoHash
  preferredCountry?: "us" | "ca"; // Popularity boost by country
  locale?: string; // The locale in ISO code format
  marketId?: string; // Filter by market id
}

/**
 * Fetch events from Ticketmaster API with optional filters
 * @param params - Filter parameters for the Ticketmaster API
 * @returns Object containing events and pagination info
 */
export const fetchEvents = async (params: TicketmasterEventParams) => {
  try {
    // Clean up parameters to ensure we don't send undefined values
    const cleanParams: Record<string, string | number | boolean> = {};
    for (const key in params) {
      const value = params[key as keyof typeof params];
      if (value !== undefined) {
        // Extra validation for date parameters
        if (
          (key === "startDateTime" || key === "endDateTime") &&
          typeof value === "string"
        ) {
          // Validate date format: YYYY-MM-DDTHH:mm:ssZ
          const isValidFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(
            value
          );
          if (!isValidFormat) {
            console.error(`Invalid date format for ${key}: ${value}`);
            throw new Error(
              `Query param with date must be of valid format YYYY-MM-DDTHH:mm:ssZ {example: 2020-08-01T14:00:00Z }`
            );
          }
        }
        cleanParams[key] = value;
      }
    }

    const response = await axios.get(`${TICKETMASTER_BASE_URL}/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        ...cleanParams,
      },
    });

    // Check if we got a valid response structure
    if (!response.data) {
      console.error("Invalid API response: Empty data");
      throw new Error("Invalid API response: Empty data");
    }

    // Handle empty results
    if (!response.data._embedded) {
      return {
        events: [],
        page: response.data.page || {
          totalElements: 0,
          totalPages: 0,
          size: 0,
          number: 0,
        },
      };
    }

    return {
      events: response.data._embedded.events as TicketmasterEvent[],
      page: response.data.page,
    };
  } catch (error) {
    console.error("Error in fetchEvents:", error);
    return handleApiError(error as AxiosError);
  }
};

/**
 * Fetch a single event by ID
 */
export const fetchEventById = async (eventId: string) => {
  try {
    const response = await axios.get(
      `${TICKETMASTER_BASE_URL}/events/${eventId}`,
      {
        params: {
          apikey: TICKETMASTER_API_KEY,
        },
      }
    );

    return response.data as TicketmasterEvent;
  } catch (error) {
    return handleApiError(error as AxiosError);
  }
};

/**
 * Fetch event categories/classifications
 */
export const fetchCategories = async () => {
  try {
    const response = await axios.get(
      `${TICKETMASTER_BASE_URL}/classifications`,
      {
        params: {
          apikey: TICKETMASTER_API_KEY,
        },
      }
    );

    // Handle empty results
    if (!response.data._embedded) {
      return [];
    }

    // Extract categories from the response and map them to our format
    const classifications =
      (response.data._embedded
        .classifications as TicketmasterClassification[]) || [];

    // Map the classifications to a simpler format
    return classifications
      .map((classification: TicketmasterClassification) => {
        if (classification.segment) {
          return {
            segment: {
              id: classification.segment.id,
              name: classification.segment.name,
            },
            // Include genres if needed in the future
            genres:
              classification.segment._embedded?.genres?.map(
                (genre: TicketmasterGenre) => ({
                  id: genre.id,
                  name: genre.name,
                })
              ) || [],
          };
        }
        return null;
      })
      .filter(Boolean); // Remove any null values
  } catch (error) {
    return handleApiError(error as AxiosError);
  }
};

/**
 * Map Ticketmaster event data to our application's Event type
 */
export const mapTicketmasterEventToAppEvent = (
  tmEvent: TicketmasterEvent
): Event => {
  // Find best available image - prefer larger ratios like 16_9 with higher width
  const bestImage = tmEvent.images?.reduce((best, current) => {
    // Prefer 16_9 ratio images with higher width for better display quality
    if (current.ratio === "16_9" && (!best || current.width > best.width)) {
      return current;
    }
    // If no 16_9 ratio images or current image has higher width
    if (!best || (current.width > best.width && !current.fallback)) {
      return current;
    }
    return best;
  }, undefined as TicketmasterImage | undefined);

  // Safely parse dates with validation
  const validateDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    // Validate that the date string is in a valid format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "";

    // Make sure it's a valid date (not something like 2023-13-45)
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return dateStr;
  };

  // Safely parse times with validation
  const validateTime = (timeStr?: string): string => {
    if (!timeStr) return "";
    // Validate time format (HH:MM:SS)
    if (!/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return "";

    // Create a dummy date with the time to verify it's valid
    const [hours, minutes, seconds] = timeStr.split(":");
    if (
      parseInt(hours) > 23 ||
      parseInt(minutes) > 59 ||
      parseInt(seconds) > 59
    )
      return "";

    return timeStr;
  };

  // Safely process timezone
  const processTimezone = (timezone?: string): string => {
    if (!timezone) return "";

    // Check if it's a valid timezone format
    if (!/^[A-Za-z/_-]+$/.test(timezone)) return "";

    try {
      // Try creating a date with this timezone to verify it's valid
      new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(
        new Date()
      );
      return timezone;
    } catch (error) {
      console.warn(`Invalid timezone format: ${timezone}`, error);
      return "";
    }
  };

  // Process price ranges
  let priceRanges: {
    type?: string;
    currency?: string;
    min: number;
    max: number;
  }[] = [];

  if (tmEvent.priceRanges && tmEvent.priceRanges.length > 0) {
    priceRanges = tmEvent.priceRanges.map((range: TicketmasterPriceRange) => ({
      type: range.type,
      currency: range.currency,
      min: parseFloat((range.min || 0).toFixed(2)),
      max: parseFloat((range.max || 0).toFixed(2)),
    }));
  } else {
    // Try to extract price information from the description or info field
    const priceRegex =
      /(?:price|ticket|cost).*?(\$|£|€)\s*(\d+(?:\.\d{1,2})?)/i;
    const description = tmEvent.description || tmEvent.info || "";
    const priceMatch = description.match(priceRegex);

    if (priceMatch && priceMatch.length >= 3) {
      const currencySymbol = priceMatch[1];
      const price = parseFloat(priceMatch[2]);

      // Map currency symbol to code
      let currencyCode = "USD";
      if (currencySymbol === "€") currencyCode = "EUR";
      if (currencySymbol === "£") currencyCode = "GBP";

      priceRanges = [
        {
          currency: currencyCode,
          min: price,
          max: price,
        },
      ];
    }
  }

  const startDate = validateDate(tmEvent.dates?.start?.localDate);
  const endDate = validateDate(tmEvent.dates?.end?.localDate) || startDate; // If no end date, use start date
  const startTime = validateTime(tmEvent.dates?.start?.localTime);
  const endTime = validateTime(tmEvent.dates?.end?.localTime);

  return {
    id: tmEvent.id,
    name: tmEvent.name,
    description: tmEvent.description || tmEvent.info || "",
    imageUrl: bestImage?.url || tmEvent.images?.[0]?.url || "",
    startDate,
    startTime,
    endDate,
    endTime,
    venue: {
      id: tmEvent._embedded?.venues?.[0]?.id || "",
      name: tmEvent._embedded?.venues?.[0]?.name || "",
      address: tmEvent._embedded?.venues?.[0]?.address?.line1 || "",
      city: tmEvent._embedded?.venues?.[0]?.city?.name || "",
      state: tmEvent._embedded?.venues?.[0]?.state?.name || "",
      postalCode: tmEvent._embedded?.venues?.[0]?.postalCode || "",
      country: tmEvent._embedded?.venues?.[0]?.country?.name || "",
      location: {
        latitude: parseFloat(
          tmEvent._embedded?.venues?.[0]?.location?.latitude || "0"
        ),
        longitude: parseFloat(
          tmEvent._embedded?.venues?.[0]?.location?.longitude || "0"
        ),
      },
    },
    category: {
      id: tmEvent.classifications?.[0]?.segment?.id || "",
      name: tmEvent.classifications?.[0]?.segment?.name || "",
    },
    genre: {
      id: tmEvent.classifications?.[0]?.genre?.id || "",
      name: tmEvent.classifications?.[0]?.genre?.name || "",
    },
    subGenre: {
      id: tmEvent.classifications?.[0]?.subGenre?.id || "",
      name: tmEvent.classifications?.[0]?.subGenre?.name || "",
    },
    priceRanges,
    url: tmEvent.url || "",
    status: tmEvent.dates?.status?.code || "",
    images:
      tmEvent.images?.map((img: TicketmasterImage) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        ratio: img.ratio,
      })) || [],
    timezone: processTimezone(tmEvent.dates?.timezone),
    sales: tmEvent.sales
      ? {
          startDateTime: tmEvent.sales.public?.startDateTime || "",
          endDateTime: tmEvent.sales.public?.endDateTime || "",
          presales:
            tmEvent.sales.presales?.map((presale) => ({
              name: presale.name || "",
              startDateTime: presale.startDateTime || "",
              endDateTime: presale.endDateTime || "",
            })) || [],
        }
      : undefined,
    attractions:
      tmEvent._embedded?.attractions?.map((attraction) => ({
        id: attraction.id || "",
        name: attraction.name || "",
        url: attraction.url || "",
      })) || [],
  };
};
