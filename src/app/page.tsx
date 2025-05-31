"use client";

import EventCard from "@/components/events/EventCard";
import Header from "@/components/layout/Header";
import { Event } from "@/types";
import * as Motion from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
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

  // Location related state
  const [location, setLocation] = useState("");
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

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
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  }, []);

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

  // Fetch featured events
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setIsLoading(true);
        // Match events page parameters but limit to 6 results
        // Include location if available
        const locationParam = location
          ? `&city=${encodeURIComponent(location)}`
          : "";

        const response = await fetch(
          `/api/events?date=upcoming&sort=relevance,desc&size=6&includeTBA=no${locationParam}`
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
        setFeaturedEvents([]);
        setIsLoading(false);
      }
    };

    const fetchNearbyEvents = async () => {
      // Only fetch nearby events if a location is set
      if (!location) {
        setNearbyEvents([]);
        setIsLoadingNearby(false);
        return;
      }

      try {
        setIsLoadingNearby(true);
        const response = await fetch(
          `/api/events?date=upcoming&sort=distance,asc&size=6&city=${encodeURIComponent(
            location
          )}`
        );

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.events && Array.isArray(data.events)) {
          setNearbyEvents(data.events);
        } else {
          console.warn(
            "No nearby events found or unexpected data format",
            data
          );
          setNearbyEvents([]);
        }
        setIsLoadingNearby(false);
      } catch (error) {
        console.error("Error fetching nearby events:", error);
        setNearbyEvents([]);
        setIsLoadingNearby(false);
      }
    };

    fetchFeaturedEvents();
    fetchNearbyEvents();
  }, [location]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  // Select from saved locations
  const selectLocation = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowLocationDropdown(false);

    // Update current location in localStorage
    localStorage.setItem("currentLocation", selectedLocation);
  };

  // Get current location
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
            } else {
              setLocation("");
              alert(
                "Couldn't determine your city. Please enter a location manually."
              );
            }
          } catch (error) {
            console.error("Error getting location data:", error);
            setLocation("");
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

  // Toggle location dropdown
  const toggleLocationDropdown = () => {
    setShowLocationDropdown(!showLocationDropdown);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Handle search submission
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Build search query URL
    let searchUrl = `/search?`;
    if (searchTerm) searchUrl += `q=${encodeURIComponent(searchTerm)}`;
    if (location) searchUrl += `&location=${encodeURIComponent(location)}`;

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
                <div className="flex-grow flex items-center mr-4 mb-4 md:mb-0">
                  <FaSearch className="text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Search for events, venues, or artists"
                    className="w-full outline-none text-gray-800 bg-white"
                    value={searchTerm}
                    onChange={handleSearchChange}
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

                {/* Location dropdown */}
                <div className="relative md:border-l border-gray-200 px-4 flex items-center mb-4 md:mb-0">
                  <FaMapMarkerAlt className="text-gray-400 mr-2" />
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Location"
                      className="w-full outline-none text-gray-800 pr-8 bg-white"
                      value={location}
                      onChange={handleLocationChange}
                    />
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex">
                      <button
                        onClick={getCurrentLocation}
                        className="text-gray-400 hover:text-primary-600 mr-2"
                        title="Use current location"
                        aria-label="Use current location"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.547 4.505a8.25 8.25 0 1011.672 8.214l-.46-.46a2.252 2.252 0 01-.422-.586l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.211.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.654-.261a2.25 2.25 0 01-1.384-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.279-2.132z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {savedLocations.length > 0 && (
                        <button
                          onClick={toggleLocationDropdown}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label="Toggle saved locations"
                        >
                          {showLocationDropdown ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Saved locations dropdown */}
                  {showLocationDropdown && savedLocations.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md z-20">
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
                              <FaMapMarkerAlt
                                className="inline-block mr-2 text-gray-400"
                                size={12}
                              />
                              {savedLocation}
                              {localStorage.getItem("currentLocation") ===
                                savedLocation && (
                                <span className="ml-1 text-xs text-primary-600">
                                  (current)
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSearchSubmit}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-r-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Background effect/pattern */}
          <div className="absolute top-0 left-0 right-0 bottom-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm32-63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>
        </section>

        {/* Events Near Me Section - Only shown when location is set */}
        {location && nearbyEvents.length > 0 && (
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
              ) : (
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
              )}
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
