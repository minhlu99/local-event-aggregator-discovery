"use client";

import Header from "@/components/layout/Header";
import CategorySelection from "@/components/ui/CategorySelection";
import LocationSelector, { Location } from "@/components/ui/LocationSelector";
import { Category, Event, UserPreferences } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaBasketballBall,
  FaEdit,
  FaEnvelope,
  FaFilm,
  FaGlasses,
  FaMapMarkerAlt,
  FaMusic,
  FaTheaterMasks,
  FaUser,
} from "react-icons/fa";

interface User {
  name: string;
  email: string;
  avatar: string;
  preferences?: UserPreferences;
}

// Function to get the icon based on category name or ID
const getCategoryIcon = (categoryNameOrId: string) => {
  // First, try to identify by ID if it looks like a category ID
  if (categoryNameOrId && categoryNameOrId.startsWith("KZF")) {
    switch (categoryNameOrId) {
      case "KZFzniwnSyZfZ7v7nJ": // Music
        return <FaMusic className="text-primary-600" />;
      case "KZFzniwnSyZfZ7v7nE": // Sports
        return <FaBasketballBall className="text-primary-600" />;
      case "KZFzniwnSyZfZ7v7na": // Arts & Theatre
        return <FaTheaterMasks className="text-primary-600" />;
      case "KZFzniwnSyZfZ7v7nn": // Film
        return <FaFilm className="text-primary-600" />;
      case "KZFzniwnSyZfZ7v7n1": // Miscellaneous
        return <FaGlasses className="text-primary-600" />;
      default:
        // Handle unknown ID
        break;
    }
  }

  // If not identified by ID or not an ID, try by name
  const name = categoryNameOrId ? categoryNameOrId.toLowerCase() : "";

  if (name.includes("music")) return <FaMusic className="text-primary-600" />;
  if (
    name.includes("sport") ||
    name.includes("team") ||
    name.includes("athletic")
  )
    return <FaBasketballBall className="text-primary-600" />;
  if (
    name.includes("art") ||
    name.includes("theatre") ||
    name.includes("theater") ||
    name.includes("dance") ||
    name.includes("broadway")
  )
    return <FaTheaterMasks className="text-primary-600" />;
  if (
    name.includes("film") ||
    name.includes("movie") ||
    name.includes("cinema")
  )
    return <FaFilm className="text-primary-600" />;

  // Default icon for other categories
  return <FaGlasses className="text-primary-600" />;
};

