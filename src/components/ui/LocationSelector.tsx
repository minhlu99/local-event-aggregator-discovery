"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaLocationArrow,
  FaMapMarkerAlt,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimesCircle,
} from "react-icons/fa";

export interface Location {
  city: string;
  isCurrent: boolean;
  latitude?: number;
  longitude?: number;
}

interface LocationResult {
  city: string;
  display_name: string;
  latitude: number;
  longitude: number;
}

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

interface LocationSelectorProps {
  initialLocations: Location[];
  onLocationsChange: (locations: Location[]) => void;
}

export default function LocationSelector({
  initialLocations,
  onLocationsChange,
}: LocationSelectorProps) {
  // Use props directly as initial state
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [newLocation, setNewLocation] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showLocationError, setShowLocationError] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Simple update function without circular logic
  const updateLocations = useCallback(
    (newLocations: Location[]) => {
      setLocations(newLocations);
      onLocationsChange(newLocations);
    },
    [onLocationsChange]
  );

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    // Skip if empty input
    if (!newLocation.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set searching state
    setIsSearching(true);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for debounce
    searchTimeout.current = setTimeout(async () => {
      // Perform search after timeout
      if (!newLocation.trim()) return;

      try {
        // Use the Nominatim API for geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            newLocation.trim()
          )}&limit=5&addressdetails=1`
        );

        if (!response.ok) {
          throw new Error("Failed to validate city");
        }

        const data = await response.json();

        if (data && data.length > 0) {
          // Transform the results into our format
          const results: LocationResult[] = data.map(
            (place: NominatimPlace) => {
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
                city: cityName,
                display_name: place.display_name,
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon),
              };
            }
          );

          setSearchResults(results);
        } else {
          setLocationError(
            "No locations found. Please try a different search term."
          );
          setShowLocationError(true);
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching locations:", error);
        setLocationError("Failed to search locations. Please try again.");
        setShowLocationError(true);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [newLocation]);

  const handleAddLocation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newLocation.trim()) return;

    // Manual search is handled separately to avoid useCallback issues
    const manualSearch = async () => {
      if (!newLocation.trim()) return;

      setIsSearching(true);
      setLocationError("");
      setShowLocationError(false);

      try {
        // Use the Nominatim API for geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            newLocation.trim()
          )}&limit=5&addressdetails=1`
        );

        if (!response.ok) {
          throw new Error("Failed to validate city");
        }

        const data = await response.json();

        if (data && data.length > 0) {
          // Transform the results into our format
          const results: LocationResult[] = data.map(
            (place: NominatimPlace) => {
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
                city: cityName,
                display_name: place.display_name,
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon),
              };
            }
          );

          setSearchResults(results);
        } else {
          setLocationError(
            "No locations found. Please try a different search term."
          );
          setShowLocationError(true);
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching locations:", error);
        setLocationError("Failed to search locations. Please try again.");
        setShowLocationError(true);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // If form is manually submitted, clear timeout and search immediately
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    manualSearch();
  };

  const addLocationFromResult = (result: LocationResult) => {
    // Check if this location already exists
    const locationExists = locations.some(
      (loc) => loc.city.toLowerCase() === result.city.toLowerCase()
    );

    if (locationExists) {
      setLocationError("This location is already in your list");
      setShowLocationError(true);
    } else {
      // Create the new location object
      const newLocationObject = {
        city: result.city,
        isCurrent: false, // By default not current
        latitude: result.latitude,
        longitude: result.longitude,
      };

      // Add to state and update parent
      const updatedLocations = [...locations, newLocationObject];
      updateLocations(updatedLocations);

      // Clear input, errors, and search results
      setNewLocation("");
      setLocationError("");
      setShowLocationError(false);
      setSearchResults([]);
    }
  };

  const removeLocation = (cityToRemove: string) => {
    const updatedLocations = locations.filter(
      (location) => location.city !== cityToRemove
    );
    updateLocations(updatedLocations);
  };

  const setAsCurrentLocation = (city: string) => {
    // Mark the selected city as current and others as not current
    const updatedLocations = locations.map((loc) => ({
      ...loc,
      isCurrent: loc.city === city,
    }));

    updateLocations(updatedLocations);
  };

  const getCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser. Please enter your location manually."
      );
      return;
    }

    setDetectingLocation(true);
    setLocationError("");
    setShowLocationError(false);
    setSearchResults([]);

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
              // Check if this location already exists
              const locationExists = locations.some(
                (loc) => loc.city.toLowerCase() === cityName.toLowerCase()
              );

              if (!locationExists) {
                // Create updated locations array with the new location as current
                const updatedLocations = [
                  ...locations.map((loc) => ({ ...loc, isCurrent: false })),
                  {
                    city: cityName,
                    isCurrent: true,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  },
                ];

                updateLocations(updatedLocations);
                setLocationError("");
                setShowLocationError(false);
              } else {
                // Location exists, just make it current
                setAsCurrentLocation(cityName);
                setLocationError("");
                setShowLocationError(false);
              }
            } else {
              setLocationError(
                "Couldn't determine your city. Please enter a location manually."
              );
              setShowLocationError(true);
            }
          } catch (error) {
            console.error("Error getting location data:", error);
            setLocationError(
              "Failed to get your location. Please enter a location manually."
            );
            setShowLocationError(true);
          } finally {
            setDetectingLocation(false);
          }
        },
        (error) => {
          if (error.code === 1) {
            // PERMISSION_DENIED
            localStorage.setItem("locationPermissionDenied", "true");
            setLocationError(
              "Location access was denied. Please enable location in your browser settings."
            );
          } else if (error.code === 2) {
            // POSITION_UNAVAILABLE
            setLocationError(
              "Your current position is unavailable. Please try again or enter a location manually."
            );
          } else if (error.code === 3) {
            // TIMEOUT
            setLocationError(
              "Location request timed out. Please try again or enter a location manually."
            );
          } else {
            setLocationError(
              "Couldn't get your location. Please enter a location manually."
            );
          }

          setShowLocationError(true);
          setDetectingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (generalError) {
      console.error("General geolocation error:", generalError);
      setLocationError(
        "An unexpected error occurred while trying to get your location. Please enter a location manually."
      );
      setShowLocationError(true);
      setDetectingLocation(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="max-w-md mx-auto mb-4">
        <button
          type="button"
          onClick={getCurrentLocation}
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
      </div>

      <form onSubmit={handleAddLocation} className="max-w-md mx-auto mb-6">
        <div className="flex items-center border rounded-md overflow-hidden bg-white mb-2">
          <div className="px-3 text-gray-400">
            <FaMapMarkerAlt />
          </div>
          <input
            type="text"
            placeholder="Enter a city"
            className="w-full py-3 px-2 outline-none bg-white text-gray-800"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            disabled={detectingLocation}
          />
          <div className="p-3 text-gray-400">
            {isSearching && <FaSpinner className="animate-spin" size={14} />}
            {!isSearching && newLocation.trim() && (
              <FaSearch size={14} className="text-primary-700" />
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div
            ref={searchResultsRef}
            className="relative max-w-md mx-auto mb-6 z-10"
          >
            <div className="absolute top-0 left-0 right-0 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
              <div className="p-2 border-b bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  Search Results
                </span>
              </div>
              <ul>
                {searchResults.map((result, index) => (
                  <li
                    key={index}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <button
                      type="button"
                      onClick={() => addLocationFromResult(result)}
                      className="w-full flex items-center justify-between p-3 text-left"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {result.city}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {result.display_name}
                        </div>
                      </div>
                      <div className="text-primary-600 ml-2">
                        <FaPlus size={14} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {showLocationError && locationError && (
          <div className="text-red-600 text-xs mt-1 text-left pl-2 mb-4">
            {locationError}
          </div>
        )}
      </form>

      {/* Location chips/tags */}
      <div className="max-w-md mx-auto">
        <div className="space-y-2">
          {locations.map((location, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
            >
              <div className="flex items-center">
                <FaMapMarkerAlt className="text-gray-400 mr-2" size={14} />
                <span className="text-gray-800">{location.city}</span>
                {location.isCurrent ? (
                  <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => setAsCurrentLocation(location.city)}
                    className="ml-2 text-xs text-primary-600 hover:text-primary-800 underline"
                  >
                    Set as default
                  </button>
                )}
              </div>
              <button
                onClick={() => removeLocation(location.city)}
                className="text-red-500 hover:text-red-700"
                aria-label={`Remove ${location.city}`}
              >
                <FaTimesCircle size={16} />
              </button>
            </div>
          ))}

          {locations.length === 0 && (
            <p className="text-gray-600 text-center py-4">
              You haven&apos;t added any locations yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
