"use client";

import CategorySelection from "@/components/ui/CategorySelection";
import { UserPreferences } from "@/types";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaCalendar,
  FaCheck,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaSearch,
  FaSpinner,
  FaTimesCircle,
} from "react-icons/fa";

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface UserData {
  name: string;
  email: string;
  avatar: string;
  preferences?: UserPreferences;
}

interface Location {
  city: string;
  isCurrent: boolean;
  latitude?: number;
  longitude?: number;
}

interface LocationSearchResult {
  displayName: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Define Nominatim API response type
interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    [key: string]: string | undefined;
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [validatingCity, setValidatingCity] = useState(false);
  const [locationDetectionState, setLocationDetectionState] = useState<
    "idle" | "detecting" | "success" | "error"
  >("idle");
  const [locationError, setLocationError] = useState("");
  const [showLocationError, setShowLocationError] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<
    LocationSearchResult[]
  >([]);
  const [locationDetectionStartTime, setLocationDetectionStartTime] =
    useState<number>(0);
  const MIN_DETECTION_TIME = 5000; // Minimum 5 seconds of showing loading state

  // Apply debounce to the location input
  const debouncedLocationInput = useDebounce(locationInput, 500);

  // Keep track of the latest search request
  const latestSearchRef = useRef<string>("");

  // Add a ref to keep track of the location timeout
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCategorySelection = (categories: string[]) => {
    setSelectedCategories(categories);
    setStep(2);
  };

