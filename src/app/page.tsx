"use client";

import EventCard from "@/components/events/EventCard";
import Header from "@/components/layout/Header";
import { Event } from "@/types";
import * as Motion from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaCalendar,
  FaChevronDown,
  FaChevronUp,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [nearbyEvents, setNearbyEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNearby, setIsLoadingNearby] = useState(true);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchError, setFetchError] = useState(false);
  const [fetchNearbyError, setFetchNearbyError] = useState(false);

  // Location related state
  const [location, setLocation] = useState("");
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Dropdown related state
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const locationButtonRef = useRef<HTMLDivElement>(null);

  // Search results related state
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Debounce related state
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch featured events with retry logic
  const fetchFeaturedEvents = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setFetchError(false);
      // Always fetch featured events without the location parameter
      const response = await fetch(
        `/api/events?date=upcoming&sort=relevance,desc&size=6&includeTBA=no`
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.events && Array.isArray(data.events)) {
        setFeaturedEvents(data.events);
      } else {
        // If no events are returned or the format is unexpected
        console.warn("No events found or unexpected data format", data);
        setFeaturedEvents([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching featured events:", error);

      // Implement retry logic - retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/3)`);

        setTimeout(() => {
          fetchFeaturedEvents(retryCount + 1);
        }, delay);
      } else {
        // All retries failed
        setFeaturedEvents([]);
        setIsLoading(false);
        setFetchError(true);
      }
    }
  }, []);

  // Function to fetch nearby events with retry logic
  const fetchNearbyEvents = useCallback(async (retryCount = 0) => {
    // Retrieve current location from localStorage instead of using state
    const currentLocation = localStorage.getItem("currentLocation");

    console.log("Fetching nearby events for location:", currentLocation);

    // Only fetch nearby events if a location is set
    if (!currentLocation) {
      console.log("No location set, skipping nearby events fetch");
      setNearbyEvents([]);
      setIsLoadingNearby(false);
      return;
    }

    try {
      setIsLoadingNearby(true);
      setFetchNearbyError(false);

      const apiUrl = `/api/events?date=upcoming&sort=distance,asc&size=6&city=${encodeURIComponent(
        currentLocation
      )}`;

      console.log("Fetching from API:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Nearby events data received:",
        data.events?.length || 0,
        "events"
      );

      if (data.events && Array.isArray(data.events)) {
        setNearbyEvents(data.events);
      } else {
        console.warn("No nearby events found or unexpected data format", data);
        setNearbyEvents([]);
      }
      setIsLoadingNearby(false);
    } catch (error) {
      console.error("Error fetching nearby events:", error);

      // Implement retry logic - retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(
          `Retrying nearby events in ${delay}ms... (Attempt ${
            retryCount + 1
          }/3)`
        );

        setTimeout(() => {
          fetchNearbyEvents(retryCount + 1);
        }, delay);
      } else {
        // All retries failed
        setNearbyEvents([]);
        setIsLoadingNearby(false);
        setFetchNearbyError(true);
      }
    }
  }, []);

  // Load user preferences and saved events on mount
  useEffect(() => {
    try {
      // Get user preferences from localStorage
      const preferences = localStorage.getItem("userPreferences");
      if (preferences) {
        const parsedPreferences = JSON.parse(preferences);

        // Get all saved locations
        if (
          parsedPreferences.locations &&
          Array.isArray(parsedPreferences.locations) &&
          parsedPreferences.locations.length > 0
        ) {
          setSavedLocations(parsedPreferences.locations);

          // Use current location from localStorage if it exists and is in saved locations
          const currentLocation = localStorage.getItem("currentLocation");
          if (
            currentLocation &&
            parsedPreferences.locations.includes(currentLocation)
          ) {
            setLocation(currentLocation);
          } else {
            // Otherwise, use the first saved location
            setLocation(parsedPreferences.locations[0]);
          }
        }
      }

      // Get saved events
      const savedEventsData = localStorage.getItem("savedEvents");
      if (savedEventsData) {
        const parsedSavedEvents = JSON.parse(savedEventsData);
        if (Array.isArray(parsedSavedEvents)) {
          setSavedEvents(parsedSavedEvents);
        }
      }

      // Initial data fetch
      fetchFeaturedEvents();
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  }, [fetchFeaturedEvents]);

  // Fetch nearby events once when component mounts and location is available
  useEffect(() => {
    const storedLocation = localStorage.getItem("currentLocation");
    if (storedLocation && storedLocation !== "Detecting location...") {
      fetchNearbyEvents();
    }
  }, [fetchNearbyEvents]);

  // Also fetch nearby events when debounced location changes
  useEffect(() => {
    if (debouncedLocation && debouncedLocation !== "Detecting location...") {
      fetchNearbyEvents();
    }
  }, [debouncedLocation, fetchNearbyEvents]);

  // Function to toggle saved/favorited events
  const handleSaveToggle = (eventId: string) => {
    // Get current saved events from localStorage
    const currentSaved = JSON.parse(
      localStorage.getItem("savedEvents") || "[]"
    );

    let updatedSaved;
    if (currentSaved.includes(eventId)) {
      // Remove event from saved events
      updatedSaved = currentSaved.filter((id: string) => id !== eventId);
      toast.success("Event removed from favorites");
    } else {
      // Add event to saved events
      updatedSaved = [...currentSaved, eventId];
      toast.success("Event saved to favorites");
    }

    // Update localStorage
    localStorage.setItem("savedEvents", JSON.stringify(updatedSaved));

    // Update state
    setSavedEvents(updatedSaved);
  };

  // Function to handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log("Search term changed:", value);

    // Clear any existing debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    if (value.trim().length > 2) {
      // Show loading state immediately
      setIsSearching(true);
      setShowSearchResults(true); // Always show the results container when searching
      console.log("Searching initiated, debounce started...");

      // Set a new timer
      searchDebounceRef.current = setTimeout(() => {
        console.log("Debounce complete, fetching results for:", value);
        fetchSearchResults(value);
      }, 500); // 500ms debounce delay
    } else {
      console.log("Search term too short, clearing results");
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  };

  // Function to fetch search results
  const fetchSearchResults = async (query: string) => {
    try {
      const response = await fetch(
        `/api/events?keyword=${encodeURIComponent(query)}&size=5`
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Search results received:",
        data.events?.length || 0,
        "events"
      );

      if (data.events && Array.isArray(data.events)) {
        setSearchResults(data.events);
        // Always show results if we have them, regardless of length
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Navigate to event detail page
  const goToEventDetail = (eventId: string) => {
    setShowSearchResults(false);
    router.push(`/events/${eventId}`);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        console.log("Click outside search area, hiding results");
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debug whenever search results visibility changes
  useEffect(() => {
    console.log(
      "showSearchResults changed:",
      showSearchResults,
      "with",
      searchResults.length,
      "results"
    );
  }, [showSearchResults, searchResults]);

  // Clean up the timer when component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, []);

  // Function to position the dropdown
  const updateDropdownPosition = () => {
    if (locationButtonRef.current) {
      const rect = locationButtonRef.current.getBoundingClientRect();

      // Calculate ideal dropdown position
      const idealLeft = rect.left + window.scrollX;

      // Check if dropdown would go off screen (assuming dropdown width is 300px)
      const dropdownWidth = 300;
      const windowWidth = window.innerWidth;

      // Adjust left position if needed to keep dropdown on screen
      const adjustedLeft = Math.min(
        idealLeft,
        windowWidth - dropdownWidth - 10
      ); // 10px margin

      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: adjustedLeft,
        width: rect.width,
      });
    }
  };

  // Update dropdown position when toggling
  const toggleLocationDropdown = () => {
    if (!showLocationDropdown) {
      updateDropdownPosition();
    }
    setShowLocationDropdown(!showLocationDropdown);
  };

  // Update dropdown position on resize
  useEffect(() => {
    if (showLocationDropdown) {
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [showLocationDropdown]);

  // Select from saved locations
  const selectLocation = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setDebouncedLocation(selectedLocation); // Update debounced value immediately
    setShowLocationDropdown(false);

    // Update current location in localStorage
    localStorage.setItem("currentLocation", selectedLocation);

    // No need to trigger API calls here
  };

  // Get current location
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCurrentLocation = () => {
    // Check if running in a browser environment
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser. Please enter your location manually."
      );
      return;
    }

    setLocation("Detecting location...");

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get the city name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );

            if (!response.ok) {
              throw new Error("Failed to get location information");
            }

            const data = await response.json();
            const cityName =
              data.city || data.locality || data.principalSubdivision;

            if (cityName) {
              setLocation(cityName);
              setDebouncedLocation(cityName); // Update debounced location immediately
              localStorage.setItem("currentLocation", cityName);

              // Add to saved locations if not already there
              if (!savedLocations.includes(cityName)) {
                const newSavedLocations = [...savedLocations, cityName];
                setSavedLocations(newSavedLocations);

                // Update preferences
                const preferences = localStorage.getItem("userPreferences");
                if (preferences) {
                  const parsedPreferences = JSON.parse(preferences);
                  parsedPreferences.locations = newSavedLocations;
                  localStorage.setItem(
                    "userPreferences",
                    JSON.stringify(parsedPreferences)
                  );
                }
              }

              // Remove the permission denied flag if it was set before
              localStorage.removeItem("locationPermissionDenied");

              // Fetch nearby events after location is updated
              fetchNearbyEvents();
            } else {
              setLocation("");
              setDebouncedLocation(""); // Clear debounced location as well
              alert(
                "Couldn't determine your city. Please enter a location manually."
              );
            }
          } catch (error) {
            console.error("Error getting location data:", error);
            setLocation("");
            setDebouncedLocation(""); // Clear debounced location as well
            alert(
              "Failed to get your location. Please enter a location manually."
            );
          }
        },
        (error) => {
          // Log the error with full details
          setLocation("");

          // Attempt to detect Chrome extension interference
          const errorString = String(error);
          const isExtensionError =
            errorString.includes("chrome-extension") ||
            (error.message && error.message.includes("chrome-extension")) ||
            document.URL.includes("chrome-extension");

          if (isExtensionError) {
            alert(
              "A browser extension is blocking location access. Try disabling extensions or using incognito mode."
            );
          } else if (error.code === 1) {
            // PERMISSION_DENIED
            localStorage.setItem("locationPermissionDenied", "true");
          } else if (error.code === 2) {
            // POSITION_UNAVAILABLE
            alert(
              "Your current position is unavailable. The GPS signal might be obstructed or your device may not have GPS capabilities."
            );
          } else if (error.code === 3) {
            // TIMEOUT
            alert(
              "Location request timed out. Please try again or enter a location manually."
            );
          } else {
            alert(
              "Couldn't get your location. Please enter a location manually."
            );
          }
        },
        {
          enableHighAccuracy: true, // Request the best possible position
          timeout: 10000, // Wait up to 10 seconds
          maximumAge: 0, // Don't use a cached position
        }
      );
    } catch (generalError) {
      // Handle general exceptions thrown by the geolocation API
      console.error("General geolocation error:", generalError);
      setLocation("");
      alert(
        "An unexpected error occurred while trying to get your location. Please enter a location manually."
      );
    }
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);

    // Clear any existing debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Build search query URL
    let searchUrl = `/search?`;
    if (searchTerm) searchUrl += `q=${encodeURIComponent(searchTerm)}`;
    if (location) {
      // Use the & only if there's already a parameter
      if (searchTerm) searchUrl += "&";
      searchUrl += `location=${encodeURIComponent(location)}`;
    }

    router.push(searchUrl);
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
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  // Function to render search results at root level
  const renderSearchResults = () => {
    // Only show results container if searching or results should be shown
    if (!searchInputRef.current || (!showSearchResults && !isSearching)) {
      return null;
    }

    const inputRect = searchInputRef.current.getBoundingClientRect();

    return (
      <div
        ref={searchResultsRef}
        className="fixed bg-white shadow-xl rounded-md overflow-hidden z-[10001]"
        style={{
          top: inputRect.bottom + window.scrollY + 5,
          left: inputRect.left + window.scrollX,
          width: inputRect.width,
          maxHeight: "60vh",
          visibility: "visible",
          display: "block",
        }}
      >
        {isSearching ? (
          // Loading spinner
          <div className="py-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Searching events...</p>
          </div>
        ) : searchResults.length > 0 ? (
          // Search results list
          <ul className="py-1 max-h-60 overflow-y-auto">
            {searchResults.map((event) => (
              <li
                key={event.id}
                className="border-b border-gray-100 last:border-0"
              >
                <button
                  onClick={() => goToEventDetail(event.id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start">
                    {event.images && event.images[0] && (
                      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3">
                        <Image
                          src={event.images[0].url}
                          alt={event.name}
                          className="w-full h-full object-cover"
                          width={48}
                          height={48}
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="font-medium text-gray-900 truncate">
                        {event.name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <FaCalendar className="mr-1" size={10} />
                        <span>{event.startDate || "Date TBA"}</span>
                      </div>
                      {event.venue && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <FaMapMarkerAlt className="mr-1" size={10} />
                          <span className="truncate">{event.venue.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          // No results message
          <div className="py-6 text-center">
            <div className="inline-block text-gray-400 mb-2">
              <FaSearch size={24} />
            </div>
            <p className="text-gray-600">No events found</p>
          </div>
        )}
      </div>
    );
  };

  const { motion } = Motion;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-primary-900 to-primary-700 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Discover Events Near You
              </h1>
              <p className="text-xl opacity-80 mb-8">
                Find local events, concerts, festivals, and more happening in
                your area
              </p>

              {/* Search form */}
              <div className="bg-white rounded-lg shadow-xl p-4 md:p-0 md:pl-6 flex flex-col md:flex-row items-stretch max-w-3xl mx-auto">
                <div className="flex-grow flex items-center mr-4 mb-4 md:mb-0 relative">
                  <FaSearch className="text-gray-400 mr-3" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for events"
                    className="w-full outline-none text-gray-800 bg-white"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => {
                      console.log("Search input focused");
                      // If we already have search results and search term is valid, show them
                      if (
                        searchTerm.trim().length > 2 &&
                        searchResults.length > 0
                      ) {
                        console.log("Showing existing search results on focus");
                        setShowSearchResults(true);
                      } else if (searchTerm.trim().length > 2) {
                        // If term is valid but no results, trigger a search
                        console.log("No existing results, fetching on focus");
                        setIsSearching(true);
                        fetchSearchResults(searchTerm);
                      }
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                {/* Location dropdown - only shown when there are saved locations */}
                {savedLocations.length > 0 ? (
                  <div className="relative cursor-pointer md:border-l border-gray-200 px-4 flex items-center mb-4 md:mb-0">
                    <FaMapMarkerAlt className="text-gray-400 mr-2" />
                    <div className="relative w-full">
                      <div
                        ref={locationButtonRef}
                        className="w-full outline-none text-gray-800 pr-8 bg-white cursor-pointer flex items-center min-h-[24px]"
                        onClick={toggleLocationDropdown}
                      >
                        {location || "Select location"}
                      </div>
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex">
                        <button
                          onClick={toggleLocationDropdown}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          aria-label="Toggle saved locations"
                        >
                          {showLocationDropdown ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  onClick={handleSearchSubmit}
                  className="bg-primary-600 hover:bg-primary-700 cursor-pointer text-white px-6 py-3 rounded-r-lg transition-colors"
                >
                  {savedLocations.length > 0 ? "Search" : "Advanced Search"}
                </button>
              </div>
            </div>
          </div>

          {/* Background effect/pattern */}
          <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
            {/* Dark overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-primary-900/40 z-10"></div>

            {/* Main banner image */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url('/banner.jpg')` }}
            ></div>

            {/* Subtle pattern overlay for texture */}
            <div
              className="absolute inset-0 z-5 opacity-10 bg-repeat mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>

            {/* Vignette effect */}
            <div className="absolute inset-0 z-5 bg-radial-gradient pointer-events-none"></div>
          </div>
        </section>

        {/* Floating dropdown for locations - will be at the top level of the DOM */}
        {showLocationDropdown && savedLocations.length > 0 && (
          <>
            <div
              className="fixed inset-0 bg-transparent z-[9999]"
              onClick={() => setShowLocationDropdown(false)}
            />
            <div
              className="fixed bg-white shadow-xl rounded-md z-[10000] overflow-hidden"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: "300px", // Fixed width of 300px
                maxHeight: "300px",
              }}
            >
              <ul className="py-1 max-h-48 overflow-y-auto">
                {savedLocations.map((savedLocation, index) => (
                  <li key={index}>
                    <button
                      onClick={() => selectLocation(savedLocation)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                        location === savedLocation
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700"
                      }`}
                    >
                      <div className="flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
                        <FaMapMarkerAlt
                          className="inline-block mr-2 text-gray-400 flex-shrink-0"
                          size={12}
                        />
                        <span className="truncate">{savedLocation}</span>
                        {localStorage.getItem("currentLocation") ===
                          savedLocation && (
                          <span className="ml-1 text-xs text-primary-600 flex-shrink-0">
                            (default)
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Events Near Me Section - Only shown when location is set and events are available */}
        {location && (nearbyEvents.length > 0 || isLoadingNearby) && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Events Near {location}
                </h2>
                <Link
                  href={`/search?location=${encodeURIComponent(location)}`}
                  className="text-primary-600 hover:text-primary-800 font-medium"
                >
                  View all nearby events
                </Link>
              </div>

              {isLoadingNearby ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-300 rounded-lg aspect-video mb-3"></div>
                      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : nearbyEvents.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {nearbyEvents.map((event) => (
                    <motion.div key={event.id} variants={itemVariants}>
                      <EventCard
                        event={event}
                        isSaved={savedEvents.includes(event.id)}
                        onSaveToggle={handleSaveToggle}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : fetchNearbyError ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    Unable to load nearby events. Please try again later.
                  </p>
                  <button
                    onClick={() => {
                      setIsLoadingNearby(true);
                      setFetchNearbyError(false);
                      fetchNearbyEvents();
                    }}
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-md transition-colors"
                  >
                    Reload Events
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* Featured Events Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Upcoming Events
              </h2>
              <Link
                href="/events"
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                View all events
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-300 rounded-lg aspect-video mb-3"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : featuredEvents.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {featuredEvents.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <EventCard
                      event={event}
                      isSaved={savedEvents.includes(event.id)}
                      onSaveToggle={handleSaveToggle}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : fetchError ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  Unable to load events. Please try again later.
                </p>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setFetchError(false);
                    fetchFeaturedEvents();
                  }}
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-md transition-colors"
                >
                  Reload Events
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No upcoming events found</p>
                <Link
                  href="/events"
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white py-2 px-6 rounded-md transition-colors"
                >
                  Browse all events
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CategoryCard
                title="Music"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122Z" />
                  </svg>
                }
                href="/events?classificationId=KZFzniwnSyZfZ7v7nJ"
                color="bg-indigo-100 text-indigo-600"
              />
              <CategoryCard
                title="Sports"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6Z" />
                    <path
                      fillRule="evenodd"
                      d="M20.25 10.332v9.918H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h.75v-9.918a.75.75 0 0 1 .634-.74A49.109 49.109 0 0 1 12 9c2.59 0 5.134.175 7.616.514a.75.75 0 0 1 .634.738Zm-7.5 2.418a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 0 1.5 0v-6.75Zm3-.75a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0v-6.75a.75.75 0 0 1 .75-.75ZM9 12.75a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 0 1.5 0v-6.75Z"
                      clipRule="evenodd"
                    />
                    <path d="M12 7.875a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
                  </svg>
                }
                href="/events?classificationId=KZFzniwnSyZfZ7v7nE"
                color="bg-green-100 text-green-600"
              />
              <CategoryCard
                title="Arts & Theatre"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M20.599 1.5c-.376 0-.743.111-1.055.32L5.231 12.26a1.5 1.5 0 0 0-.546 1.199l.003 7.5a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.2-.545l10.44-14.313a1.5 1.5 0 0 0 .322-1.672l-3-6a1.5 1.5 0 0 0-1.05-.83ZM16.5 14.236l-6.5 6.5v-13l6.5-6.5v13Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                href="/events?classificationId=KZFzniwnSyZfZ7v7na"
                color="bg-purple-100 text-purple-600"
              />
              <CategoryCard
                title="Film"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 18.375V5.625Zm1.5 0v1.5c0 .207.168.375.375.375h1.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-1.5A.375.375 0 0 0 3 5.625Zm16.125-.375a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0 0 21 7.125v-1.5a.375.375 0 0 0-.375-.375h-1.5ZM21 9.375A.375.375 0 0 0 20.625 9h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 0 0 .375-.375v-1.5ZM4.875 18.75a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h1.5ZM3.375 15h1.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-1.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375Zm0-3.75h1.5a.375.375 0 0 0 .375-.375v-1.5A.375.375 0 0 0 4.875 9h-1.5A.375.375 0 0 0 3 9.375v1.5c0 .207.168.375.375.375Zm4.125 0a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                href="/events?classificationId=KZFzniwnSyZfZ7v7nn"
                color="bg-red-100 text-red-600"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSearch className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  Discover Events
                </h3>
                <p className="text-gray-600">
                  Find events based on your interests, location, and schedule.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCalendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  Save and Plan
                </h3>
                <p className="text-gray-600">
                  Save events you&apos;re interested in and plan your schedule.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  Attend and Enjoy
                </h3>
                <p className="text-gray-600">
                  Attend events and create memorable experiences.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Render search results at root level */}
      {renderSearchResults()}
    </>
  );
}

// Category Card Component
interface CategoryCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function CategoryCard({ title, icon, href, color }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center p-6 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
    >
      <div
        className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </Link>
  );
}
