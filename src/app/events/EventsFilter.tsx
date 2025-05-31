"use client";

import { Category } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  FaCalendarAlt,
  FaFilter,
  FaMapMarkerAlt,
  FaSpinner,
  FaTags,
  FaTimes,
} from "react-icons/fa";

// Define interface for category data from API
interface CategoryResponse {
  segment: {
    id: string;
    name: string;
  };
  genres?: Array<{
    id: string;
    name: string;
  }>;
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

const EventsFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Location state
  const [locationInput, setLocationInput] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<
    GeocodingResult[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce timer
  const locationDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for filter sections to enable scrolling
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const locationFilterRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Get current filter values from URL with null checks
  const currentCategory = searchParams?.get("classificationId") || "";
  const currentDate = searchParams?.get("date") || "";
  const currentLocation = searchParams?.get("location") || "";
  const currentLat = searchParams?.get("latlong")?.split(",")[0] || "";
  const currentLon = searchParams?.get("latlong")?.split(",")[1] || "";

  // Initialize location input from URL params
  useEffect(() => {
    if (mounted && currentLocation) {
      setLocationInput(currentLocation);
    }
  }, [mounted, currentLocation]);

  // Only render after client-side hydration to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle window resize for responsive behavior
  useEffect(() => {
    if (!mounted) return;

    const handleResize = () => {
      // If screen becomes larger than md breakpoint, always show filters
      if (window.innerWidth >= 768) {
        setIsOpen(false); // Reset mobile menu state
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  // Handle location search with debounce
  useEffect(() => {
    if (!mounted || locationInput.length < 3) {
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

        // If suggestions appear, ensure they're visible by scrolling if needed
        if (
          data.length > 0 &&
          locationInputRef.current &&
          filterContainerRef.current
        ) {
          // Small delay to ensure DOM is updated
          setTimeout(() => {
            if (locationInputRef.current && filterContainerRef.current) {
              const inputRect =
                locationInputRef.current.getBoundingClientRect();
              const containerRect =
                filterContainerRef.current.getBoundingClientRect();

              // Check if input is partially out of view
              const inputBottom = inputRect.bottom - containerRect.top;
              const visibleHeight = containerRect.height;

              // We want to ensure the input and at least 2 suggestions are visible
              // Each suggestion is roughly 50px tall
              const desiredVisibleHeight = inputBottom + 120;

              if (desiredVisibleHeight > visibleHeight) {
                // Scroll to make input and some suggestions visible
                filterContainerRef.current.scrollTo({
                  top:
                    filterContainerRef.current.scrollTop +
                    (desiredVisibleHeight - visibleHeight),
                  behavior: "smooth",
                });
              }
            }
          }, 100);
        }
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
  }, [locationInput, mounted]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && Array.isArray(data.categories)) {
          // Process categories to ensure they have proper format with unique IDs
          const processedCategories = data.categories
            .filter(
              (cat: CategoryResponse) =>
                cat && cat.segment && cat.segment.id && cat.segment.name
            )
            .map((cat: CategoryResponse) => ({
              id: cat.segment.id,
              name: cat.segment.name,
            }));

          // Remove duplicates by id
          const uniqueCategories = Array.from(
            new Map(
              processedCategories.map((item: Category) => [item.id, item])
            )
          ).map(([, item]) => item) as Category[];

          setCategories(uniqueCategories);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories. Using defaults instead.");
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted) {
      fetchCategories();
    }
  }, [mounted]);

  // Helper function to scroll to a specific filter section
  const scrollToFilter = (element: HTMLDivElement | null) => {
    if (element && filterContainerRef.current) {
      // First scroll the filter container to show the filter section
      const container = filterContainerRef.current;

      // Calculate the top position of the element relative to the container
      const elementTop = element.offsetTop;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // If the element is not visible or only partially visible, scroll to it
      if (
        elementTop < containerScrollTop ||
        elementTop + element.clientHeight > containerScrollTop + containerHeight
      ) {
        container.scrollTo({
          top: elementTop - 20, // Scroll with a small offset for better visibility
          behavior: "smooth",
        });
      }
    }
  };

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
    setShowSuggestions(false);

    // Build the query parameters with exact lat/lon
    const params = new URLSearchParams(searchParams?.toString() || "");

    // Set the location name
    params.set("location", locationName);

    // Set the exact latitude and longitude for the API
    params.set("latlong", `${result.lat},${result.lon}`);

    // Always set sort to relevance,desc as default
    params.set("sort", "relevance,desc");

    // Optional: Add radius parameter (in miles)
    params.set("radius", "25");
    params.set("unit", "miles");

    // Apply the filters
    console.log("Navigating with location params:", params.toString());
    router.push(`/events?${params.toString()}`);

    // Auto-close filters on mobile after selection
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    if (!searchParams) return;

    // Create a new URLSearchParams instance from the current URL
    const params = new URLSearchParams(searchParams.toString());

    // Always set sort to relevance,desc as default
    params.set("sort", "relevance,desc");

    // Clear any existing date/time parameters to avoid conflicts
    if (name === "date") {
      params.delete("startDateTime");
      params.delete("endDateTime");
      params.delete("includePast");

      // Set or remove the date parameter
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }

      // No need to set additional date parameters - the backend will handle it
    }
    // For category filtering, we need to set classificationId directly
    else if (name === "category") {
      // Clear any existing classification parameters to avoid conflicts
      params.delete("classificationName");
      params.delete("classificationId");
      params.delete("segmentId");
      params.delete("category"); // Ensure legacy parameter is removed

      if (value) {
        // Use the category ID directly as the classificationId for the Ticketmaster API
        params.set("classificationId", value);
      }
    }
    // Normal handling for other parameters
    else {
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
    }

    // Debug the parameters being sent
    console.log("Navigating with params:", params.toString());

    router.push(`/events?${params.toString()}`);

    // Auto-close filters on mobile after selection
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const clearFilters = () => {
    setLocationInput("");
    router.push("/events");
  };

  const hasActiveFilters = currentCategory || currentDate || currentLocation;

  // Use a simpler structure for initial server-side render
  if (!mounted) {
    return (
      <div
        className="bg-white rounded-lg shadow-md p-6 sticky top-20 w-full"
        suppressHydrationWarning
      >
        <div
          className="flex justify-between items-center mb-6"
          suppressHydrationWarning
        >
          <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="flex justify-center py-4" suppressHydrationWarning>
          <FaSpinner className="animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  // Full component is only rendered client-side, avoiding hydration issues
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              className="text-sm text-primary-600 hover:text-primary-800"
              onClick={clearFilters}
            >
              Clear all
            </button>
          )}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close filters" : "Open filters"}
          >
            {isOpen ? <FaTimes /> : <FaFilter />}
            <span className="ml-1 text-sm font-medium">
              {isOpen ? "Close" : "Filters"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile overlay for better visibility */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div
        ref={filterContainerRef}
        className={`${
          isOpen
            ? "fixed left-0 right-0 bottom-0 top-[76px] bg-white z-20 overflow-y-auto p-6"
            : "hidden md:block overflow-y-auto max-h-[calc(100vh-120px)]"
        } space-y-6`}
      >
        {isOpen && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Filter Events</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select options to filter the events list
            </p>
          </div>
        )}

        {/* Category Filter */}
        <Fragment>
          <div
            ref={categoryFilterRef}
            className="flex items-center mb-4 cursor-pointer"
            onClick={() => scrollToFilter(categoryFilterRef.current)}
          >
            <FaTags className="text-primary-500 mr-2 text-lg" />
            <h3 className="font-semibold text-lg text-gray-800">Category</h3>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <FaSpinner className="animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 mb-2">{error}</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="category-all"
                  name="category"
                  value=""
                  checked={currentCategory === ""}
                  onChange={() => handleFilterChange("category", "")}
                  className="mr-2 accent-primary-600 h-4 w-4"
                />
                <label
                  htmlFor="category-all"
                  className="text-gray-700 text-base"
                >
                  All Categories
                </label>
              </div>
              {categories.map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`category-${category.id}`}
                    name="category"
                    value={category.id}
                    checked={currentCategory === category.id}
                    onChange={() => handleFilterChange("category", category.id)}
                    className="mr-2 accent-primary-600 h-4 w-4"
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-gray-700 text-base"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </Fragment>

        {/* Date Filter */}
        <Fragment>
          <div
            ref={dateFilterRef}
            className="flex items-center mb-4 cursor-pointer"
            onClick={() => scrollToFilter(dateFilterRef.current)}
          >
            <FaCalendarAlt className="text-primary-500 mr-2 text-lg" />
            <h3 className="font-semibold text-lg text-gray-800">Date</h3>
          </div>
          <div className="space-y-2">
            {["all", "today", "this-week", "this-month", "upcoming"].map(
              (date) => (
                <div key={date} className="flex items-center">
                  <input
                    type="radio"
                    id={`date-${date}`}
                    name="date"
                    value={date === "all" ? "" : date}
                    checked={
                      (date === "all" && currentDate === "") ||
                      currentDate === date
                    }
                    onChange={() =>
                      handleFilterChange("date", date === "all" ? "" : date)
                    }
                    className="mr-2 accent-primary-600 h-4 w-4"
                  />
                  <label
                    htmlFor={`date-${date}`}
                    className="text-gray-700 text-base"
                  >
                    {date === "all" && "Any time"}
                    {date === "today" && "Today"}
                    {date === "this-week" && "This week"}
                    {date === "this-month" && "This month"}
                    {date === "upcoming" && "Upcoming"}
                  </label>
                </div>
              )
            )}
          </div>
        </Fragment>

        {/* Location input */}
        <Fragment>
          <div
            ref={locationFilterRef}
            className="flex items-center mb-4 cursor-pointer"
            onClick={() => scrollToFilter(locationFilterRef.current)}
          >
            <FaMapMarkerAlt className="text-primary-500 mr-2 text-lg" />
            <h3 className="font-semibold text-lg text-gray-800">Location</h3>
          </div>

          <div className="relative px-2 pb-3">
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Enter city or address"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onFocus={() => setShowSuggestions(locationSuggestions.length > 0)}
              className="w-full p-2 pl-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-base text-gray-700"
            />

            {/* Loading indicator */}
            {isSearchingLocation && (
              <div className="absolute right-3 top-2.5">
                <FaSpinner className="animate-spin text-primary-500" />
              </div>
            )}

            {/* Location suggestions shown in absolute position */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={suggestionRef}
                className="absolute z-30 left-0 right-0 top-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
              >
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

          {/* Current location indicator */}
          {currentLat && currentLon && (
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <FaMapMarkerAlt className="mr-1 text-primary-500" />
              <span>Using precise location coordinates for search results</span>
            </div>
          )}
        </Fragment>

        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <button
              onClick={clearFilters}
              className="w-full py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-base"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Mobile-only apply button */}
        {isOpen && (
          <div className="pt-4 mt-6 border-t fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsFilter;
