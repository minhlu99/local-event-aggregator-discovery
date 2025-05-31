"use client";

import CategorySelection from "@/components/ui/CategorySelection";
import { UserPreferences } from "@/types";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaCalendar,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaSearch,
  FaSpinner,
  FaTimesCircle,
} from "react-icons/fa";

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

  const handleCategorySelection = (categories: string[]) => {
    setSelectedCategories(categories);
    setStep(2);
  };

  const handleLocationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    validateAndAddLocation();
  };

  const validateAndAddLocation = async () => {
    if (!locationInput.trim()) return;

    setValidatingCity(true);
    setLocationError("");
    setShowLocationError(false);

    try {
      // Use the Nominatim API for geocoding - it's free and doesn't require API key
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationInput.trim()
        )}&limit=1&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error("Failed to validate city");
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Get city from the response
        const place = data[0];
        const address = place.address;

        // Try to get the most accurate city name
        const cityName =
          address.city ||
          address.town ||
          address.village ||
          address.county ||
          address.state ||
          place.display_name.split(",")[0];

        // Get coordinates
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        if (cityName) {
          // Check if this location already exists
          const locationExists = preferredLocations.some(
            (loc) => loc.city.toLowerCase() === cityName.toLowerCase()
          );

          if (locationExists) {
            setLocationError("This location is already in your list");
            setShowLocationError(true);
          } else {
            // Add valid location with coordinates
            setPreferredLocations([
              ...preferredLocations,
              {
                city: cityName,
                isCurrent: false,
                latitude: lat,
                longitude: lon,
              },
            ]);
            setLocationInput("");
            setLocationError("");
            setShowLocationError(false);
          }
        } else {
          setLocationError(
            "Couldn't identify a valid city. Please try again with a different search term."
          );
          setShowLocationError(true);
        }
      } else {
        setLocationError("City not found. Please enter a valid city name.");
        setShowLocationError(true);
      }
    } catch (error) {
      console.error("Error validating city:", error);
      setLocationError("Failed to validate city. Please try again.");
      setShowLocationError(true);
    } finally {
      setValidatingCity(false);
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

    // Check if running in a browser environment
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser. Please enter your location manually."
      );
      setLocationDetectionState("error");
      setShowLocationError(true);
      setDetectingLocation(false);
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Get coordinates
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Use reverse geocoding to get the city name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );

            if (!response.ok) {
              throw new Error("Failed to get location information");
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
            } else {
              setLocationError(
                "Couldn't determine your city. Please enter it manually."
              );
              setLocationDetectionState("error");
              setShowLocationError(true);
            }
          } catch (error) {
            console.error("Error getting location details:", error);
            setLocationError(
              "Failed to get your location details. Please enter it manually."
            );
            setLocationDetectionState("error");
            setShowLocationError(true);
          } finally {
            setDetectingLocation(false);
          }
        },
        (error) => {
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

          setLocationError(errorMessage);
          setLocationDetectionState("error");
          // Only show error after detection is complete
          setTimeout(() => {
            setShowLocationError(true);
            setDetectingLocation(false);
          }, 500);
        },
        {
          enableHighAccuracy: true, // Request the best possible position
          timeout: 15000, // Wait up to 15 seconds (increased from 10)
          maximumAge: 0, // Don't use a cached position
        }
      );
    } catch {
      setLocationError(
        "An unexpected error occurred while trying to get your location. Please enter it manually."
      );
      setLocationDetectionState("error");
      // Add a slight delay before showing the error
      setTimeout(() => {
        setShowLocationError(true);
        setDetectingLocation(false);
      }, 500);
    }
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

      // In a real app, you would send this data to your backend
      // For now, we'll just store it in localStorage
      const preferences: UserPreferences = {
        categories: selectedCategories,
        // Store full location objects now instead of just city names
        locations: preferredLocations.map((loc) => loc.city),
        maxPrice: 1000,
      };

      // Store the detailed location data separately for recommendation engine
      localStorage.setItem(
        "userLocationsDetail",
        JSON.stringify(locationObjects)
      );
      localStorage.setItem("userPreferences", JSON.stringify(preferences));

      // Save current location separately for quick access
      const currentLocation = preferredLocations.find((loc) => loc.isCurrent);
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
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-primary-500 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors mb-4"
                      >
                        {detectingLocation ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            <span>Getting your location...</span>
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
                          placeholder="Enter a city"
                          className="w-full py-3 px-2 outline-none bg-white text-gray-800"
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          disabled={validatingCity}
                        />
                        <button
                          type="submit"
                          disabled={validatingCity || !locationInput.trim()}
                          className={`p-3 ${
                            validatingCity || !locationInput.trim()
                              ? "bg-gray-100 text-gray-400"
                              : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                          }`}
                        >
                          {validatingCity ? (
                            <FaSpinner className="animate-spin" size={14} />
                          ) : (
                            <FaSearch size={14} />
                          )}
                        </button>
                      </div>
                      {showLocationError &&
                        locationError &&
                        !detectingLocation && (
                          <div className="text-red-600 text-xs mt-1 text-left pl-2">
                            {locationError}
                          </div>
                        )}
                    </form>

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
                              <span className="text-xs ml-1">(current)</span>
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
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