  const searchLocations = useCallback(async () => {
    const searchTerm = locationInput.trim();
    if (!searchTerm) return;

    // Store this search term as the latest search
    const currentSearch = searchTerm;
    latestSearchRef.current = currentSearch;

    setValidatingCity(true);
    setLocationError("");
    setShowLocationError(false);
    setLocationSearchResults([]);

    try {
      // Use the Nominatim API for geocoding - it's free and doesn't require API key
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchTerm
        )}&limit=5&addressdetails=1`
      );

      // Check if this is still the latest search request
      if (latestSearchRef.current !== currentSearch) {
        // A newer search has been initiated, discard these results
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to search locations");
      }

      const data = (await response.json()) as NominatimPlace[];

      // Check again if this is still the latest search after awaiting the response
      if (latestSearchRef.current !== currentSearch) {
        // A newer search has been initiated, discard these results
        return;
      }

      if (data && data.length > 0) {
        // Process search results
        const results: LocationSearchResult[] = data.map((place) => {
          const address = place.address;
          // Try to get the most accurate city name
          const cityName =
            address.city ||
            address.town ||
            address.village ||
            address.county ||
            address.state ||
            place.display_name.split(",")[0];

          return {
            displayName: place.display_name,
            city: cityName,
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
          };
        });

        setLocationSearchResults(results);
      } else {
        // Check again if this is still the latest search
        if (latestSearchRef.current !== currentSearch) {
          return;
        }
        setLocationError(
          "No locations found. Please try a different search term."
        );
        setShowLocationError(true);
      }
    } catch {
      // Check if this is still the latest search
      if (latestSearchRef.current !== currentSearch) {
        return;
      }
      setLocationError("Failed to search locations. Please try again.");
      setShowLocationError(true);
    } finally {
      // Only update loading state if this is still the latest search
      if (latestSearchRef.current === currentSearch) {
        setValidatingCity(false);
      }
    }
  }, [locationInput]);

  // Auto-search when debounced input changes
  useEffect(() => {
    if (debouncedLocationInput.trim().length >= 2) {
      searchLocations();
    } else {
      setLocationSearchResults([]);
    }
  }, [debouncedLocationInput, searchLocations]);

  const handleLocationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Prevent duplicate searches since we're using debounce
    if (debouncedLocationInput !== locationInput) {
      searchLocations();
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!loggedIn) {
      // Redirect to login if not logged in
      router.push("/auth/login");
      return;
    }

    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Check if user already has preferences
        if (localStorage.getItem("userPreferences")) {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/auth/login");
    }
  }, [router]);

  const addLocationFromResult = (result: LocationSearchResult) => {
    // Check if this location already exists
    const locationExists = preferredLocations.some(
      (loc) => loc.city.toLowerCase() === result.city.toLowerCase()
    );

    if (locationExists) {
      setLocationError("This location is already in your list");
      setShowLocationError(true);
    } else {
      // Add valid location with coordinates
      setPreferredLocations([
        ...preferredLocations,
        {
          city: result.city,
          isCurrent: false,
          latitude: result.latitude,
          longitude: result.longitude,
        },
      ]);
      setLocationInput("");
      setLocationError("");
      setShowLocationError(false);
      setLocationSearchResults([]);
    }
  };

  const removeLocation = (index: number) => {
    setPreferredLocations(preferredLocations.filter((_, i) => i !== index));
  };

  const detectCurrentLocation = () => {
    // Reset all states
    setDetectingLocation(true);
    setLocationDetectionState("detecting");
    setLocationError("");
    setShowLocationError(false);
    setLocationDetectionStartTime(Date.now());

    // Clear any existing timeout
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
      locationTimeoutRef.current = null;
    }

    // Check if running in a browser environment
    if (typeof window === "undefined" || !navigator.geolocation) {
      // Calculate how long to wait before showing error
      const timeElapsed = Date.now() - locationDetectionStartTime;
      const waitTime = Math.max(0, MIN_DETECTION_TIME - timeElapsed);

      setTimeout(() => {
        setLocationError(
          "Geolocation is not supported by your browser. Please enter your location manually."
        );
        setLocationDetectionState("error");
        setShowLocationError(true);
        setDetectingLocation(false);
      }, waitTime);
      return;
    }

    try {
      // Ensure we don't show error messages prematurely
      let locationProcessed = false;

      // Set a timeout for the entire geolocation process - this is for the minimum spinner display
      locationTimeoutRef.current = setTimeout(() => {
        // Only trigger this if we're still detecting (no success callback happened)
        if (locationDetectionState === "detecting") {
          console.log("Location detection still in progress...");
        }
      }, 1000);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // Mark that we've started processing the location
            locationProcessed = true;

            try {
              // Get coordinates
              const latitude = position.coords.latitude;
              const longitude = position.coords.longitude;

              // Use reverse geocoding to get the city name
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );

              if (!response.ok) {
                handleGeolocationError(
                  "Failed to get location information",
                  true
                );
                return;
              }

              const data = await response.json();
              const cityName =
                data.city || data.locality || data.principalSubdivision;

              if (cityName) {
                // Check if this location already exists
                const locationExists = preferredLocations.some(
                  (loc) => loc.city.toLowerCase() === cityName.toLowerCase()
                );

                if (!locationExists) {
                  // Add as current location with coordinates, and mark any previous current as not current
                  setPreferredLocations([
                    ...preferredLocations.map((loc) => ({
                      ...loc,
                      isCurrent: false,
                    })),
                    {
                      city: cityName,
                      isCurrent: true,
                      latitude,
                      longitude,
                    },
                  ]);
                }

                // Clear any location error since we successfully got the location
                setLocationError("");
                setShowLocationError(false);
                setLocationDetectionState("success");

                // Clear the timeout since we got a response
                if (locationTimeoutRef.current) {
                  clearTimeout(locationTimeoutRef.current);
                  locationTimeoutRef.current = null;
                }

                // Ensure we display the spinner for at least the minimum time
                const timeElapsed = Date.now() - locationDetectionStartTime;
                const waitTime = Math.max(0, MIN_DETECTION_TIME - timeElapsed);

                setTimeout(() => {
                  setDetectingLocation(false);
                }, waitTime);
              } else {
                handleGeolocationError(
                  "Couldn't determine your city. Please enter it manually.",
                  true
                );
              }
            } catch {
              handleGeolocationError(
                "Failed to get your location details. Please enter it manually.",
                true
              );
            }
          },
          (error) => {
            // Only process error if we haven't already processed location successfully
            if (locationProcessed) return;

            // Attempt to detect Chrome extension interference
            const errorString = String(error);
            const isExtensionError =
              errorString.includes("chrome-extension") ||
              (error.message && error.message.includes("chrome-extension")) ||
              document.URL.includes("chrome-extension");

            // Handle specific error codes
            let errorMessage = "";
            if (isExtensionError) {
              errorMessage =
                "A browser extension is blocking location access. Try disabling extensions or using incognito mode.";
            } else {
              switch (error.code) {
                case 1: // PERMISSION_DENIED
                  errorMessage =
                    "Location permission denied. To enable location detection, please allow location access in your browser settings and try again.";
                  break;
                case 2: // POSITION_UNAVAILABLE
                  errorMessage =
                    "Your current position is unavailable. The GPS signal might be obstructed or your device may not have GPS capabilities.";
                  break;
                case 3: // TIMEOUT
                  errorMessage =
                    "Location request timed out. Please try again or enter your location manually.";
                  break;
                default:
                  errorMessage =
                    "Couldn't get your location. Please enter it manually.";
              }
            }

            handleGeolocationError(errorMessage, false);
          },
          {
            enableHighAccuracy: true, // Request the best possible position
            timeout: 20000, // Wait up to 20 seconds for the device to respond
            maximumAge: 0, // Don't use a cached position
          }
        );
      }
    } catch {
      handleGeolocationError(
        "An unexpected error occurred while trying to get your location. Please enter it manually.",
        false
      );
    }
  };

  // Helper function to handle geolocation errors with minimum display time
  const handleGeolocationError = (
    errorMessage: string,
    fromSuccess: boolean
  ) => {
    const timeElapsed = Date.now() - locationDetectionStartTime;
    const waitTime = Math.max(0, MIN_DETECTION_TIME - timeElapsed);

    // Always wait at least the minimum time before showing error
    setTimeout(() => {
      // Clear the timeout since we're handling the error
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
        locationTimeoutRef.current = null;
      }

      // If this error is from the success path (meaning we got coordinates but failed to get city),
      // we should display it only if we're still in detecting state
      if (fromSuccess && locationDetectionState !== "detecting") {
        return;
      }

      setLocationError(errorMessage);
      setLocationDetectionState("error");
      setShowLocationError(true);
      setDetectingLocation(false);
    }, waitTime);
  };

  const skipOnboarding = () => {
    router.push("/");
  };

  const continueToNext = () => {
    if (preferredLocations.length > 0) {
      setStep(3);
      setLocationError("");
      setShowLocationError(false);
    } else {
      setLocationError("Please add at least one location");
      setShowLocationError(true);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      // Create location objects with coordinates for storage
      const locationObjects = preferredLocations.map((loc) => ({
        city: loc.city,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));

      // Check if there's no location marked as current, set the first one as current
      const currentLocationExists = preferredLocations.some(
        (loc) => loc.isCurrent
      );
      let locationsToUse = preferredLocations;

      if (!currentLocationExists && preferredLocations.length > 0) {
        locationsToUse = [
          { ...preferredLocations[0], isCurrent: true },
          ...preferredLocations.slice(1),
        ];
      }

      // In a real app, you would send this data to your backend
      // For now, we'll just store it in localStorage
      const preferences: UserPreferences = {
        categories: selectedCategories,
        // Store full location objects now instead of just city names
        locations: locationsToUse.map((loc) => loc.city),
        maxPrice: 1000,
      };

      // Store the detailed location data separately for recommendation engine
      localStorage.setItem(
        "userLocationsDetail",
        JSON.stringify(locationObjects)
      );
      localStorage.setItem("userPreferences", JSON.stringify(preferences));

      // Save current location separately for quick access
      const currentLocation = locationsToUse.find((loc) => loc.isCurrent);
      if (currentLocation) {
        localStorage.setItem("currentLocation", currentLocation.city);

        // Also save current location coordinates for quick access
        if (currentLocation.latitude && currentLocation.longitude) {
          localStorage.setItem(
            "currentLocationCoords",
            JSON.stringify({
              lat: currentLocation.latitude,
              lon: currentLocation.longitude,
            })
          );
        }
      }

      // Update the user object to include preferences
      if (user) {
        const updatedUser = {
          ...user,
          preferences,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      // Redirect to home page or dashboard
      router.push("/");
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Loading state handled by useEffect redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center">
            <div className="text-primary-600">
              <FaCalendar size={24} />
            </div>
            <span className="font-bold text-xl text-gray-900 ml-2">
              EventFinder
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome to EventFinder!
                  </h1>
                  <button
                    onClick={skipOnboarding}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Skip for now
                  </button>
                </div>

                {/* Progress indicator */}
                <div className="mb-8">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span
                      className={
                        step >= 1 ? "text-primary-600 font-medium" : ""
                      }
                    >
                      Select interests
                    </span>
                    <span
                      className={
                        step >= 2 ? "text-primary-600 font-medium" : ""
                      }
                    >
                      Location
                    </span>
                    <span
                      className={
                        step >= 3 ? "text-primary-600 font-medium" : ""
                      }
                    >
                      Finish
                    </span>
                  </div>
                </div>

                {step === 1 && (
                  <CategorySelection onComplete={handleCategorySelection} />
                )}

                {step === 2 && (
                  <div className="text-center px-4 py-8">
                    <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FaMapMarkerAlt className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Where are you located?
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Adding your locations helps us find nearby events and
                      provide relevant recommendations. You can add multiple
                      locations if you travel frequently.
                    </p>

                    <div className="max-w-md mx-auto mb-4">
                      <button
                        type="button"
                        onClick={detectCurrentLocation}
                        disabled={detectingLocation}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-lg font-medium transition-colors mb-4 ${
                          detectingLocation
                            ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                            : "border-primary-500 text-primary-600 hover:bg-primary-50"
                        }`}
                      >
                        {detectingLocation ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            <span>Getting your location...</span>
                          </>
                        ) : locationDetectionState === "error" ? (
                          <>
                            <FaLocationArrow className="mr-2" />
                            <span>Try again</span>
                          </>
                        ) : (
                          <>
                            <FaLocationArrow className="mr-2" />
                            <span>Use current location</span>
                          </>
                        )}
                      </button>

                      {locationDetectionState === "error" &&
                        showLocationError &&
                        locationError && (
                          <div className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-4 text-sm">
                            {locationError}
                          </div>
                        )}
                    </div>

                    <form
                      onSubmit={handleLocationSubmit}
                      className="max-w-md mx-auto mb-6"
                    >
                      <div className="flex items-center border rounded-md overflow-hidden bg-white mb-2">
                        <div className="px-3 text-gray-400">
                          <FaMapMarkerAlt />
                        </div>
                        <input
                          type="text"
                          placeholder="Enter a city (min. 2 characters)"
                          className="w-full py-3 px-2 outline-none bg-white text-gray-800"
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                        />
                        <div
                          className={`p-3 ${
                            validatingCity
                              ? "bg-gray-100 text-gray-400"
                              : "bg-primary-100 text-primary-700"
                          }`}
                        >
                          {validatingCity ? (
                            <FaSpinner className="animate-spin" size={14} />
                          ) : locationInput !== debouncedLocationInput ? (
                            <FaSpinner className="animate-spin" size={14} />
                          ) : (
                            <FaSearch size={14} />
                          )}
                        </div>
                      </div>
                    </form>

                    {/* Location search results */}
                    {locationSearchResults.length > 0 && (
                      <div className="max-w-md mx-auto mb-6 bg-white rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 p-3 border-b border-gray-200">
                          Select a location
                        </h3>
                        <ul className="divide-y divide-gray-200">
                          {locationSearchResults.map((result, index) => (
                            <li key={index}>
                              <button
                                className="w-full text-left p-3 hover:bg-gray-50 transition duration-150 flex items-start"
                                onClick={() => addLocationFromResult(result)}
                              >
                                <FaMapMarkerAlt
                                  className="flex-shrink-0 text-gray-400 mt-1 mr-2"
                                  size={14}
                                />
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {result.city}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {result.displayName}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Location chips/tags */}
                    <div className="max-w-md mx-auto mb-8">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {preferredLocations.map((location, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-1 py-1 px-3 rounded-full text-sm ${
                              location.isCurrent
                                ? "bg-primary-100 text-primary-700 border border-primary-300"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <FaMapMarkerAlt size={12} className="mr-1" />
                            {location.city}
                            {location.isCurrent && (
                              <span className="text-xs ml-1">(default)</span>
                            )}
                            <button
                              onClick={() => removeLocation(index)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                              aria-label="Remove location"
                            >
                              <FaTimesCircle size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={continueToNext}
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="text-center px-4 py-8">
                    <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FaCheck className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Great choices!
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      We&apos;ll use your preferences to recommend events that
                      match your interests in
                      {preferredLocations.length > 0
                        ? preferredLocations.length === 1
                          ? ` ${preferredLocations[0].city}`
                          : ` ${preferredLocations.length} locations`
                        : ""}
                      . You can always update these preferences later.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => setStep(2)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={completeOnboarding}
                        disabled={loading}
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-70"
                      >
                        {loading ? "Setting up..." : "Get started"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