// Function to get readable category name from ID when category data isn't loaded yet
const getCategoryNameById = (categoryId: string): string => {
  // Map of common Ticketmaster category IDs to readable names
  const categoryMap: Record<string, string> = {
    KZFzniwnSyZfZ7v7nJ: "Music",
    KZFzniwnSyZfZ7v7nE: "Sports",
    KZFzniwnSyZfZ7v7na: "Arts & Theatre",
    KZFzniwnSyZfZ7v7nn: "Film",
    KZFzniwnSyZfZ7v7n1: "Miscellaneous",
  };

  return (
    categoryMap[categoryId] ||
    `Category ${categoryId.substring(categoryId.length - 4)}`
  );
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [isEditingLocations, setIsEditingLocations] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [locationObjects, setLocationObjects] = useState<Location[]>([]);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [savedEventDetails, setSavedEventDetails] = useState<Event[]>([]);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (loggedIn) {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Get user preferences
          const prefsData = localStorage.getItem("userPreferences");
          if (prefsData) {
            const prefs = JSON.parse(prefsData);
            if (prefs.categories) {
              setSelectedCategoryIds(prefs.categories);
            }
            if (prefs.locations) {
              // Only used to initialize locationObjects
              const cityNames = prefs.locations;

              // Try to get location objects with coordinates
              try {
                const locationDetailsData = localStorage.getItem(
                  "userLocationsDetail"
                );
                if (locationDetailsData) {
                  const locationDetails = JSON.parse(locationDetailsData);
                  const currentLocation =
                    localStorage.getItem("currentLocation");

                  // Convert location details to Location objects with isCurrent flag
                  const locations = locationDetails.map(
                    (loc: {
                      city: string;
                      latitude?: number;
                      longitude?: number;
                    }) => ({
                      city: loc.city,
                      isCurrent: loc.city === currentLocation,
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                    })
                  );

                  setLocationObjects(locations);
                } else {
                  // If no detailed data, create basic objects from city names
                  const currentLocation =
                    localStorage.getItem("currentLocation");
                  const locations = cityNames.map((city: string) => ({
                    city,
                    isCurrent: city === currentLocation,
                  }));
                  setLocationObjects(locations);
                }
              } catch (error) {
                console.error("Error parsing location details:", error);
                // Fallback to basic objects
                const currentLocation = localStorage.getItem("currentLocation");
                const locations = cityNames.map((city: string) => ({
                  city,
                  isCurrent: city === currentLocation,
                }));
                setLocationObjects(locations);
              }
            }
          }
        }

        // Fetch categories
        fetchCategories();

        // Load saved events
        loadSavedEvents();
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    setIsLoading(false);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSavedEvents = async (loadAll = false) => {
    try {
      // Get saved event IDs from localStorage
      const savedData = localStorage.getItem("savedEvents");
      if (savedData) {
        const savedIds = JSON.parse(savedData);
        setSavedEvents(savedIds);

        // If there are saved events, fetch their details
        if (savedIds.length > 0) {
          // Get event details for each saved event ID (limit to 5 for profile view, unless loadAll is true)
          const eventsToShow = loadAll ? savedIds : savedIds.slice(0, 5);
          const eventDetails = await Promise.all(
            eventsToShow.map(async (id: string) => {
              try {
                const response = await fetch(`/api/events/${id}`);
                if (response.ok) {
                  const data = await response.json();
                  return data.event;
                }
              } catch (error) {
                console.error(`Error fetching event ${id}:`, error);
              }
              return null;
            })
          );

          // Filter out any null values from failed requests
          setSavedEventDetails(eventDetails.filter(Boolean));
        }
      } else {
        setSavedEvents([]);
      }
    } catch (error) {
      console.error("Error loading saved events:", error);
      setSavedEvents([]);
    }
  };

  const handleCategorySelection = (categories: string[]) => {
    try {
      // Update local state
      setSelectedCategoryIds(categories);

      // Update preferences in localStorage
      const prefsData = localStorage.getItem("userPreferences");
      let prefs: UserPreferences = {
        categories: [],
        locations: [],
        maxPrice: 1000,
      };

      if (prefsData) {
        prefs = JSON.parse(prefsData);
      }

      prefs.categories = categories;
      localStorage.setItem("userPreferences", JSON.stringify(prefs));

      // Update user object
      if (user) {
        const updatedUser = {
          ...user,
          preferences: prefs,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      // Close edit mode
      setIsEditingInterests(false);
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const handleLocationsChange = (updatedLocations: Location[]) => {
    try {
      // First update the local state directly to ensure UI updates
      setLocationObjects([...updatedLocations]);

      // Update preferences in localStorage
      const prefsData = localStorage.getItem("userPreferences");
      let prefs: UserPreferences = {
        categories: [],
        locations: [],
        maxPrice: 1000,
      };

      if (prefsData) {
        prefs = JSON.parse(prefsData);
      }

      // Extract city names for the preferences
      prefs.locations = updatedLocations.map((loc) => loc.city);
      localStorage.setItem("userPreferences", JSON.stringify(prefs));

      // Store the detailed location data separately
      const locationDetails = updatedLocations.map((loc) => ({
        city: loc.city,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
      localStorage.setItem(
        "userLocationsDetail",
        JSON.stringify(locationDetails)
      );

      // Find current location
      const currentLocation = updatedLocations.find((loc) => loc.isCurrent);
      if (currentLocation) {
        localStorage.setItem("currentLocation", currentLocation.city);

        // Also save current location coordinates if available
        if (currentLocation.latitude && currentLocation.longitude) {
          localStorage.setItem(
            "currentLocationCoords",
            JSON.stringify({
              lat: currentLocation.latitude,
              lon: currentLocation.longitude,
            })
          );
        }
      } else if (updatedLocations.length > 0) {
        // If no current location is set but we have locations, set the first one as current
        localStorage.setItem("currentLocation", updatedLocations[0].city);
      } else {
        // No locations at all
        localStorage.removeItem("currentLocation");
        localStorage.removeItem("currentLocationCoords");
      }

      // Update user object
      if (user) {
        const updatedUser = {
          ...user,
          preferences: prefs,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      // Force a re-render after a short delay to ensure state updates properly
      setTimeout(() => {
        setLocationObjects((prev) => [...prev]);
      }, 50);
    } catch (error) {
      console.error("Error updating location preferences:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-gray-200 h-24 w-24 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Not Logged In
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in to view your profile
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-primary-600 px-6 py-12 text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  className="rounded-full border-4 border-white w-full h-full object-cover"
                  fill
                />
              </div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-primary-100 flex items-center justify-center mt-2">
                <FaEnvelope className="mr-2" />
                {user.email}
              </p>
            </div>

            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <FaUser className="mr-2 text-primary-600" />
                    Account Information
                  </h2>
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <span className="font-medium">Name:</span> {user.name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                    <p>
                      <span className="font-medium">Member since:</span>{" "}
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Account Settings
                  </h2>
                  <div className="space-y-2">
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors w-full">
                      Edit Profile
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-full">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Interests Section */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Interests
                  </h2>
                  <button
                    onClick={() => setIsEditingInterests(!isEditingInterests)}
                    className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
                  >
                    <FaEdit className="mr-1" />
                    {isEditingInterests ? "Cancel" : "Edit"}
                  </button>
                </div>

                {isEditingInterests ? (
                  <div className="mt-4">
                    <CategorySelection
                      onComplete={handleCategorySelection}
                      initialSelectedCategories={selectedCategoryIds}
                    />
                  </div>
                ) : (
                  <div>
                    {selectedCategoryIds.length > 0 ? (
                      <div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCategoryIds.map((categoryId) => {
                            // Find the category in loaded categories
                            const category = categories.find(
                              (c) => c.id === categoryId
                            );

                            return (
                              <span
                                key={categoryId}
                                className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center"
                              >
                                {getCategoryIcon(category?.name || categoryId)}
                                <span className="ml-1">
                                  {category?.name ||
                                    getCategoryNameById(categoryId)}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 mt-2">
                        You haven&apos;t selected any interests yet.
                        <button
                          onClick={() => setIsEditingInterests(true)}
                          className="text-primary-600 hover:underline ml-1"
                        >
                          Add some now
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Locations Section */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Locations
                  </h2>
                  <button
                    onClick={() => {
                      // If exiting edit mode, add a small delay to ensure state updates
                      if (isEditingLocations) {
                        // First force a re-render of location objects to capture any changes
                        setLocationObjects((prev) => [...prev]);

                        // Then exit edit mode after a short delay
                        setTimeout(() => {
                          setIsEditingLocations(false);
                        }, 100);
                      } else {
                        // Entering edit mode is immediate
                        setIsEditingLocations(true);
                      }
                    }}
                    className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
                  >
                    <FaEdit className="mr-1" />
                    {isEditingLocations ? "Done" : "Edit"}
                  </button>
                </div>

                {/* This key forces re-render when editing mode or locations change */}
                <div
                  key={`locations-${isEditingLocations}-${JSON.stringify(
                    locationObjects
                  )}`}
                >
                  {isEditingLocations ? (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-3">
                        Search for a city to add it to your locations. Click on
                        a search result to add it.
                      </p>
                      <LocationSelector
                        initialLocations={locationObjects}
                        onLocationsChange={handleLocationsChange}
                      />
                    </div>
                  ) : (
                    <div>
                      {locationObjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {locationObjects.map((location, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 flex items-center rounded-full text-sm ${
                                location.isCurrent
                                  ? "bg-primary-100 text-primary-800 border border-primary-300"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <FaMapMarkerAlt className="mr-1" size={10} />
                              {location.city}
                              {location.isCurrent && (
                                <span className="ml-1 text-xs bg-primary-800 text-white px-1.5 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-2">
                          You haven&apos;t added any locations yet.
                          <button
                            onClick={() => setIsEditingLocations(true)}
                            className="text-primary-600 hover:underline ml-1"
                          >
                            Add some now
                          </button>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg" id="saved">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Activity
                </h2>
                <div className="space-y-2 text-gray-700">
                  {savedEvents.length > 0 ? (
                    <div>
                      <p className="mb-3">
                        You have saved {savedEvents.length} event
                        {savedEvents.length !== 1 ? "s" : ""}.
                      </p>

                      {savedEventDetails.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          {savedEventDetails.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center p-2 bg-white rounded-lg border border-gray-200"
                            >
                              <div className="flex-shrink-0 w-16 h-16 relative overflow-hidden rounded-md mr-3">
                                <Image
                                  src={
                                    event.images?.[0]?.url ||
                                    "/placeholder-event.jpg"
                                  }
                                  alt={event.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/events/${event.id}`}
                                  className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline truncate block"
                                >
                                  {event.name}
                                </Link>
                                <p className="text-xs text-gray-600 truncate">
                                  {new Date(
                                    event.startDate
                                  ).toLocaleDateString()}{" "}
                                  at {event.venue.city}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {savedEvents.length > 5 && (
                        <button
                          onClick={() => loadSavedEvents(true)}
                          className="text-primary-600 hover:text-primary-700 font-medium inline-block mt-2"
                        >
                          View all saved events
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p>You haven&apos;t saved any events yet.</p>
                      <Link
                        href="/events"
                        className="text-primary-600 hover:text-primary-700 font-medium inline-block mt-2"
                      >
                        Browse events
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
