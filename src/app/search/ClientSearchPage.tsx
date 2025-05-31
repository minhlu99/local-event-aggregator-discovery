"use client";

import EventCard from "@/components/events/EventCard";
import { Category, Event } from "@/types";
import { fetchEvents, mapTicketmasterEventToAppEvent } from "@/utils/api";
import * as Motion from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSearch,
  FaSpinner,
  FaTags,
} from "react-icons/fa";

// Define types for categories data
interface CategoryData {
  segment: {
    id: string;
    name: string;
  };
}

// Geocoding results interface
interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    state?: string;
    country?: string;
  };
}

// Generic input change handler type
type InputChangeHandler<T> = (
  setter: React.Dispatch<React.SetStateAction<T>>,
  value: T
) => void;

export default function ClientSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Safely get query parameters - memoized to prevent dependency issues
  const getParam = useCallback(
    (param: string): string => {
      return searchParams?.get(param) || "";
    },
    [searchParams]
  );

  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const { motion } = Motion;

  // Form state
  const [searchTerm, setSearchTerm] = useState(getParam("search"));
  const [category, setCategory] = useState(getParam("category"));
  const [date, setDate] = useState(getParam("date"));
  const [sort, setSort] = useState(getParam("sort") || "relevance,desc");

  // Location state
  const [locationInput, setLocationInput] = useState(
    getParam("city") || getParam("location") || ""
  );
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<
    GeocodingResult[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    lat: string;
    lon: string;
  } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(
    getParam("city") || getParam("location") || ""
  );

  // Debounce timer for location search
  const locationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Update form state when search params change
  useEffect(() => {
    setSearchTerm(getParam("search"));
    setCategory(getParam("category"));
    setDate(getParam("date"));
    const locationParam = getParam("city") || getParam("location") || "";
    setLocationInput(locationParam);
    setSelectedLocation(locationParam);
    setSort(getParam("sort") || "relevance,desc");

    // Check for lat/long coordinates
    const latlong = getParam("latlong");
    if (latlong && latlong.includes(",")) {
      const [lat, lon] = latlong.split(",");
      setCoordinates({ lat, lon });
    } else {
      setCoordinates(null);
    }
  }, [getParam]);

  // Generic handlers for different types of inputs
  const handleStringInputChange: InputChangeHandler<string> = (
    setter,
    value
  ) => {
    setter(value);
  };

  // Handle location search with debounce
  useEffect(() => {
    if (locationInput.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear any existing timeout
    if (locationDebounceRef.current) {
      clearTimeout(locationDebounceRef.current);
    }

    // Set a new timeout for debounce
    locationDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearchingLocation(true);
        // Use OpenStreetMap Nominatim API for geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            locationInput
          )}&limit=5&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "LocalEventDiscoveryApp",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }

        const data: GeocodingResult[] = await response.json();
        setLocationSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error("Error searching for location:", error);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500); // 500ms debounce

    // Cleanup function
    return () => {
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }
    };
  }, [locationInput]);

  // Handle selecting a location suggestion
  const handleSelectLocation = (result: GeocodingResult) => {
    // Extract city, town, or state for display
    const locationName =
      result.address.city ||
      result.address.town ||
      result.address.state ||
      result.display_name.split(",")[0];

    // Update the location input field
    setLocationInput(locationName);
    setSelectedLocation(locationName);
    setShowSuggestions(false);

    // Store coordinates
    setCoordinates({
      lat: result.lat.toString(),
      lon: result.lon.toString(),
    });
  };

  // Handle closing suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationInputRef.current &&
        !locationInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          if (data.categories && Array.isArray(data.categories)) {
            // Extract main segments/categories
            const segments = data.categories
              .filter((cat: CategoryData) => cat.segment && cat.segment.name)
              .map((cat: CategoryData) => ({
                id: cat.segment.name, // Use segment name as ID for API compatibility
                name: cat.segment.name,
              }));

            // Remove duplicates
            const uniqueSegments = Array.from(
              new Map(
                segments.map((item: Category) => [item.id, item])
              ).values()
            );

            setCategories(uniqueSegments as Category[]);
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategoriesData();
  }, []);

  // Fetch data from Ticketmaster API
  useEffect(() => {
    const fetchEventsData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Convert date filter to start/end date parameters
        let startDateTime, endDateTime;
        const today = new Date();

        if (date === "today") {
          const formattedDate = today.toISOString().split("T")[0];
          startDateTime = `${formattedDate}T00:00:00Z`;
          endDateTime = `${formattedDate}T23:59:59Z`;
        } else if (date === "this-week") {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
          startDateTime = today.toISOString().split(".")[0] + "Z";
          endDateTime = endOfWeek.toISOString().split(".")[0] + "Z";
        } else if (date === "this-month") {
          const endOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
          );
          startDateTime = today.toISOString().split(".")[0] + "Z";
          endDateTime = endOfMonth.toISOString().split(".")[0] + "Z";
        } else if (date === "upcoming") {
          startDateTime = today.toISOString().split(".")[0] + "Z";
        }

        // Build API parameters
        const params: Record<string, string | number> = {
          size: 20,
          page: currentPage,
          sort: sort || "relevance,desc",
        };

        if (searchTerm) params.keyword = searchTerm;
        if (category) params.classificationName = category;
        if (startDateTime) params.startDateTime = startDateTime;
        if (endDateTime) params.endDateTime = endDateTime;

        // Location parameters
        if (coordinates) {
          // Use exact coordinates if available
          params.latlong = `${coordinates.lat},${coordinates.lon}`;
          params.radius = 25; // Default radius
          params.unit = "miles";
        } else if (selectedLocation) {
          // Otherwise use city/postal code
          if (/^\d+$/.test(selectedLocation)) {
            params.postalCode = selectedLocation;
          } else {
            params.city = selectedLocation;
          }
        }

        const result = await fetchEvents(params);

        // Map Ticketmaster events to our app format
        const mappedEvents = result.events.map(mapTicketmasterEventToAppEvent);
        setFilteredEvents(mappedEvents);
        setTotalPages(result.page?.totalPages || 1);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch events. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchEventsData();
  }, [
    searchTerm,
    category,
    date,
    selectedLocation,
    coordinates,
    currentPage,
    sort,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page on new search
    setSelectedLocation(locationInput); // Update selected location when form is submitted

    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (category) params.set("category", category);
    if (date) params.set("date", date);

    // Add location information
    if (locationInput) params.set("location", locationInput);
    if (coordinates) {
      params.set("latlong", `${coordinates.lat},${coordinates.lon}`);
    }

    if (sort && sort !== "relevance,desc") params.set("sort", sort);

    router.push(`/search?${params.toString()}`);
  };

  // Handle location input keypress (Enter)
  const handleLocationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // If user presses enter without selecting from dropdown
      // it still updates the selectedLocation with current input
      setSelectedLocation(locationInput);
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Function to toggle saved/favorited events
  const handleSaveToggle = (eventId: string) => {
    setSavedEvents((prev) => {
      if (prev.includes(eventId)) {
        return prev.filter((id) => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <>
      {/* Search Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-6 shadow-lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-3 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaSearch className="inline mr-2" />
              Event Name or Keyword
            </label>
            <input
              type="text"
              placeholder="Search for events..."
              value={searchTerm}
              onChange={(e) =>
                handleStringInputChange(setSearchTerm, e.target.value)
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaTags className="inline mr-2" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) =>
                handleStringInputChange(setCategory, e.target.value)
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaCalendarAlt className="inline mr-2" />
              Date
            </label>
            <select
              value={date}
              onChange={(e) => handleStringInputChange(setDate, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">Any Time</option>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaMapMarkerAlt className="inline mr-2" />
              Location
            </label>
            <div className="relative">
              <input
                ref={locationInputRef}
                type="text"
                placeholder="City or postal code"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={handleLocationKeyPress}
                onFocus={() =>
                  setShowSuggestions(locationSuggestions.length > 0)
                }
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
              />

              {isSearchingLocation && (
                <div className="absolute right-3 top-3">
                  <FaSpinner className="animate-spin text-gray-400" />
                </div>
              )}

              {/* Location suggestions */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                  {locationSuggestions.map((result, index) => {
                    // Extract readable location name
                    const locationName =
                      result.address.city ||
                      result.address.town ||
                      result.address.state ||
                      result.display_name.split(",")[0];

                    // Create readable address with state/country
                    const locationDetail = [
                      result.address.state,
                      result.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <div
                        key={`${result.lat}-${result.lon}-${index}`}
                        className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSelectLocation(result)}
                      >
                        <div className="font-medium text-gray-800">
                          {locationName}
                        </div>
                        {locationDetail && (
                          <div className="text-xs text-gray-500">
                            {locationDetail}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {coordinates && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <FaMapMarkerAlt className="mr-1 text-primary-500" />
                <span>Using precise location coordinates</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <FaSpinner className="animate-spin mr-2" />
                Searching...
              </span>
            ) : (
              "Search Events"
            )}
          </button>
        </div>
      </motion.form>

      {/* Results */}
      <div className="container mx-auto py-12">
        <div className="mb-8 flex items-center">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mr-3"></div>
              <h2 className="text-2xl font-bold text-gray-900">
                Searching events
                {selectedLocation ? ` in ${selectedLocation}` : ""}...
              </h2>
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error
                ? "Error"
                : filteredEvents.length === 0
                ? "No events found"
                : `Events${
                    selectedLocation ? ` in ${selectedLocation}` : ""
                  } (${filteredEvents.length})`}
            </h2>
          )}
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {isLoading ? (
          // Loading state
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {filteredEvents.length === 0 && !error ? (
              // Empty state
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No events found matching your criteria. Try adjusting your
                  search filters.
                </p>
              </div>
            ) : (
              // Results grid
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredEvents.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <EventCard
                      event={event}
                      isSaved={savedEvents.includes(event.id)}
                      onSaveToggle={() => handleSaveToggle(event.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {filteredEvents.length > 0 && (
              <div className="mt-12 flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === 0
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    Previous
                  </button>
                  <div className="px-4 py-2 bg-white text-gray-700 rounded-lg">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage >= totalPages - 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
